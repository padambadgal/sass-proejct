import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadServiceImage } from '../middleware/uploadMiddleware.js';  // ← service image
import {
  createService, getServices, getServiceById,
  updateService, deleteService,
} from '../controllers/serviceController.js';

const router = express.Router();
router.use(protect);

router.post('/', uploadServiceImage.single('image'), createService);  // field: 'image'
router.patch('/:id', uploadServiceImage.single('image'), updateService);  // field: 'image'
router.get('/', getServices);
router.get('/:id', getServiceById);
router.delete('/:id', deleteService);

export default router;