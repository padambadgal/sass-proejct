import Availability from '../models/Availability.js';
// import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Business from '../models/Business.js';

/**
 * Convert a time string "HH:MM" to minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to "HH:MM" string (zero‑padded)
 */
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Check if two time intervals [start1, end1) and [start2, end2) overlap
 * All times in minutes since midnight
 */
const intervalsOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

/**
 * Generate available slots for a given business, service, and date.
 *
 * @param {string} businessId - Business ObjectId
 * @param {string} serviceId - Service ObjectId
 * @param {string} dateStr - Date in "YYYY-MM-DD" format
 * @returns {Promise<string[]>} Array of available start times in "HH:MM" format
 */
export const generateAvailableSlots = async (businessId, serviceId, dateStr) => {
  // 1. Validate service
  const service = await Service.findOne({ _id: serviceId, status: 'active' });
  if (!service) {
    throw new Error('Service not found or inactive');
  }
  const duration = service.duration; // in minutes

  // 2. Validate business
  const business = await Business.findOne({ _id: businessId, isActive: true });
  if (!business) {
    throw new Error('Business not found or inactive');
  }

  // 3. Get day of week (0 = Sunday, 1 = Monday, ...)
  const dateObj = new Date(dateStr + 'T00:00:00'); // avoid timezone issues
  const dayOfWeek = dateObj.getDay();

  // 4. Find availability for that business and day
  const availability = await Availability.findOne({ businessId, dayOfWeek });
  if (!availability || !availability.isOpen) {
    return []; // Business is closed on this day
  }

  const startMinutes = timeToMinutes(availability.startTime);
  const endMinutes = timeToMinutes(availability.endTime);

  // 5. Build list of break intervals (in minutes)
  const breakIntervals = (availability.breaks || []).map(br => ({
    start: timeToMinutes(br.start),
    end: timeToMinutes(br.end),
  }));

  // 6. Fetch existing bookings for this business on this date that overlap with working hours
  // We only consider bookings that are pending or confirmed (not cancelled/no-show)
  const startOfDay = new Date(dateStr + 'T00:00:00');
  const endOfDay = new Date(dateStr + 'T23:59:59.999');

  const existingBookings = await Booking.find({
    businessId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
  }).lean();

  // Convert bookings to intervals in minutes (relative to midnight)
  const bookingIntervals = existingBookings.map(booking => {
    const start = timeToMinutes(booking.startTime);
    const duration = booking.duration || 30; // fallback, but we should store duration in booking
    return { start, end: start + duration };
  });

  // 7. Generate candidate slots
  // We'll generate slots starting at every 15 minutes within the working window,
  // but we can also set a configurable step (e.g., service duration? But often you want 15-min increments).
  const stepMinutes = 15; // fixed step for simplicity
  const slots = [];

  // Candidate start times from startMinutes to (endMinutes - duration) inclusive
  let candidateStart = startMinutes;
  while (candidateStart + duration <= endMinutes) {
    // Check if candidateStart falls within any break
    const inBreak = breakIntervals.some(br => 
      candidateStart >= br.start && candidateStart < br.end
    );
    // Also check if the appointment would overlap a break (i.e., the duration spans into a break)
    const overlapsBreak = breakIntervals.some(br => 
      intervalsOverlap(candidateStart, candidateStart + duration, br.start, br.end)
    );

    if (!inBreak && !overlapsBreak) {
      // Check if this slot overlaps any existing booking
      const overlapsBooking = bookingIntervals.some(book =>
        intervalsOverlap(candidateStart, candidateStart + duration, book.start, book.end)
      );
      if (!overlapsBooking) {
        slots.push(minutesToTime(candidateStart));
      }
    }
    candidateStart += stepMinutes;
  }

  return slots;
};