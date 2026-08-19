import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Please provide a business ID'],
    },

    name: {
      type: String,
      required: [true, 'Please add customer name'],
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
      index: true,
      default: '',
    },

    phone: {
      type: String,
      trim: true,
      index: true,
      required: [true, 'Please add a phone number'],
    },

    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
      default: '',
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    totalBookings: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// Index for customer status
customerSchema.index({
  businessId: 1,
  status: 1,
});

// Unique email per business
// Only applies when email is not empty
customerSchema.index(
  {
    businessId: 1,
    email: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      email: { $ne: '' },
    },
  }
);

// Unique phone per business
customerSchema.index(
  {
    businessId: 1,
    phone: 1,
  },
  {
    unique: true,
  }
);

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;