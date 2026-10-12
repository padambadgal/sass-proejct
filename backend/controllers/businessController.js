import Business from '../models/Business.js';
import Availability from '../models/Availability.js';
import cloudinary from '../config/cloudinary.js';
import { canCreateBusiness } from '../utils/planLimits.js';

// ---------- CREATE ----------
// POST /api/business  (multipart/form-data OR JSON)
export const createBusiness = async (req, res) => {
  try {
    const { name, slug, phone, address: addressValue, description, email, timezone, bankAccount } = req.body || {};
    let address = addressValue;
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch {
        return res.status(400).json({ success: false, message: 'Address must be valid JSON' });
      }
    }

    console.log('[createBusiness] body:', req.body);
    console.log('[createBusiness] file:', req.file
      ? { path: req.file.path, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size }
      : 'NO FILE');

    if (!name || !slug || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug and phone are required',
      });
    }

    const existing = await Business.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Business with this slug already exists',
      });
    }

    if (!(await canCreateBusiness(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: 'Your plan has reached its active business limit. Deactivate another business or upgrade your plan.',
      });
    }

    const business = new Business({
      name,
      slug,
      phone,
      description,
      email,
      timezone,
      bankAccount,
      address,
      ownerId: req.user._id,
      isActive: true,
    });

    // Avatar-style: file already uploaded by CloudinaryStorage
    if (req.file?.path) {
      business.logo = req.file.path;
      business.logoPublicId = req.file.filename;
    } else if (typeof req.body.logo === 'string' && req.body.logo.trim() !== '') {
      business.logo = req.body.logo.trim();
    }

    await business.save();

    // Default availability (unchanged)
    const defaultDays = [
      { dayOfWeek: 0, isOpen: false },
      { dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 6, isOpen: false },
    ];

    const availabilityDocs = defaultDays.map((day) => ({
      businessId: business._id,
      dayOfWeek: day.dayOfWeek,
      isOpen: day.isOpen,
      startTime: day.startTime || '09:00',
      endTime: day.endTime || '18:00',
      breaks: [],
    }));

    await Availability.insertMany(availabilityDocs);

    return res.status(201).json({
      success: true,
      message: 'Business created with default working hours',
      data: {
        business,
        availability: availabilityDocs,
      },
    });
  } catch (error) {
    console.error('Error creating business:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate field value' });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create business. Please try again.',
    });
  }
};

// ---------- GET ALL ----------
// GET /api/business/me
export const getMyBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: businesses });
  } catch (error) {
    next(error);
  }
};

// ---------- GET ONE ----------
// GET /api/business/:id
export const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    if (business.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this business' });
    }
    return res.status(200).json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

// ---------- UPDATE ----------
// PATCH /api/business/:id  (multipart/form-data OR JSON)
export const updateBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    if (business.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this business' });
    }

    console.log('[updateBusiness] body keys:', Object.keys(req.body || {}));
    console.log('[updateBusiness] file:', req.file
      ? { path: req.file.path, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size }
      : 'NO FILE');

    const allowedUpdates = [
      'name', 'description', 'phone', 'email',
      'timezone', 'bankAccount', 'isActive',
    ];

    // Apply text fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        business[field] = req.body[field];
      }
    });

    if (req.body.address !== undefined) {
      if (typeof req.body.address === 'string') {
        try {
          business.address = JSON.parse(req.body.address);
        } catch {
          return res.status(400).json({ success: false, message: 'Address must be valid JSON' });
        }
      } else {
        business.address = req.body.address;
      }
    }

    // Re-activation limit check
    if (!business.isActive && req.body.isActive === true && !(await canCreateBusiness(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: 'Your plan has reached its active business limit. Deactivate another business or upgrade your plan.',
      });
    }

    const oldPublicId = business.logoPublicId || null;

    // ---- logo file → Cloudinary (already uploaded by storage) ----
    if (req.file?.path) {
      business.logo = req.file.path;
      business.logoPublicId = req.file.filename;

      // Best-effort delete of old logo
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(() => {});
      }
    }
    // ---- logo URL string via JSON ----
    else if (typeof req.body.logo === 'string' && req.body.logo.trim() !== '') {
      business.logo = req.body.logo.trim();
    }

    // ---- explicit removal ----
    if (req.body.deleteLogo === 'true' || req.body.deleteLogo === true) {
      business.logo = null;
      business.logoPublicId = null;
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(() => {});
      }
    }

    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: business,
    });
  } catch (error) {
    console.error('Update business error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate field value' });
    }
    next(error);
  }
};

// ---------- DELETE (soft) ----------
// DELETE /api/business/:id
export const deleteBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    if (business.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this business' });
    }

    business.isActive = false;
    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Business deactivated successfully',
      data: { id: business._id, isActive: false },
    });
  } catch (error) {
    next(error);
  }
};