import {
  generateAvailableSlots,
  getAvailableSlotTimes,
  filterPastSlots,
} from '../services/slotService.js';
import Business from '../models/Business.js';

// @desc    Get available slots for a business, service, and date
// @route   GET /api/slots/available
// @access  Public
export const getAvailableSlotsController = async (req, res) => {
  try {
    const { businessId, serviceId, date } = req.query;

    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: businessId, serviceId, date',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
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

    // ✅ generateAvailableSlots returns a plain array now
    let slots = await generateAvailableSlots(businessId, serviceId, date);
    slots = filterPastSlots(slots, date, business.timezone);

    res.status(200).json({
      success: true,
      data: {
        date,
        availableSlots: slots,
      },
    });
  } catch (error) {
    console.error('Slot generation error:', error);
    if (error.message === 'Business not found or inactive') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Service not found or inactive') {
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

    const business = await Business.findOne({ _id: businessId, isActive: true });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found or inactive',
      });
    }

    let slots = await getAvailableSlotTimes(businessId, serviceId, date);
    slots = filterPastSlots(slots, date, business.timezone);

    res.status(200).json({
      success: true,
      data: { date, availableSlots: slots },
    });
  } catch (error) {
    console.error('Slot generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating available slots',
    });
  }
};
