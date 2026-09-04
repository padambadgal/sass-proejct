import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { getAvailableSlotTimes } from '../services/slotService.js';

// Helper: Check business ownership
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) {
    throw new Error('Business not found or you do not own it');
  }
  return business;
};


// @desc    Find or create a customer (used during booking)
// @route   POST /api/customers/find-or-create
// @access  Private (or could be internal)
export const findOrCreateCustomer = async (req, res, next) => {
  try {
    const { businessId, name, email, phone, notes } = req.body;

    if (!businessId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'businessId, name, and phone are required',
      });
    }

    // Validate business ownership
    await validateBusinessOwnership(businessId, req.user._id);

    // Try to find existing customer by phone or email
    let customer;
    const query = { businessId, status: 'active' };
    if (email) {
      query.email = email;
    } else if (phone) {
      query.phone = phone;
    }

    customer = await Customer.findOne(query);

    if (!customer) {
      // Create new customer
      customer = await Customer.create({
        businessId,
        name,
        email: email || '',
        phone,
        notes: notes || '',
        status: 'active',
        totalBookings: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: customer.isNew ? 'Customer created' : 'Customer found',
      data: customer,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this email or phone already exists for this business',
      });
    }
    next(error);
  }
};

// @desc    Get all customers for a business
// @route   GET /api/customers?businessId=xxx
// @access  Private
export const getCustomers = async (req, res, next) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId as a query parameter',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    const customers = await Customer.find({ businessId, status: 'active' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get a single customer by ID with booking history
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await validateBusinessOwnership(customer.businessId, req.user._id);

    // Fetch booking history for this customer
    const bookings = await Booking.find({
      businessId: customer.businessId,
      'customer.email': customer.email,
      'customer.phone': customer.phone,
    })
      .populate('serviceId', 'name price duration')
      .sort({ date: -1, startTime: -1 })
      .limit(50); // limit to recent 50

    res.status(200).json({
      success: true,
      data: {
        customer,
        bookings,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update customer details
// @route   PATCH /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await validateBusinessOwnership(customer.businessId, req.user._id);

    const allowedUpdates = ['name', 'email', 'phone', 'notes', 'status'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email or phone for this business',
      });
    }
    next(error);
  }
};

// @desc    Deactivate a customer (soft delete)
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await validateBusinessOwnership(customer.businessId, req.user._id);

    customer.status = 'inactive';
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully',
      data: { id: customer._id, status: customer.status },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get booking history for a customer (by email/phone)
// @route   GET /api/customers/history?businessId=xxx&email=xxx&phone=xxx
// @access  Private
export const getCustomerBookingHistory = async (req, res, next) => {
  try {
    const { businessId, email, phone } = req.query;
    if (!businessId || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId and either email or phone',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    // Find customer first
    const query = { businessId, status: 'active' };
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const customer = await Customer.findOne(query);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Fetch bookings
    const bookings = await Booking.find({
      businessId,
      'customer.email': customer.email,
      'customer.phone': customer.phone,
    })
      .populate('serviceId', 'name price duration')
      .sort({ date: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      data: {
        customer,
        bookings,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const customerBooking = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const bookings = await Booking.find({ 'customer.email': userEmail })
      .populate('businessId', 'name slug')
      .populate('serviceId', 'name price duration')
      .sort({ date: -1, startTime: 1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};