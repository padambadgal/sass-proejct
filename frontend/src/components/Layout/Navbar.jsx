import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();          // clears state and cookie
    navigate('/');           // redirect to landing page
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50 md:left-64">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <span className="text-xl font-semibold">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;