import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';
import { uploadBusinessLogo } from '../middleware/uploadMiddleware.js';
import {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
} from '../controllers/businessController.js';

const router = express.Router();

// Note: multer runs after auth so it doesn't waste an upload on unauth requests
router.get('/me', protect, requireActiveSubscription, getMyBusinesses);

router.post(
  '/',
  protect,
  requireActiveSubscription,
  uploadBusinessLogo.single('logo'),
  createBusiness
);

router.get('/:id', protect, requireActiveSubscription, getBusinessById);

router.patch(
  '/:id',
  protect,
  requireActiveSubscription,
  uploadBusinessLogo.single('logo'),
  updateBusiness
);

router.delete('/:id', protect, requireActiveSubscription, deleteBusiness);

export default router;