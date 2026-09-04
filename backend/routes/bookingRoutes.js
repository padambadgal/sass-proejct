import express from 'express';

import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
  getOwnerBookings,
} from '../controllers/bookingController.js';

import {
  initiateBookingPayment,
  verifyBookingPayment,
} from '../controllers/bookingPaymentController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// ✅ Specific routes first
router.get('/owner', protect, requireActiveSubscription, getOwnerBookings);

// ✅ GET /api/bookings?businessId=xxx
router.get('/', protect, requireActiveSubscription, getBookings);

// POST /api/bookings
router.post('/', protect, requireActiveSubscription, createBooking);

// GET /api/bookings/:id
router.get('/:id', protect, requireActiveSubscription, getBookingById);

// DELETE /api/bookings/:id
router.delete('/:id', protect, requireActiveSubscription, cancelBooking);

// PATCH /api/bookings/:id/status
router.patch('/:id/status', protect, requireActiveSubscription, updateBookingStatus);

// Reschedule Route
router.patch('/:id/reschedule', rescheduleBooking); // ⚠️ Add protect + subscription if needed

// Payment Routes
router.post('/:id/initiate-payment', protect, requireActiveSubscription, initiateBookingPayment);
router.post('/:id/verify-payment', protect, requireActiveSubscription, verifyBookingPayment);


export default router;