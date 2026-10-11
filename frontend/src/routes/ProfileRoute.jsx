import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Profile from '../pages/Profile/Profile';
import { Loader2 } from 'lucide-react';

/**
 * Role-aware profile route.
 * - Owner / Staff → rendered inside the Layout (sidebar + navbar)
 * - Customer → rendered standalone (full-width)
 */
const ProfileRoute = () => {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  // Owners + staff get the sidebar layout
  if (user.role === 'owner') {
    return (
      <Layout>
        <Profile />
      </Layout>
    );
  }

  // Customers: standalone full page
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <Profile showBack />
    </div>
  );
};

export default ProfileRoute;