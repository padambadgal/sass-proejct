import express from 'express';
import {
  createOrder,
  verifyPayment,
  webhookHandler,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (require login)
router.post('/buy-plan', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// Webhook route (public, no auth, but signature verification inside)
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

export default router;