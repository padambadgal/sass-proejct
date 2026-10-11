import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {upload} from '../middleware/uploadMiddleware.js';
import {
  getProfile,
  updateProfile,
  changeProfilePassword,
  // deleteProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.use(protect);

router.get('/', getProfile);
router.patch('/', upload.single('avatar'), updateProfile);  // field name = 'avatar'
router.patch('/change-password', changeProfilePassword);
// router.delete('/', deleteProfile);

export default router;