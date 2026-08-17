import express from 'express';
import { getAvailableSlots } from '../controllers/slotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// This endpoint can be used by authenticated users for now.
// We'll later make it public (Day 12) by removing the protect middleware.
router.get('/available', protect, getAvailableSlots);

export default router;