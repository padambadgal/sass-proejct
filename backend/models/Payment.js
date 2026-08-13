import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true, // Razorpay order ID is unique
    },
    paymentId: {
      type: String,
      default: null, // Will be set after successful payment
    },
    signature: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ['Basic', 'Professional', 'Business'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed, // flexible for extra data
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
paymentSchema.index({ userId: 1, orderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;