import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Scissors,
  Users,
  CalendarDays,
  UserRound,
  CreditCard,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business', label: 'Business', icon: Store },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/customers', label: 'Customers', icon: UserRound },
  { to: '/subscription', label: 'Subscription', icon: CreditCard },
];

const Sidebar = () => {
  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-14 bg-white border-r border-gray-200 transition-transform -translate-x-full md:translate-x-0">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group ${
                      isActive ? 'bg-indigo-50 text-indigo-600' : ''
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;