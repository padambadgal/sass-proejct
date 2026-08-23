import Staff from '../models/Staff.js';
import Business from '../models/Business.js';
import Service from '../models/Service.js';
import { canCreateStaff } from '../utils/planLimits.js';

// Helper: Check business ownership
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) {
    throw new Error('Business not found or you do not own it');
  }
  return business;
};

// Helper: Validate that all service IDs exist and belong to the same business
const validateServices = async (serviceIds, businessId) => {
  if (!serviceIds || serviceIds.length === 0) return [];

  const services = await Service.find({
    _id: { $in: serviceIds },
    businessId,
    status: 'active',
  });
  if (services.length !== serviceIds.length) {
    throw new Error('One or more services are invalid or do not belong to this business');
  }
  return services.map(s => s._id);
};

// @desc    Add a new staff member
// @route   POST /api/staff
// @access  Private (requires active subscription)
export const createStaff = async (req, res, next) => {
  try {
    const { businessId, name, email, phone, services } = req.body;

    // Validate business ownership
    await validateBusinessOwnership(businessId, req.user._id);

    // Check staff limit
    const canCreate = await canCreateStaff(businessId);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'Staff limit reached for your current plan. Please upgrade to add more staff.',
      });
    }

    // Validate services (if provided)
    let validatedServiceIds = [];
    if (services && services.length > 0) {
      validatedServiceIds = await validateServices(services, businessId);
    }

    // Create staff
    const staff = await Staff.create({
      businessId,
      name,
      email: email || '',
      phone: phone || '',
      services: validatedServiceIds,
      status: 'active',
    });

    // Populate services for response
    await staff.populate('services');

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      data: staff,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it' ||
        error.message.startsWith('One or more services are invalid')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get all staff for a business
// @route   GET /api/staff?businessId=xxx
// @access  Private
export const getStaff = async (req, res, next) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId as a query parameter',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    const staff = await Staff.find({ businessId })
      .populate('services')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get a single staff member by ID
// @route   GET /api/staff/:id
// @access  Private
export const getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('services');
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    await validateBusinessOwnership(staff.businessId, req.user._id);

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update a staff member
// @route   PATCH /api/staff/:id
// @access  Private
export const updateStaff = async (req, res, next) => {
  try {
    let staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    await validateBusinessOwnership(staff.businessId, req.user._id);

    // Allowed fields
    const allowedUpdates = ['name', 'email', 'phone', 'services', 'status'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If services are being updated, validate them
    if (updates.services) {
      updates.services = await validateServices(updates.services, staff.businessId);
    }

    // Apply updates
    staff = await Staff.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('services');

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it' ||
        error.message.startsWith('One or more services are invalid')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Deactivate a staff member (soft delete)
// @route   DELETE /api/staff/:id
// @access  Private
export const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    await validateBusinessOwnership(staff.businessId, req.user._id);

    // Soft delete
    staff.status = 'inactive';
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff member deactivated successfully',
      data: { id: staff._id, status: staff.status },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};