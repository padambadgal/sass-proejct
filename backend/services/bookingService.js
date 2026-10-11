import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Business from '../models/Business.js';
import Customer from '../models/Customer.js';
import { filterPastSlots, getAvailableSlotTimes, isDateInPast } from './slotService.js';
import { canCreateAppointment } from '../utils/planLimits.js';
import { generateBookingReference } from '../utils/bookingReference.js';
import { sendBookingConfirmation } from './notificationService.js';

/**
 * Create a new booking with all validations
 */
export const createBooking = async (bookingData) => {
  try {
    const {
      businessId,
      serviceId,
      serviceIds = [serviceId],
      totalDuration = null,
      totalPrice = null,
      date,
      startTime,
      customer,
      notes,
      staffId,
      bookedBy = 'customer',
    } = bookingData;

    // 1. Validate business
    const business = await Business.findOne({ _id: businessId, isActive: true });
    if (!business) throw new Error('Business not found or inactive');

    // 2. Validate primary service (or we can just use the first service)
    const primaryService = await Service.findOne({ _id: serviceId, businessId, status: 'active' });
    if (!primaryService) throw new Error('Primary service not found or inactive for this business');

    // 3. Validate date
    if (isDateInPast(date, business.timezone)) {
      throw new Error('Cannot book for a past date');
    }
    const bookingDate = new Date(`${date}T00:00:00Z`);

    // 4. Use provided totalDuration, or fallback to primary service duration
    const duration = totalDuration || primaryService.duration;
    const price = totalPrice || primaryService.price;

    // 5. Calculate endTime based on duration
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // 6. Check slot availability using duration
    const availableSlots = filterPastSlots(
      await getAvailableSlotTimes(businessId, serviceId, date),
      date,
      business.timezone
    );
    if (!availableSlots.includes(startTime)) {
      throw new Error('Selected time slot is not available');
    }

    // 7. Check daily limit (as before)
    const canCreate = await canCreateAppointment(businessId, date);
    if (!canCreate) throw new Error('Daily appointment limit reached for your plan');

    // 8. Find or create customer
    let customerDoc = await Customer.findOne({
      businessId,
      $or: [{ email: customer.email }, { phone: customer.phone }],
      status: 'active',
    });
    if (!customerDoc) {
      customerDoc = await Customer.create({
        businessId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: notes || '',
        status: 'active',
        totalBookings: 0,
      });
    }

    // 9. Generate unique booking reference (same as before)
    let reference;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      reference = generateBookingReference(date);
      const existing = await Booking.findOne({ bookingReference: reference });
      if (!existing) isUnique = true;
      attempts++;
    }
    if (!isUnique) throw new Error('Failed to generate unique booking reference');

    // 10. Create booking with all fields
    const booking = await Booking.create({
      businessId,
      serviceId,              // primary (for compatibility)
      serviceIds,             // all service IDs
      totalPrice: price,
      duration,
      staffId: staffId || null,
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
      customerId: customerDoc._id,
      date: bookingDate,
      startTime,
      endTime,
      status: 'pending',
      paymentStatus: 'unpaid',
      bookingReference: reference,
      notes: notes || '',
      bookedBy,
    });

    // 11. Increment customer totalBookings
    await Customer.findByIdAndUpdate(customerDoc._id, { $inc: { totalBookings: 1 } });

    // 12. Populate for response
    await booking.populate('serviceId', 'name price duration');
    await booking.populate('businessId', 'name slug');

    // Notify the customer and business immediately, regardless of booking status.
    sendBookingConfirmation(booking).catch((error) => {
      console.error('Booking notification error:', error);
    });

    return booking;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Selected time slot is not available (duplicate booking prevented)');
    }
    throw error;
  }
};
