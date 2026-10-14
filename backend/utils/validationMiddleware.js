import { body } from 'express-validator';

// ...existing exports...

export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];