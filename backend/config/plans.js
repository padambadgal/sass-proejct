export const PLANS = {
  Basic: {
    id: 'Basic',
    name: 'Basic',
    price: 499,
    currency: 'INR',
    maxBusinesses: 1,
    maxServices: 1,
    maxAppointmentsPerDay: 10,
    maxStaff: 1,
    features: [
      '1 Business',
      '1 Service',
      '10 appointments/day',
      '1 Staff',
      'Public booking page',
      'Booking URL',
      'Customer management',
      'Availability',
      'Booking management',
      'Business logo',
      'Basic booking history',
    ],
  },
  Professional: {
    id: 'Professional',
    name: 'Professional',
    price: 899,
    currency: 'INR',
    maxBusinesses: 2,
    maxServices: 5,
    maxAppointmentsPerDay: 25,
    maxStaff: 5,
    features: [
      'Everything in Basic',
      '5 Services',
      '25 appointments/day',
      '5 Staff',
      'Online payments',
      'Booking reminders',
      'Customer history',
      'Customer notes',
      'Revenue analytics',
      'Booking reports',
      'CSV export',
      'Advanced availability',
      'Email notifications',
    ],
    isMostPopular: true, // UI flag
  },
  Business: {
    id: 'Business',
    name: 'Business',
    price: 1200,
    currency: 'INR',
    maxBusinesses: 10,
    maxServices: Infinity,
    maxAppointmentsPerDay: 50,
    maxStaff: 15,
    features: [
      'Everything in Professional',
      'Multiple Businesses',
      'Multiple Locations',
      'Unlimited Services',
      '50 appointments/day',
      '15+ Staff',
      'Advanced Analytics',
      'Revenue Reports',
      'Booking Reports',
      'CSV Export',
      'Priority Support',
    ],
  },
};

// Helper to get a plan by id
export const getPlan = (planId) => {
  return PLANS[planId] || null;
};

// Helper to get all plans as an array
export const getPlansList = () => {
  return Object.values(PLANS);
};