import express from 'express';
import {
  getBusinessBySlug,
  getPublicServices,
  getPublicAvailability,
  getPublicSlots,
  createPublicBooking,
  getPublicBusinesses,
  getBookingByReference,
  reschedulePublicBooking
} from '../controllers/publicController.js';

const router = express.Router();


router.get('/businesses', getPublicBusinesses);


// Business profile
router.get('/business/:slug', getBusinessBySlug);

// Services
router.get('/business/:slug/services', getPublicServices);

// Availability for a specific date
router.get('/business/:slug/availability', getPublicAvailability);

// Available slots
router.get('/business/:slug/slots', getPublicSlots);

// Create booking (public)
router.post('/business/:slug/bookings', createPublicBooking);

router.get('/bookings/:reference', getBookingByReference);
router.patch('/bookings/:reference/reschedule', reschedulePublicBooking);

export default router;