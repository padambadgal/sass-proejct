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

// All routes require authentication and active subscription
router.use(protect);
router.use(requireActiveSubscription);

// Routes
router.route('/')
  .get(getServices)        // GET /api/services?businessId=xxx
  .post(createService);    // POST /api/services

router.route('/:id')
  .get(getServiceById)     // GET /api/services/:id
  .patch(updateService)    // PATCH /api/services/:id
  .delete(deleteService);  // DELETE /api/services/:id

export default router;