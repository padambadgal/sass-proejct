import { Link } from 'react-router-dom';
import { Calendar, Users, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, MapPin, Mail, Phone,} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, hasActiveSubscription, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Book<span className="text-gray-900">ify</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {hasActiveSubscription && (
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/book"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                >
                  Book
                </Link>

                <button
                  onClick={logout}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
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
              Book an Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
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

      {/* Footer */}
      <footer className="relative mt-20 border-t border-gray-200/70 bg-gradient-to-b from-white to-gray-50">
        {/* Decorative blur blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14">
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-gray-900">
                  Bookify
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 max-w-sm">
                Effortless booking for modern businesses. Manage your schedule,
                services, and customers — all in one beautiful place.
              </p>

              {/* Socials */}
              <div className="mt-6 flex items-center gap-3">
                {/* {[
                  { href: 'https://twitter.com/BookifyApp', Icon: Twitter },
                  { href: 'https://github.com/BookifyApp', Icon: Github },
                  { href: 'https://linkedin.com/company/Bookify', Icon: Linkedin },
                  { href: 'https://instagram.com/Bookifyapp', Icon: Instagram },
                ].map(({ href, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md"
                  >
                    <Icon size={16} />
                  </a>
                ))} */}
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-900">Product</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {['Features', 'Pricing', 'Integrations', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-900">Company</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-4">
              <h4 className="text-sm font-semibold text-gray-900">Stay in the loop</h4>
              <p className="mt-2 text-sm text-gray-600">
                Get product updates and tips delivered to your inbox. No spam.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-4 flex items-center gap-2 p-1 rounded-xl border border-gray-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition"
              >
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Subscribe
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200/70" />

          {/* Bottom bar */}
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-semibold text-gray-700">Bookify</span>. All rights reserved.
            </div>

            <div className="flex items-center gap-5 text-xs text-gray-500">
              <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition">Terms</a>
              <a href="#" className="hover:text-indigo-600 transition">Cookies</a>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> Mumbai, IN
              </span>
              <span className="inline-flex items-center gap-1">
                <Mail size={12} /> hello@Bookify.app
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;