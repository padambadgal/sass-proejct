import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

const getSafeUser = (user) => {
  const safe = user.toObject ? user.toObject() : { ...user };
  delete safe.password;
  delete safe.resetPasswordToken;
  delete safe.resetPasswordExpire;
  return safe;
};

// ---------- GET own profile ----------
// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------- UPDATE own profile ----------
// PATCH /api/profile  (JSON or multipart/form-data)
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // debug — remove after confirming
    console.log('[updateProfile] body:', req.body);
    console.log('[updateProfile] file:', req.file
      ? { path: req.file.path, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size }
      : 'NO FILE');

    // ---- name ----
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        return res.status(400).json({ success: false, message: 'Name must be a non-empty string' });
      }
      user.name = req.body.name.trim();
    }

    // ---- phone ----
    if (req.body.phone !== undefined) {
      if (typeof req.body.phone !== 'string') {
        return res.status(400).json({ success: false, message: 'Phone must be a string' });
      }
      user.phone = req.body.phone.trim();
    }

    const oldPublicId = user.avatarPublicId || null;

    // ---- avatar (3 modes) ----
    // Mode 1: file uploaded → CloudinaryStorage already uploaded it
    if (req.file?.path) {
      user.avatar = req.file.path;               // secure URL
      user.avatarPublicId = req.file.filename;   // public_id

      // best-effort delete of the old one
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(() => {});
      }
    }
    // Mode 2: JSON body with avatar URL string
    else if (typeof req.body.avatar === 'string' && req.body.avatar.trim() !== '') {
      user.avatar = req.body.avatar.trim();
    }

    // Mode 3: explicit removal
    if (req.body.deleteAvatar === 'true' || req.body.deleteAvatar === true) {
      user.avatar = null;
      user.avatarPublicId = null;
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(() => {});
      }
    }

    await user.save();

    const safeUser = await User.findById(user._id).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        url: user.avatar || '',
        user: safeUser,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate field value' });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// ---------- CHANGE own password ----------
// PATCH /api/profile/change-password
export const changeProfilePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------- DEACTIVATE ----------
// DELETE /api/profile
// export const deleteProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });
//     user.isActive = false;
//     await user.save();
//     return res.status(200).json({ success: true, message: 'Account deactivated' });
//   } catch (error) {
//     console.error('Delete profile error:', error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };