import { Link } from 'react-router-dom';
import { Calendar, Users, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Landing = () => {
  const { isAuthenticated, hasActiveSubscription } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar with Login/Register */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Appoint<span className="text-gray-900">SaaS</span>
          </Link>
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Appointment Booking Made{' '}
            <span className="text-indigo-600">Simple</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            The all‑in‑one platform for salons, clinics, gyms, and service providers
            to manage bookings, staff, and payments.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {isAuthenticated && hasActiveSubscription ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                to="/pricing"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                Get Started <ArrowRight size={18} />
              </Link>
            )}
            <Link
              to="/book"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              View Public Booking
            </Link>
          </div>

          {/* Extra login/register callouts (optional) */}
          {!isAuthenticated && (
            <p className="mt-6 text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                Log in
              </Link>
              {' · '}
              <Link to="/register" className="text-indigo-600 hover:underline font-medium">
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Online Bookings</h3>
            <p className="text-gray-500">Customers can book 24/7 via your unique booking URL.</p>
          </div>
          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Staff & Services</h3>
            <p className="text-gray-500">Manage your team and services with ease.</p>
          </div>
          <div className="text-center p-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Secure Payments</h3>
            <p className="text-gray-500">Accept deposits or full payments online.</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">1</div>
              <h4 className="mt-4 font-semibold">Subscribe to a Plan</h4>
              <p className="text-sm text-gray-500">Choose a plan that fits your business.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">2</div>
              <h4 className="mt-4 font-semibold">Set Up Your Business</h4>
              <p className="text-sm text-gray-500">Add services, staff, and availability.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">3</div>
              <h4 className="mt-4 font-semibold">Start Accepting Bookings</h4>
              <p className="text-sm text-gray-500">Share your booking URL with customers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
        <p className="mt-2 text-gray-600">Start with a free trial, then choose a plan that grows with you.</p>
        <Link
          to="/pricing"
          className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          View Plans <ArrowRight size={18} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default Landing;