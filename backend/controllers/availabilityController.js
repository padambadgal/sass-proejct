import Availability from '../models/Availability.js';
import Business from '../models/Business.js';

// Helper: Check business ownership
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) {
    throw new Error('Business not found or you do not own it');
  }
  return business;
};

// Helper: Validate time string format
const isValidTime = (time) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

// @desc    Get availability for a business (all days)
// @route   GET /api/availability?businessId=xxx
// @access  Private
export const getAvailability = async (req, res, next) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId as a query parameter',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    const availability = await Availability.find({ businessId }).sort({ dayOfWeek: 1 });

    // If no availability records exist, return empty array (or create defaults?)
    // We'll let the frontend handle defaults, but we could seed them.
    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update availability for a specific day
// @route   PATCH /api/availability
// @access  Private
export const updateAvailability = async (req, res, next) => {
  try {
    const { businessId, dayOfWeek, isOpen, startTime, endTime, breaks } = req.body;

    if (!businessId || dayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId and dayOfWeek',
      });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek must be between 0 and 6',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    // Build update object
    const updateData = {};
    if (isOpen !== undefined) updateData.isOpen = isOpen;
    if (startTime !== undefined) {
      if (!isValidTime(startTime)) {
        return res.status(400).json({ success: false, message: 'Invalid startTime format (use HH:MM)' });
      }
      updateData.startTime = startTime;
    }
    if (endTime !== undefined) {
      if (!isValidTime(endTime)) {
        return res.status(400).json({ success: false, message: 'Invalid endTime format (use HH:MM)' });
      }
      updateData.endTime = endTime;
    }
    if (breaks !== undefined) {
      // Validate each break
      for (const br of breaks) {
        if (!br.start || !br.end || !isValidTime(br.start) || !isValidTime(br.end)) {
          return res.status(400).json({ success: false, message: 'Invalid break format' });
        }
        if (br.start >= br.end) {
          return res.status(400).json({ success: false, message: 'Break start must be before end' });
        }
      }
      updateData.breaks = breaks;
    }

    // Upsert: find and update, or create if not exists
    const availability = await Availability.findOneAndUpdate(
      { businessId, dayOfWeek },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: availability,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    // Handle validation errors from pre-save
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.message && error.message.includes('Start time must be before end time')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message && error.message.includes('Invalid break')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Bulk update availability for multiple days at once
// @route   POST /api/availability/bulk
// @access  Private
export const bulkUpdateAvailability = async (req, res, next) => {
  try {
    const { businessId, days } = req.body;

    if (!businessId || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId and an array of days',
      });
    }

    await validateBusinessOwnership(businessId, req.user._id);

    const operations = days.map(day => {
      const { dayOfWeek, isOpen, startTime, endTime, breaks } = day;
      // Validate dayOfWeek
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Invalid dayOfWeek in one of the entries');
      }
      // Basic validation, but we'll let the model validators handle details
      return {
        updateOne: {
          filter: { businessId, dayOfWeek },
          update: {
            $set: {
              isOpen: isOpen !== undefined ? isOpen : true,
              startTime: startTime || '09:00',
              endTime: endTime || '18:00',
              breaks: breaks || [],
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Availability.bulkWrite(operations);
    // Fetch updated records
    const updated = await Availability.find({ businessId }).sort({ dayOfWeek: 1 });

    res.status(200).json({
      success: true,
      message: 'Bulk availability updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message && error.message.includes('Invalid dayOfWeek')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};