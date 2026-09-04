import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Store, Scissors, Users, CalendarDays, UserRound, CreditCard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/business', label: 'Business', icon: Store },
    { to: '/services', label: 'Services', icon: Scissors },
    { to: '/staff', label: 'Staff', icon: Users },
    { to: '/availability', label: 'Availability', icon: CalendarDays },
    { to: '/bookings', label: 'Bookings', icon: CalendarDays },
    { to: '/customers', label: 'Customers', icon: UserRound },
    { to: '/subscription', label: 'Subscription', icon: CreditCard },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50 md:left-64">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-xl font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
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

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-14 bg-white border-r border-gray-200 transition-transform -translate-x-full md:translate-x-0">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group ${
                        isActive ? 'bg-indigo-50 text-indigo-600' : ''
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Navbar;