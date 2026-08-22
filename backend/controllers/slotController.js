import { generateAvailableSlots, getAvailableSlotTimes } from '../services/slotService.js';
import Business from '../models/Business.js';

/**
 * Filter out slots that are already in the past.
 * - For a past date: returns empty array.
 * - For today: keeps only slots whose start time >= current time.
 * - For future dates: returns the original array unchanged.
 *
 * @param {string[]} slots - Array of "HH:MM" strings
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string[]} Filtered slots
 */
const filterPastSlots = (slots, dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const givenDate = new Date(dateStr + 'T00:00:00');

  // Date is in the past → no slots available
  if (givenDate < today) {
    return [];
  }

  // Date is today → filter out times that have already passed
  if (givenDate.getTime() === today.getTime()) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      // Keep slots that start now or in the future
      return slotMinutes >= currentMinutes;
    });
  }

  // Future date → all slots are valid
  return slots;
};

// @desc    Get available slots for a business, service, and date
// @route   GET /api/slots/available
// @access  Public
export const getAvailableSlotsController  = async (req, res) => {
  try {
    const { businessId, serviceId, date } = req.query;

    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: businessId, serviceId, date',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD',
      });
    }

    const business = await Business.findOne({ _id: businessId, isActive: true });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found or inactive',
      });
    }

    // Get available slots (returns an object, e.g. { success: true, data: { isOpen, availableSlots } })
    const result = await generateAvailableSlots(businessId, serviceId, date);

    // If the service returned success but we have slots, apply the time filter
    if (result.success && result.data && Array.isArray(result.data.availableSlots)) {
      result.data.availableSlots = filterPastSlots(result.data.availableSlots, date);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Slot generation error:', error);
    if (error.message === 'Business not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Service not found or not active') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error generating available slots',
    });
  }
};

// @desc    Get available slot times only (simple array)
// @route   GET /api/slots/available-times
// @access  Public
export const getAvailableSlotTimesController = async (req, res) => {
  try {
    const { businessId, serviceId, date } = req.query;

    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: businessId, serviceId, date',
      });
    }

    let slots = await getAvailableSlotTimes(businessId, serviceId, date);

    // Apply the same filtering logic for past dates / past times
    slots = filterPastSlots(slots, date);

    res.status(200).json({
      success: true,
      data: {
        date,
        availableSlots: slots,
      },
    });
  } catch (error) {
    console.error('Slot generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating available slots',
    });
  }
};