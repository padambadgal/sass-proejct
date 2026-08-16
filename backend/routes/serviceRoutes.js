import express from 'express';

import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// GET /api/services
router.get('/',  protect, requireActiveSubscription, getServices);

// POST /api/services
router.post('/', protect, requireActiveSubscription, createService);

// GET /api/services/:id
router.get('/:id', protect, requireActiveSubscription, getServiceById);

// PATCH /api/services/:id
router.patch('/:id', protect, requireActiveSubscription, updateService);

// DELETE /api/services/:id
router.delete('/:id', protect, requireActiveSubscription, deleteService);

export default router;