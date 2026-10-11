import cloudinary from '../config/cloudinary.js';
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

// Helper: apply avatar-style image update to a Service document.
// Handles three modes: file upload, URL string, explicit removal.
const applyServiceImage = async (service, req) => {
  const oldPublicId = service.imagePublicId || null;

  // Mode 1: file uploaded → CloudinaryStorage already uploaded it
  if (req.file?.path) {
    service.image = req.file.path;
    service.imagePublicId = req.file.filename;

    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch(() => {});
    }
  }
  // Mode 2: URL string in JSON body
  else if (typeof req.body.image === 'string' && req.body.image.trim() !== '') {
    service.image = req.body.image.trim();
  }

  // Mode 3: explicit removal
  if (req.body.deleteImage === 'true' || req.body.deleteImage === true) {
    service.image = null;
    service.imagePublicId = null;
    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch(() => {});
    }
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (requires active subscription)
export const createService = async (req, res, next) => {
  try {
    const { businessId, name, description, price, duration } = req.body || {};

    console.log('[createService] body:', req.body);
    console.log('[createService] file:', req.file
      ? { path: req.file.path, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size }
      : 'NO FILE');

    // Validate required fields
    if (!businessId || !name || price === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        message: 'businessId, name, price and duration are required',
      });
    }

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

    // Create service via `new` + `save()` so pre-save hooks run and
    // applyServiceImage can set the imagePublicId alongside image.
    const service = new Service({
      businessId,
      name,
      description: description || '',
      price,
      duration,
      status: 'active',
    });

    await applyServiceImage(service, req);
    await service.save();

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Create service error:', error);

    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
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

    await validateBusinessOwnership(businessId, req.user._id);

    const services = await Service.find({ businessId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

// @desc    Get a single service by ID
// @route   GET /api/services/:id
// @access  Private
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await validateBusinessOwnership(service.businessId, req.user._id);

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

// @desc    Update a service
// @route   PATCH /api/services/:id
// @access  Private
export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Ownership check via the parent business
    await validateBusinessOwnership(service.businessId, req.user._id);

    console.log('[updateService] body keys:', Object.keys(req.body || {}));
    console.log('[updateService] file:', req.file
      ? { path: req.file.path, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size }
      : 'NO FILE');

    // Allowed text fields (image handled separately by applyServiceImage)
    const allowedUpdates = ['name', 'description', 'price', 'duration', 'status'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    // Re-activation limit check
    if (
      service.status === 'inactive' &&
      req.body.status === 'active' &&
      !(await canCreateService(service.businessId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Service limit reached for your current plan. Deactivate another service or upgrade your plan.',
      });
    }

    // Apply image changes (file / URL / delete)
    await applyServiceImage(service, req);

    await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Update service error:', error);

    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate field value' });
    }
    return next(error);
  }
};

// @desc    Delete a service (soft delete by setting status='inactive')
// @route   DELETE /api/services/:id
// @access  Private
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await validateBusinessOwnership(service.businessId, req.user._id);

    service.status = 'inactive';
    await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service deactivated successfully',
      data: { id: service._id, status: service.status },
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};