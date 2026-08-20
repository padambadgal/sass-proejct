import Booking from '../models/Booking.js';
import Business from '../models/Business.js';
import { createBooking as createBookingService } from '../services/bookingService.js';
import { canCreateAppointment } from '../utils/planLimits.js';

// Helper: Check business ownership
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) {
    throw new Error('Business not found or you do not own it');
  }
  return business;
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (owner can create on behalf of customer, or we'll later have a public endpoint)
export const createBooking = async (req, res) => {
  try {
    const { businessId, serviceId, date, startTime, customer, notes, staffId } = req.body;

    // Owner must own this business
    await validateBusinessOwnership(businessId, req.user._id);

    // Use the service to create the booking
    const booking = await createBookingService({
      businessId,
      serviceId,
      date,
      startTime,
      customer,
      notes,
      staffId,
      bookedBy: 'owner',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    // Handle specific errors from service
    if (error.message.includes('limit reached')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not available')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings for a business (with filters)
// @route   GET /api/bookings?businessId=xxx&status=xxx&date=xxx
// @access  Private
export const getBookings = async (req, res) => {
  try {
    const { businessId, status, date, limit = 50, page = 1 } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId as a query parameter',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    // Build filter
    const filter = { businessId };
    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name')
      .populate('customerId', 'name email phone')
      .sort({ date: -1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name')
      .populate('customerId', 'name email phone')
      .populate('businessId', 'name slug');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    await validateBusinessOwnership(booking.businessId, req.user._id);

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status (confirm, complete, cancel, no-show)
// @route   PATCH /api/bookings/:id/status
// @access  Private


export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await validateBusinessOwnership(booking.businessId, req.user._id);

    // Check if transition is allowed
    const current = booking.status;
    if (!allowedTransitions[current] || !allowedTransitions[current].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${current} to ${status}`,
      });
    }

    booking.status = status;
    await booking.save();

    sendBookingStatusUpdate(booking, current).catch(err =>
      console.error('Email error:', err)
    );


    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });

  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking (set status to cancelled)
// @route   DELETE /api/bookings/:id
// @access  Private (or we can have a public cancel by reference later)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    await validateBusinessOwnership(booking.businessId, req.user._id);

    // Only allow cancellation if status is pending or confirmed
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status ${booking.status}`,
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rescheduleBooking = async (req, res) => {
  try {
    const { date, startTime } = req.body;
    if (!date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and startTime',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check
    await validateBusinessOwnership(booking.businessId, req.user._id);

    // Only pending or confirmed can be rescheduled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a booking with status ${booking.status}`,
      });
    }

    // Validate new date is not in the past
    const newDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date' });
    }

    // Check availability for the new slot (using service duration from the booking's service)
    const service = await Service.findById(booking.serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const availableSlots = await getAvailableSlotTimes(booking.businessId, booking.serviceId, date);
    if (!availableSlots.includes(startTime)) {
      return res.status(400).json({ success: false, message: 'New time slot is not available' });
    }

    // Calculate new endTime
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
    // Optionally, regenerate reference? We keep the old one.
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'New time slot is not available' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};