import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only jpeg/png/webp/gif images allowed'), false);
  }
  cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024 };

// ---------- 1. PROFILE AVATAR → saas/avatars ----------
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'saas/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
    ],
  },
});
export const uploadAvatar = multer({ storage: avatarStorage, fileFilter, limits });

// ---------- 2. BUSINESS LOGO → saas/business-logos ----------
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'saas/business-logos',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 600, height: 600, crop: 'limit', quality: 'auto' },
    ],
  },
});
export const uploadLogo = multer({ storage: logoStorage, fileFilter, limits });

// ---------- 3. SERVICE IMAGE → saas/service-images ----------
const serviceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'saas/service-images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
    ],
  },
});
export const uploadServiceImage = multer({ storage: serviceStorage, fileFilter, limits });