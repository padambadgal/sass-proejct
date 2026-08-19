import express from 'express';

import {
  findOrCreateCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerBookingHistory,
} from '../controllers/customerController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// Find or create customer
router.post('/find-or-create', protect, requireActiveSubscription, findOrCreateCustomer);

// Get customer booking history
router.get('/history', protect, requireActiveSubscription, getCustomerBookingHistory);

// Get all customers
router.get('/', protect, requireActiveSubscription, getCustomers);

// Get customer by ID
router.get('/:id', protect, requireActiveSubscription, getCustomerById);

// Update customer
router.patch('/:id', protect, requireActiveSubscription, updateCustomer);

// Delete customer
router.delete('/:id', protect, requireActiveSubscription, deleteCustomer);

export default router;