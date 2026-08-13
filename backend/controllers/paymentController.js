import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import { getPlan } from '../config/plans.js';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay order
// @route   POST /api/payments/buy-plan
// @access  Private (user must be logged in)
export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    // Validate plan
    const planConfig = getPlan(plan);
    if (!planConfig) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected',
      });
    }

    // Check if user already has an active subscription? We allow only one active.
    // But we can still create order for a new plan; we'll handle upgrade later.
    // For now, we'll just create order for the chosen plan.

    const amount = planConfig.price; // in INR
    const currency = planConfig.currency || 'INR';

    // Create order in Razorpay
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (INR)
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // auto-capture
      notes: {
        userId: req.user._id.toString(),
        plan: plan,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    // Save payment record in our DB
    const payment = await Payment.create({
      userId: req.user._id,
      orderId: order.id,
      plan,
      amount,
      currency,
      status: 'created',
    });

    // Send order details to frontend
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id, // our internal id
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
    });
  }
};

// @desc    Verify payment signature and activate subscription
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      paymentId,
      signature,
    } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details',
      });
    }

    // Find the payment record in our DB
    const paymentRecord = await Payment.findOne({ orderId });
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Verify signature using Razorpay's method
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Signature is valid – payment is successful
    // Update payment record
    paymentRecord.paymentId = paymentId;
    paymentRecord.signature = signature;
    paymentRecord.status = 'paid';
    await paymentRecord.save();

    // Activate subscription
    // Find or create subscription for this user
    const plan = paymentRecord.plan;
    const planConfig = getPlan(plan);
    if (!planConfig) {
      throw new Error('Plan configuration missing');
    }

    // Upsert subscription: remove any existing (if any) and create new active one
    // For simplicity, we delete any existing subscription for this user and create a new one.
    // Alternatively, we could update the existing if we support upgrades.
    await Subscription.deleteOne({ userId: req.user._id });

    const subscription = await Subscription.create({
      userId: req.user._id,
      plan: plan,
      price: planConfig.price,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paymentId: paymentId,
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Subscription activated.',
      data: {
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
};

// @desc    Webhook to handle Razorpay events (optional but recommended)
// @route   POST /api/payments/webhook
// @access  Public (but must verify signature)
export const webhookHandler = async (req, res) => {
  try {
    // Verify webhook signature (if you set a webhook secret)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different events
    switch (event) {
      case 'payment.failed':
        // Update payment status to failed
        const paymentId = payload.payment.entity.id;
        await Payment.findOneAndUpdate(
          { paymentId },
          { status: 'failed' },
          { new: true }
        );
        // Optionally log or notify user
        break;

      case 'payment.refunded':
        // Mark as refunded
        const refundPaymentId = payload.payment.entity.id;
        await Payment.findOneAndUpdate(
          { paymentId: refundPaymentId },
          { status: 'refunded' }
        );
        // Also deactivate subscription? Or handle as per business logic
        break;

      // Add more events as needed
      default:
        // Do nothing
        break;
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still respond with 200 to avoid retries
    res.status(200).json({ success: false, message: 'Webhook processing error' });
  }
};