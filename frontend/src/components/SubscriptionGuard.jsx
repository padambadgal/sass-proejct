import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubscriptionGuard = () => {
  const { hasActiveSubscription, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!hasActiveSubscription) {
    return <Navigate to="/pricing" replace />;
  }

  return <Outlet />;
};

export default SubscriptionGuard;