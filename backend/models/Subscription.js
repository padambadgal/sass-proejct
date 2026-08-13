import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One active subscription per user (we can have multiple but we keep one at a time)
    },
    plan: {
      type: String,
      enum: ['Basic', 'Professional', 'Business'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'cancelled', 'expired'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    }, // Will store payment reference after Day 3
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
subscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;