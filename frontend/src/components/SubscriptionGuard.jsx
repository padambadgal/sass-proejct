// src/components/SubscriptionGuard.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubscriptionGuard = () => {
  const { hasActiveSubscription, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // or a spinner

  if (!hasActiveSubscription) {
    return <Navigate to="/pricing" replace />;
  }

  return <Outlet />;
};

export default SubscriptionGuard;