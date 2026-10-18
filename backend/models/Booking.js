import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    // ✅ Optional — null for single-provider businesses that don't assign staff
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
      index: true,
    },
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    date: { type: Date, required: true },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    totalPrice: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
    },
    paymentId: { type: String, default: null },
    bookingReference: { type: String, unique: true, required: true },
    notes: { type: String, default: '', maxlength: 500 },
    bookedBy: {
      type: String,
      enum: ['customer', 'owner', 'staff'],
      default: 'customer',
    },
  },
  { timestamps: true }
);

// ============================================================
// Indexes
// ============================================================

// Fast queries by business + date
bookingSchema.index({ businessId: 1, date: 1, status: 1 });

// Fast queries by staff + date
bookingSchema.index({ staffId: 1, date: 1, status: 1 });

// Fast queries by customer
bookingSchema.index({ customerId: 1 });

// ============================================================
// ✅ Uniqueness — one booking per staff per slot
//
// Why staffId is included:
//   Two staff members CAN be booked at the same start time for the
//   same business. The index prevents double-booking only for the
//   SAME staff member (or same "null staff" for single-provider mode).
//
// Why partialFilterExpression:
//   Cancelled and no_show bookings free the slot, so they must not
//   participate in the uniqueness constraint.
// ============================================================
bookingSchema.index(
  { businessId: 1, staffId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] },
    },
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;