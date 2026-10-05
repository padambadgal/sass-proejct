import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), uploadImage);
router.delete('/:publicId', protect, deleteImage);

export default router;