import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../api/client';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Store,
  ArrowRight,
  Wifi,
  WifiOff,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Fallback overview used when no business exists yet — everything is zero.
const EMPTY_OVERVIEW = {
  totalBookings: 0,
  totalCustomers: 0,
  totalRevenue: 0,
  cancellationRate: 0,
  todayBookings: [],
  upcomingBookings: [],
};

const Dashboard = () => {
  const { user } = useAuth();
  const { connected, notifications } = useSocket();

  const [business, setBusiness] = useState(null);
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [setupProgress, setSetupProgress] = useState({
    business: false,
    services: false,
    staff: false,
    availability: false,
  });

  // Load businesses + setup progress
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await apiClient.get('/business/me');
        const businesses = res.data.data || [];
        if (businesses.length > 0) {
          setBusiness(businesses[0]);
          setBusinessId(businesses[0]._id);

          const [servicesRes, staffRes, availRes] = await Promise.all([
            apiClient.get(`/services?businessId=${businesses[0]._id}`),
            apiClient.get(`/staff?businessId=${businesses[0]._id}`),
            apiClient.get(`/availability?businessId=${businesses[0]._id}`),
          ]);

          setSetupProgress({
            business: true,
            services: (servicesRes.data.data || []).some(
              (s) => s.status === 'active'
            ),
            staff: (staffRes.data.data || []).some(
              (s) => s.status === 'active'
            ),
            availability: (availRes.data.data || []).some(
              (a) => a.isOpen === true
            ),
          });
        } else {
          // No business yet — keep everything at zero and stop the loader.
          setOverview(EMPTY_OVERVIEW);
          setPopularServices([]);
          setLoading(false);
        }
      } catch {
        toast.error('Failed to load business data');
        setLoading(false);
      } finally {
        setBusinessesLoaded(true);
      }
    };
    fetchBusinesses();
  }, []);

  // Load dashboard metrics (only if a business exists)
  useEffect(() => {
    if (!businessId) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [overviewRes, popularRes] = await Promise.all([
          apiClient.get(`/dashboard/overview?businessId=${businessId}`),
          apiClient.get(
            `/dashboard/popular-services?businessId=${businessId}&limit=5`
          ),
        ]);
        setOverview(overviewRes.data.data || EMPTY_OVERVIEW);
        setPopularServices(popularRes.data.data || []);
      } catch {
        toast.error('Failed to load dashboard data');
        setOverview(EMPTY_OVERVIEW);
        setPopularServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [businessId]);

  // Only block on the very first businesses fetch so the page can
  // decide whether a business exists. After that, render the dashboard.
  if (!businessesLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const hasBusiness = Boolean(business);
  const allCompleted =
    setupProgress.business &&
    setupProgress.services &&
    setupProgress.availability;

  // Safe fallback so downstream code never reads undefined.
  const safeOverview = overview || EMPTY_OVERVIEW;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {hasBusiness ? 'Dashboard' : `Welcome, ${user?.name || 'there'}!`}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {hasBusiness ? business?.name : 'No business yet'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              connected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {connected ? (
              <>
                <Wifi size={14} />
                Live
              </>
            ) : (
              <>
                <WifiOff size={14} />
                Offline
              </>
            )}
          </div>
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              {notifications.filter((n) => !n.read).length} new
            </span>
          )}
        </div>
      </div>

      {/* Get-started banner (shown only when there's no business yet) */}
      {!hasBusiness && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Store className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Create your business to start accepting bookings
              </p>
              <p className="text-sm text-gray-600">
                Your dashboard is ready — it will fill up as soon as your business
                is live.
              </p>
            </div>
          </div>
          <Link
            to="/business/new"
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            <Plus size={18} className="mr-2" />
            Create Business
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      )}

      {/* Booking URL */}
      {allCompleted && business?.slug && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-green-700 font-medium">
              ✓ Your public booking URL:
            </span>
            <a
              href={`/book/${business.slug}`}
              target="_blank"
              rel="noopener"
              className="text-indigo-600 hover:underline font-mono font-medium"
            >
              /book/{business.slug}
            </a>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/book/${business.slug}`
              );
              toast.success('Booking URL copied!');
            }}
            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition"
          >
            Copy
          </button>
        </div>
      )}

      {/* Setup Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Setup Progress</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'business', label: 'Business' },
            { key: 'services', label: 'Services' },
            { key: 'staff', label: 'Staff' },
            { key: 'availability', label: 'Availability' },
          ].map(({ key, label }) => (
            <div
              key={key}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                setupProgress[key]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {setupProgress[key] ? '✓' : '○'} {label}
            </div>
          ))}
          {allCompleted && (
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              🚀 Ready for Bookings!
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {!setupProgress.business && (
            <Link
              to="/business/new"
              className="text-indigo-600 hover:underline font-medium"
            >
              + Create Business
            </Link>
          )}
          {setupProgress.business && !setupProgress.services && (
            <Link
              to="/services"
              className="text-indigo-600 hover:underline font-medium"
            >
              + Add Services
            </Link>
          )}
          {setupProgress.services && !setupProgress.availability && (
            <Link
              to="/availability"
              className="text-indigo-600 hover:underline font-medium"
            >
              + Set Availability
            </Link>
          )}
          {setupProgress.business && !setupProgress.staff && (
            <Link
              to="/staff"
              className="text-indigo-600 hover:underline font-medium"
            >
              + Add Staff
            </Link>
          )}
        </div>
      </div>

      {/* Stats — always visible, zeros when no business */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={safeOverview.totalBookings ?? 0}
          icon={<Calendar className="h-5 w-5 text-indigo-600" />}
          bg="bg-indigo-100"
        />
        <StatCard
          label="Total Customers"
          value={safeOverview.totalCustomers ?? 0}
          icon={<Users className="h-5 w-5 text-green-600" />}
          bg="bg-green-100"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${safeOverview.totalRevenue ?? 0}`}
          icon={<DollarSign className="h-5 w-5 text-yellow-600" />}
          bg="bg-yellow-100"
        />
        <StatCard
          label="Cancellation Rate"
          value={`${safeOverview.cancellationRate ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-red-600" />}
          bg="bg-red-100"
        />
      </div>

      {/* Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppointmentList
          title="Today's Appointments"
          bookings={safeOverview.todayBookings}
          emptyText={
            hasBusiness ? 'No appointments today.' : 'Create a business to see bookings.'
          }
          showDate={false}
        />
        <AppointmentList
          title="Upcoming Appointments"
          bookings={safeOverview.upcomingBookings}
          emptyText={
            hasBusiness
              ? 'No upcoming appointments.'
              : 'Create a business to see upcoming bookings.'
          }
          showDate
        />
      </div>

      {/* Popular Services */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Popular Services</h3>
        {popularServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {popularServices.map((svc) => (
              <div
                key={svc.serviceId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
              >
                <span className="font-medium text-gray-800 text-sm">
                  {svc.name}
                </span>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {svc.count} bookings
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">
            {hasBusiness
              ? 'No popular services yet.'
              : 'Create a business and add services to see stats here.'}
          </p>
        )}
      </div>
    </div>
  );
};

// ---- Small sub-components ----
const StatCard = ({ label, value, icon, bg }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">
          {value}
        </p>
      </div>
      <div className={`${bg} p-2.5 rounded-full flex-shrink-0`}>{icon}</div>
    </div>
  </div>
);

const AppointmentList = ({ title, bookings, emptyText, showDate }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
    {bookings?.length > 0 ? (
      <ul className="space-y-2">
        {bookings.slice(0, 6).map((b) => (
          <li
            key={b._id}
            className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0">
                {(b.customerId?.name || b.customer?.name || 'G')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className="font-medium text-gray-800 truncate">
                {b.customerId?.name || b.customer?.name || 'Guest'}
              </span>
            </div>
            <span className="text-gray-500 text-xs whitespace-nowrap">
              {showDate && b.date && `${format(new Date(b.date), 'dd MMM')} · `}
              {b.startTime}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-400 text-sm text-center py-6">{emptyText}</p>
    )}
  </div>
);

export default Dashboard;