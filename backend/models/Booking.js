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

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },

    customer: {
      name: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

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

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'no_show',
      ],
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: [
        'unpaid',
        'paid',
        'refunded',
        'failed',
      ],
      default: 'unpaid',
    },

    paymentId: {
      type: String,
      default: null,
    },

    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },

    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },

    bookedBy: {
      type: String,
      enum: ['customer', 'owner', 'staff'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
bookingSchema.index({
  businessId: 1,
  date: 1,
  status: 1,
});

bookingSchema.index({
  businessId: 1,
  date: 1,
  startTime: 1,
});

bookingSchema.index({
  customerId: 1,
});

bookingSchema.index({
  businessId: 1,
  status: 1,
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;