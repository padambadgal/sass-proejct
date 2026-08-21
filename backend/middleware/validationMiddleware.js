import { body, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => err.msg),
    });
  }
  next();
};

// Common validation rules
export const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name too long'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const businessValidation = [
  body('name').notEmpty().withMessage('Business name is required').isLength({ max: 100 }),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().isObject(),
  body('timezone').optional().isString(),
];

export const serviceValidation = [
  body('businessId').isMongoId().withMessage('Invalid business ID'),
  body('name').notEmpty().withMessage('Service name is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
];

export const staffValidation = [
  body('businessId').isMongoId().withMessage('Invalid business ID'),
  body('name').notEmpty().withMessage('Staff name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('services').optional().isArray().withMessage('Services must be an array of IDs'),
];

export const availabilityValidation = [
  body('businessId').isMongoId().withMessage('Invalid business ID'),
  body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be between 0 and 6'),
  body('isOpen').optional().isBoolean(),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('breaks').optional().isArray(),
];

export const bookingValidation = [
  body('businessId').isMongoId().withMessage('Invalid business ID'),
  body('serviceId').isMongoId().withMessage('Invalid service ID'),
  body('date').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('customer.name').notEmpty().withMessage('Customer name is required'),
  body('customer.email').isEmail().withMessage('Valid customer email is required'),
  body('customer.phone').notEmpty().withMessage('Customer phone is required'),
];

export const publicBookingValidation = [
  body('serviceId').isMongoId().withMessage('Invalid service ID'),
  body('date').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('customer.name').notEmpty().withMessage('Customer name is required'),
  body('customer.email').isEmail().withMessage('Valid customer email is required'),
  body('customer.phone').notEmpty().withMessage('Customer phone is required'),
];