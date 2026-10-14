import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';

const Navbar = ({ sidebarCollapsed, mobileSidebarOpen, onMenuClick }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-40 bg-white border-b border-gray-200 px-4 py-2.5 transition-[left] duration-300 ${
        sidebarCollapsed ? 'md:left-20' : 'md:left-64'
      }`}
    >
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600 md:hidden"
            aria-label={mobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileSidebarOpen}
            aria-controls="app-sidebar"
          >
            <Menu size={22} />
          </button>
          <span className="text-xl font-semibold">Dashboard</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
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