import Business from '../models/Business.js';
import Service from '../models/Service.js';
import Availability from '../models/Availability.js';
import { generateAvailableSlots } from '../services/slotService.js';
import { createBooking } from '../services/bookingService.js';
import Booking from '../models/Booking.js'; // ✅ Add import
import { getAvailableSlotTimes, filterPastSlots } from '../services/slotService.js'; // ✅ Ensure import

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
// @desc    Get public available slots (supports multiple services)
// @route   GET /api/public/business/:slug/slots?serviceIds=xxx,yyy&duration=60&date=YYYY-MM-DD
// @access  Public
export const getPublicSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { serviceIds, duration, date } = req.query;

    if (!serviceIds || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceIds and date as query parameters',
      });
    }

    const business = await findBusinessBySlug(slug);

    // Parse service IDs (comma-separated)
    const serviceIdArray = serviceIds.split(',').filter(id => id.trim() !== '');
    if (serviceIdArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid serviceIds format',
      });
    }

    // Verify all services belong to this business and are active
    const services = await Service.find({
      _id: { $in: serviceIdArray },
      businessId: business._id,
      status: 'active',
    });

    if (services.length !== serviceIdArray.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more services not found for this business',
      });
    }

    // Use provided duration or compute sum from services
    let totalDuration = duration ? parseInt(duration) : services.reduce((sum, s) => sum + s.duration, 0);

    // Generate slots using the first service ID (for validation) but with total duration
    const firstServiceId = serviceIdArray[0];
    let slots = await generateAvailableSlots(business._id, firstServiceId, date, totalDuration);

    // Filter past slots
    slots = filterPastSlots(slots, date);

    res.status(200).json({
      success: true,
      data: {
        date,
        serviceIds: serviceIdArray,
        serviceNames: services.map(s => s.name),
        totalDuration,
        availableSlots: slots,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('Get public slots error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Public booking creation (no auth required)
// @route   POST /api/public/business/:slug/bookings
// @access  Public
export const createPublicBooking = async (req, res) => {
  try {
    const { slug } = req.params;
    const { serviceIds, date, startTime, customer, notes, staffId } = req.body;

    const business = await findBusinessBySlug(slug);

    if (!serviceIds || !date || !startTime || !customer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serviceIds, date, startTime, customer',
      });
    }

    // Validate services
    const services = await Service.find({
      _id: { $in: serviceIds },
      businessId: business._id,
      status: 'active',
    });
    if (services.length !== serviceIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more services not found',
      });
    }

    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // Primary service (for backward compatibility)
    const primaryService = services[0];

    const booking = await createBooking({
      businessId: business._id,
      serviceId: primaryService._id,          // keep for compatibility
      serviceIds: serviceIds,                 // all service IDs
      totalDuration,                          // override duration
      totalPrice,                             // override price
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
        services: services.map(s => ({ name: s.name, price: s.price, duration: s.duration })),
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

// @desc    Get booking by reference (customer verification)
// @route   GET /api/public/bookings/:reference
// @access  Public
export const getBookingByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    // ✅ Check both query params AND request body
    const email = req.query.email || req.body.email;

    // ✅ Require at least one identifier
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email for verification',
      });
    }

    const booking = await Booking.findOne({ bookingReference: reference })
      .populate('businessId', 'name slug')
      .populate('serviceId', 'name price duration');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ✅ Case‑insensitive email comparison
    if (email && booking.customer.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Email does not match' });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking by reference error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reschedule booking (customer)
// @route   PATCH /api/public/bookings/:reference/reschedule
// @access  Public
export const reschedulePublicBooking = async (req, res) => {
  try {
    const { reference } = req.params;
    const { date, startTime } = req.body;

    // ✅ Get email from query OR body (for flexibility)
    const email = req.query.email || req.body.email;

    // ✅ Require email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for verification',
      });
    }

    const booking = await Booking.findOne({ bookingReference: reference })
      .populate('businessId', 'name slug')
      .populate('serviceId', 'name price duration');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ✅ Case‑insensitive email verification
    if (booking.customer.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Email does not match' });
    }

    // Only pending/confirmed can be rescheduled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule booking with status ${booking.status}`,
      });
    }

    // Validate date
    const newDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date' });
    }

    // Check availability
    const availableSlots = await getAvailableSlotTimes(booking.businessId, booking.serviceId, date);
    if (!availableSlots.includes(startTime)) {
      return res.status(400).json({ success: false, message: 'Selected time slot is not available' });
    }

    // Calculate new endTime
    const service = await Service.findById(booking.serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Update booking
    booking.date = newDate;
    booking.startTime = startTime;
    booking.endTime = endTime;
    await booking.save();

    // Optionally send email notification

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Selected time slot is not available' });
    }
    console.error('Reschedule public booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};