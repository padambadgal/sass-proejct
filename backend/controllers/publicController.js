import Business from '../models/Business.js';
import Service from '../models/Service.js';
import Availability from '../models/Availability.js';
import { generateAvailableSlots } from '../services/slotService.js';
import { createBooking } from '../services/bookingService.js';

// Helper: Find business by slug and ensure it's active
const findBusinessBySlug = async (slug) => {
  const business = await Business.findOne({ slug, isActive: true });
  if (!business) {
    throw new Error('Business not found');
  }
  return business;
};

// @desc    Get public business profile by slug
// @route   GET /api/public/business/:slug
// @access  Public
export const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const business = await findBusinessBySlug(slug);
    // Return only public fields
    res.status(200).json({
      success: true,
      data: {
        _id: business._id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        logo: business.logo,
        phone: business.phone,
        email: business.email,
        address: business.address,
        timezone: business.timezone,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get public services for a business
// @route   GET /api/public/business/:slug/services
// @access  Public
export const getPublicServices = async (req, res) => {
  try {
    const { slug } = req.params;
    const business = await findBusinessBySlug(slug);

    const services = await Service.find({
      businessId: business._id,
      status: 'active',
    }).select('name description price duration image');

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    if (error.message === 'Business not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get public availability (working hours/breaks) for a specific date
// @route   GET /api/public/business/:slug/availability?date=YYYY-MM-DD
// @access  Public
export const getPublicAvailability = async (req, res) => {
  try {
    const { slug } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date as query parameter (YYYY-MM-DD)',
      });
    }

    const business = await findBusinessBySlug(slug);
    const dateObj = new Date(date + 'T00:00:00Z');
    const dayOfWeek = dateObj.getUTCDay();

    const availability = await Availability.findOne({
      businessId: business._id,
      dayOfWeek,
    });

    if (!availability) {
      return res.status(200).json({
        success: true,
        data: {
          date,
          isOpen: false,
          message: 'No availability set for this day',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        date,
        dayOfWeek,
        isOpen: availability.isOpen,
        startTime: availability.startTime,
        endTime: availability.endTime,
        breaks: availability.breaks || [],
      },
    });
  } catch (error) {
    if (error.message === 'Business not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get public available slots
// @route   GET /api/public/business/:slug/slots?serviceId=xxx&date=YYYY-MM-DD
// @access  Public
export const getPublicSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceId and date as query parameters',
      });
    }

    const business = await findBusinessBySlug(slug);

    // Verify service belongs to business and is active
    const service = await Service.findOne({
      _id: serviceId,
      businessId: business._id,
      status: 'active',
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found for this business',
      });
    }

    const slots = await generateAvailableSlots(business._id, serviceId, date);

    res.status(200).json({
      success: true,
      data: {
        date,
        serviceId,
        serviceName: service.name,
        duration: service.duration,
        availableSlots: slots,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Public booking creation (no auth required)
// @route   POST /api/public/business/:slug/bookings
// @access  Public
export const createPublicBooking = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      serviceId,
      date,
      startTime,
      customer,
      notes,
      staffId,
    } = req.body;

    // Find business by slug
    const business = await findBusinessBySlug(slug);

    // Validate required fields
    if (!serviceId || !date || !startTime || !customer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serviceId, date, startTime, customer',
      });
    }

    // Validate customer object has name, email, phone
    if (!customer.name || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer must have name, email, and phone',
      });
    }

    // Use the same booking service, but set bookedBy = 'customer'
    const booking = await createBooking({
      businessId: business._id,
      serviceId,
      date,
      startTime,
      customer,
      notes: notes || '',
      staffId: staffId || null,
      bookedBy: 'customer',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingReference: booking.bookingReference,
        status: booking.status,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        service: booking.serviceId,
        business: booking.businessId,
        customer: booking.customer,
      },
    });
  } catch (error) {
    // Handle specific errors from bookingService
    if (error.message === 'Business not found or inactive') {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    if (error.message === 'Service not found or inactive for this business') {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (error.message.includes('not available')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('limit reached')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('past date')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    // Catch duplicate key errors (from unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is no longer available',
      });
    }
    console.error('Public booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking. Please try again.',
    });
  }
};

// @desc    Get all active businesses (public)
// @route   GET /api/public/businesses
// @access  Public
export const getPublicBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ isActive: true })
      .select('name slug description logo phone email address')
      .sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};