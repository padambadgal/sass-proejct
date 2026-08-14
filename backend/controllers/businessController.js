import Business from '../models/Business.js';
import { canCreateBusiness, getPlanLimitsForUser } from '../utils/planLimits.js';

// Helper to generate unique slug (in case of duplicates)
const generateUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 1;
  while (await Business.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

// @desc    Create a new business
// @route   POST /api/business
// @access  Private (requires active subscription)
export const createBusiness = async (req, res, next) => {
  try {
    const { name, description, phone, email, address, timezone, bankAccount, logo } = req.body;

    // Check if user can create another business (plan limit)
    const canCreate = await canCreateBusiness(req.user._id);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'Business limit reached for your current plan. Please upgrade to add more businesses.',
      });
    }

    // Generate slug from name
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    // Ensure uniqueness
    const slug = await generateUniqueSlug(baseSlug);

    // Build business object
    const businessData = {
      name,
      slug,
      description: description || '',
      phone: phone || '',
      email: email || '',
      address: address || {},
      timezone: timezone || 'Asia/Kolkata',
      bankAccount: bankAccount || {},
      logo: logo || null,
      ownerId: req.user._id,
    };

    const business = await Business.create(businessData);

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      data: business,
    });
  } catch (error) {
    // Handle duplicate slug error (though our generateUniqueSlug should prevent it)
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists, please try a different business name.',
      });
    }
    next(error); // Let global error handler manage others
  }
};

// @desc    Get all businesses for the logged‑in user
// @route   GET /api/business/me
// @access  Private
export const getMyBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single business by ID (owner only)
// @route   GET /api/business/:id
// @access  Private
export const getBusinessById = async (req, res,next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Ownership check
    if (business.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this business',
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a business
// @route   PATCH /api/business/:id
// @access  Private
export const updateBusiness = async (req, res,next) => {
  try {
    let business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Ownership check
    if (business.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this business',
      });
    }

    // Fields allowed to update
    const allowedUpdates = [
      'name', 'description', 'phone', 'email', 'address',
      'timezone', 'bankAccount', 'logo', 'isActive'
    ];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If name is updated, regenerate slug? We'll keep slug as is. Or we can optionally regenerate.
    // But to keep consistent, we won't auto‑update slug on name change.
    // If user wants to change slug, we could add a separate endpoint, but we skip for now.

    // Apply updates
    business = await Business.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a business (soft delete by setting isActive=false)
// @route   DELETE /api/business/:id
// @access  Private
export const deleteBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Ownership check
    if (business.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this business',
      });
    }

    // We'll soft-delete by setting isActive to false instead of hard deleting
    // This preserves data but hides it from the UI.
    business.isActive = false;
    await business.save();

    res.status(200).json({
      success: true,
      message: 'Business deactivated successfully',
      data: { id: business._id, isActive: false },
    });

    // Alternatively, we could hard delete: await business.remove();
    // But we want to keep data for audit, so soft delete is better.
  } catch (error) {
    next(error);
  }
};