import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Scissors,
  Users,
  Clock,
  CalendarDays,
  UserRound,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

// ============ NAV CONFIG ============
const ownerSections = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Manage',
    items: [
      { to: '/business', label: 'Business', icon: Store },
      { to: '/services', label: 'Services', icon: Scissors },
      { to: '/staff', label: 'Staff', icon: Users },
      { to: '/availability', label: 'Availability', icon: Clock },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        to: '/bookings',
        label: 'Bookings',
        icon: CalendarDays,
        badgeKey: 'bookings',
      },
      { to: '/customers', label: 'Customers', icon: UserRound },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/subscription', label: 'Subscription', icon: CreditCard },
    ],
  },
];

const staffSections = [
  {
    title: 'Workspace',
    items: [
      {
        to: '/bookings',
        label: 'Bookings',
        icon: CalendarDays,
        badgeKey: 'bookings',
      },
      { to: '/customers', label: 'Customers', icon: UserRound },
    ],
  },
];

// ============ SIDEBAR ============
const Sidebar = ({ collapsed, setCollapsed, mobileOpen = false, onClose }) => {
  const { user, logout, isStaff } = useAuth();
  const { unreadCount } = useSocket();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen && onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const sections = isStaff ? staffSections : ownerSections;

  // Badge counts
  const badges = {
    bookings: unreadCount,
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* ===== Brand Header ===== */}
        <div
          className={`flex items-center justify-between h-16 border-b border-gray-100 ${
            collapsed ? 'px-2' : 'px-4'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-base font-bold text-gray-900 truncate">
                  Appoint
                  <span className="text-indigo-600">SaaS</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {isStaff ? 'Staff Portal' : 'Owner Portal'}
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {mobileOpen && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          )}

          {/* Collapse toggle (desktop only) */}
          {!collapsed && !mobileOpen && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {collapsed && !mobileOpen && (
            <button
              onClick={() => setCollapsed(false)}
              className="hidden md:flex p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* ===== Nav Sections ===== */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title}>
              {/* Section title */}
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div className="mx-auto mb-2 w-6 border-t border-gray-200" />
              )}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const badgeCount = item.badgeKey
                    ? badges[item.badgeKey] || 0
                    : 0;

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `group relative flex items-center rounded-xl transition-all duration-200 ${
                            collapsed
                              ? 'justify-center p-3'
                              : 'gap-3 px-3 py-2.5'
                          } ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                              : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={20}
                              strokeWidth={isActive ? 2.5 : 2}
                              className="flex-shrink-0 transition-transform group-hover:scale-110"
                            />
                            {!collapsed && (
                              <span className="text-sm font-medium truncate">
                                {item.label}
                              </span>
                            )}

                            {/* Badge */}
                            {badgeCount > 0 && (
                              <span
                                className={`${
                                  collapsed
                                    ? 'absolute -top-1 -right-1'
                                    : 'ml-auto'
                                } ${
                                  isActive
                                    ? 'bg-white text-indigo-600'
                                    : 'bg-red-500 text-white'
                                } text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center`}
                              >
                                {badgeCount > 9 ? '9+' : badgeCount}
                              </span>
                            )}

                            {/* Active left indicator */}
                            {isActive && !collapsed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/70 rounded-r-full" />
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ===== User Footer ===== */}
        <div
          className={`border-t border-gray-100 p-3 ${
            collapsed ? 'flex justify-center' : ''
          }`}
        >
          {collapsed ? (
            <button
              onClick={logout}
              title="Logout"
              className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-indigo-50/50 border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md shadow-indigo-500/25 flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-gray-500 capitalize truncate">
                    {user?.role || 'member'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;