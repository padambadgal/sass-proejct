import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';
import { uploadServiceImage } from '../middleware/uploadMiddleware.js';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';

const router = express.Router();

router.get('/', protect, requireActiveSubscription, getServices);

router.post(
  '/',
  protect,
  requireActiveSubscription,
  uploadServiceImage.single('image'),   // field name = 'image'
  createService
);

router.get('/:id', protect, requireActiveSubscription, getServiceById);

router.patch(
  '/:id',
  protect,
  requireActiveSubscription,
  uploadServiceImage.single('image'),   // field name = 'image'
  updateService
);

router.delete('/:id', protect, requireActiveSubscription, deleteService);

export default router;