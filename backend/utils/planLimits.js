import { PLANS, getPlan } from '../config/plans.js';
import Subscription from '../models/Subscription.js';
import Business from '../models/Business.js';
// import Service from '../models/Service.js';
// import Staff from '../models/Staff.js';
// import Booking from '../models/Booking.js';

// Helper to safely handle Infinity
const toSafeNumber = (value) => {
  if (value === Infinity || value === Number.POSITIVE_INFINITY) {
    return Number.MAX_SAFE_INTEGER;
  }
  return value;
};

// Get active subscription for a user
// Update the function to check expiry
export const getActiveSubscription = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: new Date() }, // only if not expired
  });
  return subscription;
};

// Get plan limits for a user (throws error if no active subscription)
export const getPlanLimitsForUser = async (userId) => {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    throw new Error('No active subscription found');
  }
  const plan = getPlan(subscription.plan);
  if (!plan) {
    throw new Error('Invalid plan configuration');
  }
  return {
    plan,
    subscription,
    limits: {
      maxBusinesses: toSafeNumber(plan.maxBusinesses),
      maxServices: toSafeNumber(plan.maxServices),
      maxStaff: toSafeNumber(plan.maxStaff),
      maxAppointmentsPerDay: toSafeNumber(plan.maxAppointmentsPerDay),
    },
  };
};

// // Check business limit
export const canCreateBusiness = async (userId) => {
  const { limits } = await getPlanLimitsForUser(userId);
  const businessCount = await Business.countDocuments({ ownerId: userId, isActive: true  });
  return businessCount < limits.maxBusinesses;
};

// // Check service limit for a business
// export const canCreateService = async (businessId) => {
//   // Find business owner via business
//   const business = await Business.findById(businessId);
//   if (!business) throw new Error('Business not found');
//   const { limits } = await getPlanLimitsForUser(business.ownerId);
//   const serviceCount = await Service.countDocuments({ businessId });
//   return serviceCount < limits.maxServices;
// };

// // Check staff limit for a business
// export const canCreateStaff = async (businessId) => {
//   const business = await Business.findById(businessId);
//   if (!business) throw new Error('Business not found');
//   const { limits } = await getPlanLimitsForUser(business.ownerId);
//   const staffCount = await Staff.countDocuments({ businessId });
//   return staffCount < limits.maxStaff;
// };

// // Check daily appointment limit for a business (on a specific date)
// export const canCreateAppointment = async (businessId, date) => {
//   const business = await Business.findById(businessId);
//   if (!business) throw new Error('Business not found');
//   const { limits } = await getPlanLimitsForUser(business.ownerId);

//   // Count bookings for this business on the given date
//   // We consider only 'pending' and 'confirmed' as consuming the daily limit
//   // (cancelled/no_show will free the slot, but we count only confirmed/pending for limit)
//   const startOfDay = new Date(date);
//   startOfDay.setHours(0, 0, 0, 0);
//   const endOfDay = new Date(date);
//   endOfDay.setHours(23, 59, 59, 999);

//   const bookingCount = await Booking.countDocuments({
//     businessId,
//     date: { $gte: startOfDay, $lte: endOfDay },
//     status: { $in: ['pending', 'confirmed'] },
//   });

//   return bookingCount < limits.maxAppointmentsPerDay;
// };

// // Get remaining daily slots for display (optional)
// export const getRemainingDailySlots = async (businessId, date) => {
//   const business = await Business.findById(businessId);
//   if (!business) throw new Error('Business not found');
//   const { limits } = await getPlanLimitsForUser(business.ownerId);

//   const startOfDay = new Date(date);
//   startOfDay.setHours(0, 0, 0, 0);
//   const endOfDay = new Date(date);
//   endOfDay.setHours(23, 59, 59, 999);

//   const bookingCount = await Booking.countDocuments({
//     businessId,
//     date: { $gte: startOfDay, $lte: endOfDay },
//     status: { $in: ['pending', 'confirmed'] },
//   });

//   const max = limits.maxAppointmentsPerDay;
//   return Math.max(0, max - bookingCount);
// };