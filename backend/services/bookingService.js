import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Business from '../models/Business.js';
import Customer from '../models/Customer.js';
import { getAvailableSlotTimes } from './slotService.js';
import { canCreateAppointment } from '../utils/planLimits.js';
import { generateBookingReference } from '../utils/bookingReference.js';
import { sendBookingConfirmation } from './notificationService.js';

/**
 * Create a new booking with all validations
 */
export const createBooking = async (bookingData) => {
  const {
    businessId,
    serviceId,
    date,
    startTime,
    customer: { name, email, phone },
    notes,
    staffId,
    bookedBy = 'customer',
  } = bookingData;

  // 1. Validate business
  const business = await Business.findOne({ _id: businessId, isActive: true });
  if (!business) {
    throw new Error('Business not found or inactive');
  }

  // 2. Validate service
  const service = await Service.findOne({ _id: serviceId, businessId, status: 'active' });
  if (!service) {
    throw new Error('Service not found or inactive for this business');
  }

  // 3. Validate date is not in the past
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    throw new Error('Cannot book for a past date');
  }

  // 4. Calculate endTime based on service duration
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + service.duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

  // 5. Check slot availability using slot engine
  const availableSlots = await getAvailableSlotTimes(businessId, serviceId, date);
  if (!availableSlots.includes(startTime)) {
    throw new Error('Selected time slot is not available');
  }

  // 6. Check daily appointment limit
  const canCreate = await canCreateAppointment(businessId, date);
  if (!canCreate) {
    throw new Error('Daily appointment limit reached for your plan');
  }

  // 7. Find or create customer
  let customer = await Customer.findOne({
    businessId,
    $or: [{ email: email }, { phone: phone }],
    status: 'active',
  });

  if (!customer) {
    customer = await Customer.create({
      businessId,
      name,
      email,
      phone,
      notes: notes || '',
      status: 'active',
      totalBookings: 0,
    });
  }

  // 8. Generate unique booking reference
  let reference;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    reference = generateBookingReference(date);
    const existing = await Booking.findOne({ bookingReference: reference });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    throw new Error('Failed to generate unique booking reference');
  }

  // 9. Create booking

  let booking;

  try {

    const booking = await Booking.create({
      businessId,
      serviceId,
      staffId: staffId || null,
      customer: { name, email, phone },
      customerId: customer._id,
      date: bookingDate,
      startTime,
      endTime,
      status: 'pending',
      paymentStatus: 'unpaid',
      bookingReference: reference,
      notes: notes || '',
      bookedBy,
    });

    // 10. Increment customer totalBookings
    await Customer.findByIdAndUpdate(customer._id, { $inc: { totalBookings: 1 } });

    // 11. Populate service details for response
    await booking.populate('serviceId', 'name price duration');
    await booking.populate('businessId', 'name slug');
    
    sendBookingConfirmation(booking).catch(err => console.error('Email error:', err));

    return booking;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Selected time slot is not available (duplicate booking prevented)');
    }
    throw error;
  }
};