import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, Crown, AlertCircle } from 'lucide-react';

const SubscriptionStatus = () => {
  const { subscription } = useAuth();

  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">No Active Subscription</h2>
        <p className="mt-2 text-gray-600">You don't have an active subscription. Choose a plan to get started.</p>
        <Link
          to="/pricing"
          className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          View Plans
        </Link>
      </div>
    );
  }

  const plan = subscription.planDetails || {};
  const expiryDate = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-IN') : 'N/A';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Subscription Details</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{plan.name || 'N/A'}</h2>
              <p className="text-gray-500">Plan</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
              {subscription.status}
            </span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Expires on</p>
              <p className="font-medium text-gray-900">{expiryDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium text-gray-900">₹{subscription.price || 0} / month</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Features</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {plan.features?.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <Link
            to="/pricing"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;