import mongoose from 'mongoose';

const breakSchema = new mongoose.Schema(
    {
        start: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
        },
        end: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
    },
    { _id: false }
);

const availabilitySchema = new mongoose.Schema(
    {
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'Please provide a business ID'],
        },
        dayOfWeek: {
            type: Number,
            required: [true, 'Please specify a day of week (0-6)'],
            min: 0,
            max: 6,
        },
        isOpen: {
            type: Boolean,
            default: true,
        },
        startTime: {
            type: String,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            default: '09:00',
        },
        endTime: {
            type: String,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            default: '18:00',
        },
        breaks: [breakSchema],
    },
    {
        timestamps: true,
    }
);

// Ensure only one availability record per business per day
availabilitySchema.index({ businessId: 1, dayOfWeek: 1 }, { unique: true });

// Pre-save validation: ensure startTime < endTime and breaks are within range
availabilitySchema.pre('save', function (next) {
    if (!this.isOpen) {
        return next();
    }

    // Validate startTime < endTime
    if (this.startTime >= this.endTime) {
        return next(new Error('Start time must be before end time'));
    }

    // Validate breaks are within startTime and endTime
    for (const br of this.breaks) {
        if (br.start < this.startTime || br.end > this.endTime || br.start >= br.end) {
            return next(new Error(`Invalid break: ${br.start} - ${br.end}. Breaks must be within working hours and start before end.`));
        }
        // Check breaks don't overlap each other (optional, can add later)
    }

    next();
});

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;