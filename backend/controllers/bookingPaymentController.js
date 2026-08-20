import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Business from '../models/Business.js';

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper to check business ownership (for owner-initiated payments, but we'll also allow public?)
// For public, we may allow payment without owner login later, but for now we keep owner-only.
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) throw new Error('Business not found or you do not own it');
  return business;
};

// @desc    Initiate payment for a booking
// @route   POST /api/bookings/:id/initiate-payment
// @access  Private (owner) – but could be made public later
export const initiateBookingPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    await validateBusinessOwnership(booking.businessId, req.user._id);

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    // Get service price
    const service = await Service.findById(booking.serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const amount = service.price; // in INR
    const currency = 'INR';

    // Create Razorpay order
    const options = {
      amount: amount * 100, // paise
      currency,
      receipt: `booking_${booking.bookingReference}`,
      payment_capture: 1,
      notes: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    // Store orderId in booking (optional)
    booking.paymentId = order.id; // we'll use paymentId to store orderId temporarily
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('Initiate payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate payment' });
  }
};

// @desc    Verify payment for a booking
// @route   POST /api/bookings/:id/verify-payment
// @access  Private (owner) – but could be made public later
export const verifyBookingPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find booking by orderId stored in paymentId field
    const booking = await Booking.findOne({ paymentId: orderId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    await validateBusinessOwnership(booking.businessId, req.user._id);

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.paymentId = paymentId; // store the actual paymentId
    await booking.save();

    // Optionally send confirmation email with payment info
    // We can reuse the notification service

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bookingReference: booking.bookingReference,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};