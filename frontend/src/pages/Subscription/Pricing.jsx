import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Loader2, Check, Crown } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { subscription, refreshSubscription, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already has active subscription
  useEffect(() => {
    if (subscription && subscription.status === 'active') {
      navigate('/dashboard');
    }
  }, [subscription, navigate]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiClient.get('/subscriptions/plans');
        setPlans(res.data.data);
      } catch (err) {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create order
      const orderRes = await apiClient.post('/payments/create-order', { plan: planId });
      const { orderId, amount, currency, keyId } = orderRes.data.data;

      // 2. Load Razorpay script if not loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        setProcessing(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Appointment SaaS',
        description: `Subscribe to ${plans.find(p => p.id === planId)?.name} plan`,
        order_id: orderId,
        handler: async (response) => {
          // Payment successful – verify on backend
          try {
            const verifyRes = await apiClient.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success('Payment successful! Subscription activated.');
            await refreshSubscription();
            navigate('/dashboard');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
          setProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.error('Payment cancelled');
          },
        },
        prefill: {
          // You can prefill with user details if needed
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Start managing your appointments today
          </p>
        </div>
        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden relative ${
                plan.isMostPopular ? 'border-2 border-indigo-500' : ''
              }`}
            >
              {plan.isMostPopular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Crown size={12} /> Most Popular
                </div>
              )}
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                  <span className="text-base text-gray-500">/month</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing}
                  className={`mt-8 w-full py-3 px-4 rounded-md text-white font-semibold ${
                    plan.isMostPopular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : 'Subscribe'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;