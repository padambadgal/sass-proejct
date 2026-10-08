import Business from '../models/Business.js';
import { canCreateBusiness } from '../utils/planLimits.js';
import Availability from '../models/Availability.js';

// Helper to generate unique slug (in case of duplicates)
// const generateUniqueSlug = async (baseSlug) => {
//   let slug = baseSlug;
//   let counter = 1;
//   while (await Business.findOne({ slug })) {
//     slug = `${baseSlug}-${counter}`;
//     counter++;
//   }
//   return slug;
// };

// @desc    Create a new business
// @route   POST /api/business
// @access  Private (requires active subscription)
export const createBusiness = async (req, res) => {
  try {
    const { name, slug, phone, address, description, logo } = req.body;

    // 1. Validate required fields
    if (!name || !slug || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug and phone are required'
      });
    }

    // 2. Check for duplicate slug
    const existing = await Business.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Business with this slug already exists'
      });
    }

    if (!(await canCreateBusiness(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: 'Your plan has reached its active business limit. Deactivate another business or upgrade your plan.',
      });
    }

    // 3. Create the business
    const business = new Business({
      name,
      slug,
      phone,
      address,
      description,
      logo,
      ownerId: req.user._id,
      isActive: true,
    });
    
    await business.save();

    // 4. Create default availability for 7 days
    const defaultDays = [
      { dayOfWeek: 0, isOpen: false }, // Sunday – closed
      { dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, isOpen: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 6, isOpen: false }, // Saturday – closed
    ];

    const availabilityDocs = defaultDays.map(day => ({
      businessId: business._id,
      dayOfWeek: day.dayOfWeek,
      isOpen: day.isOpen,
      startTime: day.startTime || '09:00',
      endTime: day.endTime || '18:00',
      breaks: [],
    }));

    // Insert all availability records in one bulk operation
    await Availability.insertMany(availabilityDocs);

    // 5. Send response
    res.status(201).json({
      success: true,
      message: 'Business created with default working hours',
      data: {
        business,
        availability: availabilityDocs // optional
      }
    });

  } catch (error) {
    // If any error occurs, optionally delete the business to keep data clean
    // (MongoDB doesn't have auto-rollback for two separate operations)
    // We can handle it gracefully:
    console.error('Error creating business:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create business. Please try again.'
    });
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
export const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // console.log('Business found:', business);

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
export const updateBusiness = async (req, res, next) => {
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

    if (!business.isActive && updates.isActive === true && !(await canCreateBusiness(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: 'Your plan has reached its active business limit. Deactivate another business or upgrade your plan.',
      });
    }

    // If name is updated, regenerate slug? We'll keep slug as is. Or we can optionally regenerate.
    // But to keep consistent, we won't auto‑update slug on name change.
    // If user wants to change slug, we could add a separate endpoint, but we skip for now.

    // Apply updates
    business = await Business.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
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
