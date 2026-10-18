import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import {
  Store,
  Search,
  ChevronRight,
  Phone,
  MapPin,
  Loader2,
  Calendar,
  UserCircle,
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasActiveSubscription, user, logout } = useAuth();

  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/public/businesses');
        setBusinesses(res.data.data);
        setFilteredBusinesses(res.data.data);
      } catch {
        toast.error('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Search/filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBusinesses(businesses);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = businesses.filter((biz) => {
      const name = biz.name?.toLowerCase() || '';
      const desc = biz.description?.toLowerCase() || '';
      const phone = biz.phone || '';
      const city = biz.address?.city?.toLowerCase() || '';
      const state = biz.address?.state?.toLowerCase() || '';
      const country = biz.address?.country?.toLowerCase() || '';
      return (
        name.includes(term) ||
        desc.includes(term) ||
        phone.includes(term) ||
        city.includes(term) ||
        state.includes(term) ||
        country.includes(term)
      );
    });
    setFilteredBusinesses(filtered);
  }, [searchTerm, businesses]);

  const requireLogin = () => {
    toast.error('Please login first to book an appointment.');
    navigate('/login', { state: { from: location.pathname } });
  };

  const handleSelect = (business) => {
    if (!isAuthenticated) return requireLogin();
    setSelectedBusiness(business);
  };

  const handleNext = () => {
    if (!isAuthenticated) return requireLogin();
    if (!selectedBusiness) {
      toast.error('Please select a business');
      return;
    }
    navigate(`/book/${selectedBusiness.slug}`);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50">
      {/* ============ TOP BAR ============ */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Appoint<span className="text-gray-900">SaaS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && hasActiveSubscription && (
              <Link
                to="/dashboard"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated ? (
              <>
                {user?.role !== 'owner' && (
                  <Link
                    to="/my-bookings"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition flex items-center gap-1"
                  >
                    <Calendar size={16} /> My Bookings
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  <UserCircle size={18} />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  state={{ from: location.pathname }}
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ============ MOBILE DRAWER ============ */}
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl md:hidden transform transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-lg font-bold text-indigo-600">
            Appoint<span className="text-gray-900">SaaS</span>
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info (if logged in) */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="px-3 py-4 space-y-1">
          {isAuthenticated && hasActiveSubscription && (
            <MobileItem
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() => setMenuOpen(false)}
              highlight
            />
          )}

          {isAuthenticated ? (
            <>
              {user?.role !== 'owner' && (
                <MobileItem
                  to="/my-bookings"
                  icon={<Calendar size={18} />}
                  label="My Bookings"
                  onClick={() => setMenuOpen(false)}
                />
              )}
              <MobileItem
                to="/profile"
                icon={<UserCircle size={18} />}
                label="My Profile"
                onClick={() => setMenuOpen(false)}
              />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <MobileItem
                to="/login"
                icon={<LogIn size={18} />}
                label="Log in"
                onClick={() => setMenuOpen(false)}
                state={{ from: location.pathname }}
              />
              <MobileItem
                to="/register"
                icon={<UserPlus size={18} />}
                label="Sign up"
                onClick={() => setMenuOpen(false)}
                state={{ from: location.pathname }}
                highlight
              />
            </>
          )}
        </nav>

        {/* Footer hint */}
        <div className="absolute bottom-4 left-0 right-0 px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Bookify
        </div>
      </aside>

      {/* ============ HERO ============ */}
      <div className="bg-indigo-600 text-white py-10 sm:py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Find a Business
          </h1>
          <p className="mt-3 text-base sm:text-lg text-indigo-100 max-w-2xl mx-auto">
            Browse our trusted partners and book your appointment in seconds.
          </p>
          <div className="mt-6 max-w-lg mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, service, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* ============ RESULTS ============ */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Store className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No businesses found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredBusinesses.map((biz) => (
                <div
                  key={biz._id}
                  onClick={() => handleSelect(biz)}
                  className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedBusiness?._id === biz._id
                      ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg'
                      : 'hover:-translate-y-1'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl sm:text-2xl font-bold overflow-hidden">
                      {biz.logo ? (
                        <img
                          src={biz.logo}
                          alt={biz.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        biz.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {biz.name}
                      </h3>
                      {biz.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                          {biz.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                        {biz.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={13} /> {biz.phone}
                          </span>
                        )}
                        {biz.address?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} /> {biz.address.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedBusiness?._id === biz._id && (
                      <div className="flex-shrink-0">
                        <div className="bg-indigo-600 text-white rounded-full p-1">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedBusiness && (
              <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col sm:flex-row flex-wrap items-center sm:justify-between gap-4 border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden flex-shrink-0">
                    {selectedBusiness.logo ? (
                      <img
                        src={selectedBusiness.logo}
                        alt={selectedBusiness.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedBusiness.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {selectedBusiness.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {selectedBusiness.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Continue <ChevronRight size={18} className="ml-2" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ===== Mobile drawer nav item =====
const MobileItem = ({ to, icon, label, onClick, highlight, state }) => (
  <Link
    to={to}
    state={state}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
      highlight
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:opacity-90'
        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
    }`}
  >
    {icon}
    {label}
  </Link>
);

export default BusinessListPage;