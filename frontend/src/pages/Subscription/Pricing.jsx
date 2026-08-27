import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Loader2, Check, Crown } from 'lucide-react';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, hasActiveSubscription, subscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiClient.get('/subscriptions/plans');
        setPlans(res.data?.data || []);
      } catch {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleChoosePlan = (planId) => {
    if (!isAuthenticated) {
      navigate(`/register?plan=${planId}`);
    } else {
      navigate(`/checkout?plan=${planId}`);
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
        {/* Active subscription banner */}
        {isAuthenticated && hasActiveSubscription && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex flex-wrap justify-between items-center">
            <div>
              <p className="text-green-800 font-semibold">✓ You have an active subscription!</p>
              <p className="text-green-700 text-sm">
                Plan: {subscription?.planDetails?.name || subscription?.plan}
              </p>
            </div>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            {isAuthenticated && hasActiveSubscription
              ? 'Upgrade or downgrade your subscription anytime.'
              : 'Start managing your appointments today'}
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No plans available. Please check back later.
            </div>
          ) : (
            plans.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.id;
              return (
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
                      {(plan.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <div className="mt-8 w-full py-3 px-4 rounded-md bg-green-100 text-green-800 font-semibold text-center">
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleChoosePlan(plan.id)}
                        className={`mt-8 w-full py-3 px-4 rounded-md text-white font-semibold ${
                          plan.isMostPopular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'
                        }`}
                      >
                        Choose Plan
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Pricing;