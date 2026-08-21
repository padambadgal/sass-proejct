import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Business from '../models/Business.js';
import { jsonToCSV } from '../utils/csvHelper.js';

// Helper: check business ownership
const validateBusinessOwnership = async (businessId, userId) => {
  const business = await Business.findOne({ _id: businessId, ownerId: userId });
  if (!business) throw new Error('Business not found or you do not own it');
  return business;
};

// Helper: get start and end of a day
const getStartAndEndOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview?businessId=xxx
// @access  Private
export const getOverview = async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId required' });
    }
    await validateBusinessOwnership(businessId, req.user._id);

    const today = new Date();
    const { start: startOfDay, end: endOfDay } = getStartAndEndOfDay(today);

    // Total bookings (excluding cancelled)
    const totalBookings = await Booking.countDocuments({
      businessId,
      status: { $ne: 'cancelled' }
    });

    // Total active customers
    const totalCustomers = await Customer.countDocuments({
      businessId,
      status: 'active'
    });

    // Total revenue from completed bookings
    const revenueAgg = await Booking.aggregate([
      { $match: { businessId, status: 'completed' } },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      { $group: { _id: null, total: { $sum: '$service.price' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Today's bookings (pending, confirmed, completed)
    const todayBookings = await Booking.find({
      businessId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'completed'] }
    })
      .populate('serviceId', 'name price')
      .populate('customerId', 'name')
      .sort({ startTime: 1 });

    // Upcoming bookings (next 7 days, excluding today)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const upcomingBookings = await Booking.find({
      businessId,
      date: { $gt: endOfDay, $lte: nextWeek },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('serviceId', 'name price')
      .populate('customerId', 'name')
      .sort({ date: 1, startTime: 1 });

    // Cancellation rate (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const totalLast30 = await Booking.countDocuments({
      businessId,
      createdAt: { $gte: thirtyDaysAgo }
    });
    const cancelledLast30 = await Booking.countDocuments({
      businessId,
      status: 'cancelled',
      createdAt: { $gte: thirtyDaysAgo }
    });
    const cancellationRate = totalLast30 > 0 ? (cancelledLast30 / totalLast30) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalCustomers,
        totalRevenue,
        todayBookingsCount: todayBookings.length,
        todayBookings,
        upcomingBookingsCount: upcomingBookings.length,
        upcomingBookings,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        dateRange: {
          from: startOfDay,
          to: endOfDay
        }
      }
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for a period
// @route   GET /api/dashboard/bookings?businessId=xxx&period=day|week|month&date=YYYY-MM-DD
// @access  Private
export const getBookingsByPeriod = async (req, res) => {
  try {
    const { businessId, period = 'day', date } = req.query;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId required' });
    }
    await validateBusinessOwnership(businessId, req.user._id);

    let startDate, endDate;
    const baseDate = date ? new Date(date) : new Date();

    switch (period) {
      case 'day':
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week': {
        const dayOfWeek = baseDate.getDay(); // 0=Sun
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'month':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid period' });
    }

    const bookings = await Booking.find({
      businessId,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    })
      .populate('serviceId', 'name price')
      .populate('customerId', 'name')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        count: bookings.length,
        bookings
      }
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get revenue for a period
// @route   GET /api/dashboard/revenue?businessId=xxx&period=day|week|month&date=YYYY-MM-DD
// @access  Private
export const getRevenueByPeriod = async (req, res) => {
  try {
    const { businessId, period = 'day', date } = req.query;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId required' });
    }
    await validateBusinessOwnership(businessId, req.user._id);

    let startDate, endDate;
    const baseDate = date ? new Date(date) : new Date();

    switch (period) {
      case 'day':
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week': {
        const dayOfWeek = baseDate.getDay();
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'month':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid period' });
    }

    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          businessId,
          date: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$service.price' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;
    const count = revenueAgg.length > 0 ? revenueAgg[0].count : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        totalRevenue,
        completedBookingsCount: count
      }
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get most popular services
// @route   GET /api/dashboard/popular-services?businessId=xxx&limit=5
// @access  Private
export const getPopularServices = async (req, res) => {
  try {
    const { businessId, limit = 5 } = req.query;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId required' });
    }
    await validateBusinessOwnership(businessId, req.user._id);

    const popular = await Booking.aggregate([
      { $match: { businessId, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $project: {
          serviceId: '$_id',
          name: '$service.name',
          price: '$service.price',
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: popular
    });
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export CSV report of bookings
// @route   GET /api/dashboard/report?businessId=xxx&period=month&date=YYYY-MM-DD
// @access  Private
export const exportReport = async (req, res) => {
  try {
    const { businessId, period = 'month', date } = req.query;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId required' });
    }
    await validateBusinessOwnership(businessId, req.user._id);

    // Determine date range
    let startDate, endDate;
    const baseDate = date ? new Date(date) : new Date();

    switch (period) {
      case 'day':
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week': {
        const dayOfWeek = baseDate.getDay();
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'month':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid period' });
    }

    // Fetch bookings for the period
    const bookings = await Booking.find({
      businessId,
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('serviceId', 'name price')
      .populate('customerId', 'name email phone')
      .lean();

    // Transform to flat objects for CSV
    const reportData = bookings.map(b => ({
      'Booking Reference': b.bookingReference || '',
      'Date': b.date ? b.date.toISOString().split('T')[0] : '',
      'Start Time': b.startTime || '',
      'End Time': b.endTime || '',
      'Service': b.serviceId?.name || '',
      'Price': b.serviceId?.price || 0,
      'Customer': b.customer?.name || '',
      'Customer Email': b.customer?.email || '',
      'Customer Phone': b.customer?.phone || '',
      'Status': b.status || '',
      'Payment Status': b.paymentStatus || '',
    }));

    const csv = jsonToCSV(reportData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report_${period}_${startDate.toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    if (error.message === 'Business not found or you do not own it') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};