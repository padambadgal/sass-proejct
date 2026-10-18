import Availability from '../models/Availability.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Business from '../models/Business.js';
import { cacheGet, cacheSet } from '../config/redis.js';

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

const intervalsOverlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;


const dayBoundary = (dateStr) => ({
  start: new Date(dateStr + 'T00:00:00Z'),
  end: new Date(dateStr + 'T23:59:59.999Z'),
});
/**
 * Generate available slots (returns plain array of "HH:MM")
 */
export const generateAvailableSlots = async (
  businessId,
  serviceId,
  dateStr,
  overrideDuration = null,
  staffId = null
) => {
  // ---------- Cache key includes staffId ----------
  const cacheKey = `slots:${businessId}:${serviceId}:${dateStr}:${overrideDuration || 'default'}:${staffId || 'any'}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  // ---------- Validate service ----------
  const service = await Service.findOne({ _id: serviceId, status: 'active' });
  if (!service) throw new Error('Service not found or inactive');
  const duration = overrideDuration || service.duration;

  // ---------- Validate business ----------
  const business = await Business.findOne({ _id: businessId, isActive: true });
  if (!business) throw new Error('Business not found or inactive');

  // ---------- Day-of-week availability ----------
  const dateObj = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = dateObj.getUTCDay();

  const availability = await Availability.findOne({ businessId, dayOfWeek });
  if (!availability || !availability.isOpen) {
    await cacheSet(cacheKey, [], 60);
    return [];
  }

  const startMinutes = timeToMinutes(availability.startTime);
  const endMinutes = timeToMinutes(availability.endTime);

  const breakIntervals = (availability.breaks || []).map((br) => ({
    start: timeToMinutes(br.start),
    end: timeToMinutes(br.end),
  }));

  // ---------- Fetch bookings for the day ----------
  const { start, end } = dayBoundary(dateStr);

  const bookingFilter = {
    businessId,
    date: { $gte: start, $lte: end },
    status: { $in: ['pending', 'confirmed'] },
  };

  // ✅ If a specific staff is selected, only block that staff's slots.
  // Otherwise (single-provider / no staff chosen), block all business slots.
  if (staffId) {
    bookingFilter.staffId = staffId;
  }

  const existingBookings = await Booking.find(bookingFilter)
    .select('startTime endTime staffId')
    .lean();

  const bookingIntervals = existingBookings.map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  // ---------- Generate slots ----------
  const stepMinutes = 15;
  const slots = [];
  let candidate = startMinutes;

  while (candidate + duration <= endMinutes) {
    const overlapsBreak = breakIntervals.some((br) =>
      intervalsOverlap(candidate, candidate + duration, br.start, br.end)
    );

    if (!overlapsBreak) {
      const overlapsBooking = bookingIntervals.some((bk) =>
        intervalsOverlap(candidate, candidate + duration, bk.start, bk.end)
      );
      if (!overlapsBooking) slots.push(minutesToTime(candidate));
    }

    candidate += stepMinutes;
  }

  await cacheSet(cacheKey, slots, 120);
  return slots;
};

/**
 * Wrapper that accepts optional duration override
 */
export const getAvailableSlotTimes = async (businessId, serviceId, dateStr, overrideDuration = null, staffId = null) => {
  return generateAvailableSlots(
    businessId,
    serviceId,
    dateStr,
    overrideDuration,
    staffId);
};

/**
 * Filter out past slots
 */
const getDateTimeInTimezone = (timeZone, date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
};

export const isDateInPast = (dateStr, timeZone = 'Asia/Kolkata') => {
  const { date: today } = getDateTimeInTimezone(timeZone);
  return dateStr < today;
};

export const filterPastSlots = (slots, dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const givenDate = new Date(dateStr + 'T00:00:00Z');

  if (givenDate < today) return [];

  if (givenDate.getTime() === today.getTime()) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m >= currentMin;
    });
  }

  return slots;
};