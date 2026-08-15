import Service from '../models/Service.js';
import Business from '../models/Business.js';
import { canCreateService } from '../utils/planLimits.js';

// Helper: Check if business exists and user owns it
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) {
    throw new Error('Business not found or you do not own it');
  }
  return business;
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (requires active subscription)
export const createService = async (req, res, next) => {
  try {
    const { businessId, name, description, price, duration, image } = req.body;

    // Validate business ownership
    await validateBusinessOwnership(businessId, req.user._id);

    // Check service limit
    const canCreate = await canCreateService(businessId);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'Service limit reached for your current plan. Please upgrade to add more services.',
      });
    }

    // Create service
    const service = await Service.create({
      businessId,
      name,
      description: description || '',
      price,
      duration,
      image: image || null,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get all services for a business (owner only)
// @route   GET /api/services?businessId=xxx
// @access  Private
export const getServices = async (req, res, next) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId as a query parameter',
      });
    }

    // Validate ownership
    await validateBusinessOwnership(businessId, req.user._id);

    // Fetch services
    const services = await Service.find({ businessId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get a single service by ID
// @route   GET /api/services/:id
// @access  Private
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Check ownership via the business
    await validateBusinessOwnership(service.businessId, req.user._id);

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update a service
// @route   PATCH /api/services/:id
// @access  Private
export const updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Check ownership
    await validateBusinessOwnership(service.businessId, req.user._id);

    // Allowed fields to update
    const allowedUpdates = ['name', 'description', 'price', 'duration', 'image', 'status'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Apply updates
    service = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete a service (soft delete by setting status='inactive')
// @route   DELETE /api/services/:id
// @access  Private
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Check ownership
    await validateBusinessOwnership(service.businessId, req.user._id);

    // Soft delete: set status to inactive
    service.status = 'inactive';
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully',
      data: { id: service._id, status: service.status },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};