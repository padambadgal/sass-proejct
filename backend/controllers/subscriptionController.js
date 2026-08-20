import {getPlansList, getPlan} from '../config/plans.js';
import Subscription from '../models/Subscription.js';
import { getActiveSubscription } from '../utils/planLimits.js';


export const getPlans  = async (req, res) => {
  try {
    const plans = getPlansList();
   res.send(JSON.stringify(plans));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const subscription = await getActiveSubscription(req.user._id);

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: null, // No active subscription
        message: 'No active subscription found',
      });
    }

    // Optionally populate plan details
    const plan = getPlan(subscription.plan);
    res.status(200).json({
      success: true,
      data: {
        ...subscription.toObject(),
        planDetails: plan,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
    });
  }
};

export const createTestSubscription = async (req, res) => {
  // This endpoint is ONLY for testing Day 2 before we have payment.
  // We will remove it on Day 3.
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  const { plan } = req.body;
  const validPlans = ['Basic', 'Professional', 'Business'];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ success: false, message: 'Invalid plan' });
  }

  const planConfig = getPlan(plan);
  if (!planConfig) {
    return res.status(400).json({ success: false, message: 'Plan not found' });
  }

  // Delete any existing subscription for this user
  await Subscription.deleteOne({ userId: req.user._id });

  const subscription = await Subscription.create({
    userId: req.user._id,
    plan,
    price: planConfig.price,
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    paymentId: 'test_payment_123',
  });

  res.status(201).json({
    success: true,
    message: `Test subscription for ${plan} created`,
    data: subscription,
  });
};