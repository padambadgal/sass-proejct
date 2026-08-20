import express from 'express';
import {
  getPlans,
  getMySubscription,
  createTestSubscription,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes
router.get('/me', protect, getMySubscription);

// ⚠️ TEST ROUTE – will be removed on Day 3
router.post('/test/create', protect, createTestSubscription);

export default router;