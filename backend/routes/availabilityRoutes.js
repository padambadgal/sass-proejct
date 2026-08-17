import express from 'express';

import {
  getAvailability,
  updateAvailability,
  bulkUpdateAvailability,
} from '../controllers/availabilityController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// GET /api/availability?businessId=xxx
router.get('/', protect, requireActiveSubscription, getAvailability);

// PATCH /api/availability
router.patch('/', protect, requireActiveSubscription, updateAvailability);

// POST /api/availability/bulk
router.post('/bulk', protect, requireActiveSubscription, bulkUpdateAvailability);

export default router;