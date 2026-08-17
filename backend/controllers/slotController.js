import { generateAvailableSlots } from '../services/slotService.js';

// @desc    Get available slots for a business, service, and date
// @route   GET /api/slots/available
// @access  Private (but will be public on Day 12)
export const getAvailableSlots = async (req, res) => {
  try {
    const { businessId, serviceId, date } = req.query;

    // Validate required fields
    if (!businessId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: businessId, serviceId, date',
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Optional: check if the date is in the future? We'll allow past dates for testing.
    // But we can add a check if needed.

    // Generate slots
    const slots = await generateAvailableSlots(businessId, serviceId, date);

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    // Handle specific errors from the service
    if (error.message === 'Service not found or inactive' ||
        error.message === 'Business not found or inactive') {
      return res.status(404).json({ success: false, message: error.message });
    }
    // Other errors
    console.error('Slot generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating slots',
    });
  }
};