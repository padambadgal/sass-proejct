import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

import {
    forgotPasswordValidation,
    resetPasswordValidation,
} from '../utils/validationMiddleware.js';

import {
    registerValidation,
    loginValidation,
    validate,
} from '../middleware/validationMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 🔒 Aggressive rate limit specifically for password reset
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5,                    // 5 requests per IP per 15 min
    message: {
        success: false,
        message: 'Too many password reset requests. Try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// ✅ Password reset (new, secure flow)
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPasswordValidation, validate, resetPassword);

// Authenticated
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;