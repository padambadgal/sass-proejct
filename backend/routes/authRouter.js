import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  // changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../middleware/validationMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 🔒 Rate limit for password reset endpoints
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// ✅ OTP password reset flow
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-otp', passwordResetLimiter, verifyOtp);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Authenticated
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
// router.patch('/change-password', protect, changePassword);

export default router;