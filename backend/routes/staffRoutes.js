import express from 'express';

import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from '../controllers/staffController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// GET /api/staff?businessId=xxx
router.get('/', protect, requireActiveSubscription, getStaff);

// POST /api/staff
router.post('/', protect, requireActiveSubscription, createStaff);

// GET /api/staff/:id
router.get('/:id', protect, requireActiveSubscription, getStaffById);

// PATCH /api/staff/:id
router.patch('/:id', protect, requireActiveSubscription, updateStaff);

// DELETE /api/staff/:id
router.delete('/:id', protect, requireActiveSubscription, deleteStaff);

export default router;