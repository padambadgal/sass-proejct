import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const createUploader = (folder, options = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `saas/${folder}`,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: options.transformation || [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
      ],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Only jpeg/png/webp/gif images allowed'), false);
      }
      cb(null, true);
    },
  });
};

// Avatar — square, face-cropped
export const uploadAvatar = createUploader('avatars', {
  transformation: [
    { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
  ],
});

// Business logo — wide limit, no crop so logos aren't distorted
export const uploadBusinessLogo = createUploader('business-logos', {
  transformation: [
    { width: 800, height: 800, crop: 'limit', quality: 'auto' },
  ],
});

// Service image — landscape
export const uploadServiceImage = createUploader('service-images', {
  transformation: [
    { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
  ],
});

// Default export for backward-compat (your profile route used `upload.single('avatar')`)
export const upload = uploadAvatar;