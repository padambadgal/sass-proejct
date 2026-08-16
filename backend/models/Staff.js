import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Please provide a business ID'],
    },
    name: {
      type: String,
      required: [true, 'Please add staff name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
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

// Indexes
staffSchema.index({ businessId: 1, status: 1 });
staffSchema.index({ businessId: 1, email: 1 });

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;