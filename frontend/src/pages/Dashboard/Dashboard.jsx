import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Calendar, Users, DollarSign, TrendingUp, Plus, Store, Scissors, UserRound, CalendarDays, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [overview, setOverview] = useState(null);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [setupProgress, setSetupProgress] = useState({
    business: false,
    services: false,
    staff: false,
    availability: false,
  });

  // Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await apiClient.get('/business/me');
        const businesses = res.data.data || [];
        if (businesses.length > 0) {
          setBusiness(businesses[0]);
          setBusinessId(businesses[0]._id);

          // Check setup progress
          const servicesRes = await apiClient.get(`/services?businessId=${businesses[0]._id}`);
          const staffRes = await apiClient.get(`/staff?businessId=${businesses[0]._id}`);
          const availRes = await apiClient.get(`/availability?businessId=${businesses[0]._id}`);

          setSetupProgress({
            business: true,
            services: servicesRes.data.data.some(s => s.status === 'active'),
            staff: staffRes.data.data.some(s => s.status === 'active'),
            availability: availRes.data.data.some(a => a.isOpen === true),
          });
        }
      } catch (err) {
        // No business yet - this is fine
      }
    };
    fetchBusinesses();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (!businessId) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const overviewRes = await apiClient.get(`/dashboard/overview?businessId=${businessId}`);
        setOverview(overviewRes.data.data);

        const popularRes = await apiClient.get(`/dashboard/popular-services?businessId=${businessId}&limit=5`);
        setPopularServices(popularRes.data.data || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [businessId]);

  // Show onboarding if no business
  if (!loading && !business) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard!</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Get Started with Your Business</h2>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            You haven't created a business yet. Click the button below to get started.
          </p>
          <Link
            to="/business/new"
            className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Your Business <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const allCompleted = setupProgress.business && setupProgress.services && setupProgress.availability;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">{business?.name}</p>
        </div>
        {allCompleted && business?.slug && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-green-700 font-medium">✓ Booking URL:</span>{' '}
            <a
              href={`/book/${business.slug}`}
              target="_blank"
              rel="noopener"
              className="text-indigo-600 hover:underline font-mono"
            >
              /book/{business.slug}
            </a>
          </div>
        )}
      </div>

      {/* Setup Progress */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Setup Progress</h3>
        <div className="flex flex-wrap gap-3">
          <div className={`px-3 py-1 rounded-full text-sm ${setupProgress.business ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {setupProgress.business ? '✓' : '○'} Business
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${setupProgress.services ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {setupProgress.services ? '✓' : '○'} Services
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${setupProgress.staff ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {setupProgress.staff ? '✓' : '○'} Staff
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${setupProgress.availability ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {setupProgress.availability ? '✓' : '○'} Availability
          </div>
          {allCompleted && (
            <div className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
              🚀 Ready for Bookings!
            </div>
          )}
        </div>
        {!setupProgress.services && (
          <Link to="/services" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            Add Services →
          </Link>
        )}
        {setupProgress.services && !setupProgress.availability && (
          <Link to="/availability" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            Set Availability →
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold">{overview.totalBookings}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{overview.totalCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{overview.totalRevenue || 0}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cancellation Rate</p>
              <p className="text-2xl font-bold">{overview.cancellationRate || 0}%</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700 mb-2">Today's Appointments</h3>
          {overview.todayBookings?.length > 0 ? (
            <ul className="space-y-2">
              {overview.todayBookings.map((b) => (
                <li key={b._id} className="flex justify-between items-center border-b pb-1 text-sm">
                  <span className="font-medium">{b.customerId?.name || 'Guest'}</span>
                  <span className="text-gray-500">{b.startTime}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No appointments today.</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700 mb-2">Upcoming Appointments</h3>
          {overview.upcomingBookings?.length > 0 ? (
            <ul className="space-y-2">
              {overview.upcomingBookings.map((b) => (
                <li key={b._id} className="flex justify-between items-center border-b pb-1 text-sm">
                  <span className="font-medium">{b.customerId?.name || 'Guest'}</span>
                  <span className="text-gray-500">{format(new Date(b.date), 'dd MMM')} {b.startTime}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming appointments.</p>
          )}
        </div>
      </div>

      {/* Popular Services */}
      {popularServices.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700 mb-2">Popular Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {popularServices.map((svc) => (
              <div key={svc.serviceId} className="flex justify-between items-center border-b pb-1">
                <span className="font-medium">{svc.name}</span>
                <span className="text-sm text-gray-500">{svc.count} bookings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;