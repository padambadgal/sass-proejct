import { getActiveSubscription } from '../utils/planLimits.js';

export const requireActiveSubscription = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware (we must apply 'protect' before this)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login first',
      });
    }

    const subscription = await getActiveSubscription(req.user._id);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required. Please subscribe to a plan.',
      });
    }

    // Attach subscription to request for later use
    req.subscription = subscription;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error checking subscription',
    });
  }
};