import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { user, refreshSubscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!planId) {
      toast.error('No plan selected');
      navigate('/pricing');
      return;
    }
    const fetchPlan = async () => {
      try {
        const res = await apiClient.get('/subscriptions/plans');
        const plans = res.data?.data || [];
        const found = plans.find(p => p.id === planId);
        if (!found) {
          toast.error('Invalid plan');
          navigate('/pricing');
          return;
        }
        setPlan(found);
      } catch {
        toast.error('Failed to load plan details');
        navigate('/pricing');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId, navigate]);

  const handlePayment = async () => {
    if (!plan) return;
    setProcessing(true);
    try {
      const orderRes = await apiClient.post('/payments/buy-plan', { plan: plan.id });
      const { orderId, amount, currency, keyId } = orderRes.data.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        setProcessing(false);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Appointment SaaS',
        description: `Subscribe to ${plan.name} plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await apiClient.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success('Payment successful! Subscription activated.');
            await refreshSubscription();
            navigate('/payment-success');
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
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#4f46e5' },
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

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <button
          onClick={() => navigate('/pricing')}
          className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Plans
        </button>

        <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
        <p className="text-gray-600 mb-4">Complete your subscription payment</p>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="font-semibold text-gray-900">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Price</span>
            <span className="font-semibold text-gray-900">₹{plan.price} / month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Billing</span>
            <span className="text-gray-700">Monthly</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={processing}
          className="mt-6 w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Processing...
            </>
          ) : (
            `Pay ₹${plan.price}`
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;