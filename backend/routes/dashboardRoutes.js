import express from 'express';
import {
  getOverview,
  getBookingsByPeriod,
  getRevenueByPeriod,
  getPopularServices,
  exportReport,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// All routes require auth + active subscription
router.use(protect);
router.use(requireActiveSubscription);

router.get('/overview', getOverview);
router.get('/bookings', getBookingsByPeriod);
router.get('/revenue', getRevenueByPeriod);
router.get('/popular-services', getPopularServices);
router.get('/report', exportReport);

export default router;