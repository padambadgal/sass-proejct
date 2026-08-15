import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Please provide a business ID'],
    },
    name: {
      type: String,
      required: [true, 'Please add a service name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Please add duration in minutes'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    image: {
      type: String, // URL to uploaded image
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
serviceSchema.index({ businessId: 1, status: 1 });
serviceSchema.index({ businessId: 1, name: 1 });

const Service = mongoose.model('Service', serviceSchema);
export default Service;