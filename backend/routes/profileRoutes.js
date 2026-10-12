import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';   // ← avatar
import { getProfile, updateProfile, changeProfilePassword } from '../controllers/profileController.js';

const router = express.Router();
router.use(protect);

router.get('/', getProfile);
router.patch('/', uploadAvatar.single('avatar'), updateProfile);   // field: 'avatar'
router.patch('/change-password', changeProfilePassword);

export default router;