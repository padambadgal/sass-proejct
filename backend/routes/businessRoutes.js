import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadLogo } from '../middleware/uploadMiddleware.js';     // ← logo
import {
  createBusiness, getMyBusinesses, getBusinessById,
  updateBusiness, deleteBusiness,
} from '../controllers/businessController.js';

const router = express.Router();
router.use(protect);

router.post('/', uploadLogo.single('logo'), createBusiness);   // field: 'logo'
router.patch('/:id', uploadLogo.single('logo'), updateBusiness);   // field: 'logo'
router.get('/me', getMyBusinesses);
router.get('/:id', getBusinessById);
router.delete('/:id', deleteBusiness);

export default router;