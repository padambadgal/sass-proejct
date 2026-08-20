import express from 'express';

import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
} from '../controllers/bookingController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// GET /api/bookings
router.get('/', protect, requireActiveSubscription, getBookings);

// POST /api/bookings
router.post('/',protect, requireActiveSubscription, createBooking);

// GET /api/bookings/:id
router.get('/:id', protect, requireActiveSubscription, getBookingById);

// DELETE /api/bookings/:id
router.delete('/:id', protect, requireActiveSubscription, cancelBooking);

// PATCH /api/bookings/:id/status
router.patch('/:id/status', protect, requireActiveSubscription, updateBookingStatus);

router.patch('/:id/reschedule', rescheduleBooking);


export default router;