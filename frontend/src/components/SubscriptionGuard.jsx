import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubscriptionGuard = ({ children }) => {
  const { subscription, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading subscription...</div>
      </div>
    );
  }

  // If no active subscription, redirect to pricing page
  if (!subscription || subscription.status !== 'active') {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

export default SubscriptionGuard;