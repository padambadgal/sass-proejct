import express from 'express';
import {
  getAvailableSlotsController,
  getAvailableSlotTimesController,
} from '../controllers/slotController.js';

const router = express.Router();

// Public — used by booking page before login
router.get('/available', getAvailableSlotsController);
router.get('/available-times', getAvailableSlotTimesController);

export default router;