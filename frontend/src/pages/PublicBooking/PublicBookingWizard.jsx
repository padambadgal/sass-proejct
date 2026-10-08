import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  User,
  Mail,
  Phone,
  FileText,
  Check,
  Loader2,
  ArrowLeft,
  X,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PublicBookingWizard = () => {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Fetch business + services
  useEffect(() => {
    const fetchBusinessAndServices = async () => {
      setLoading(true);
      try {
        const bizRes = await apiClient.get(`/public/business/${slug}`);
        setBusiness(bizRes.data.data);

        const svcRes = await apiClient.get(`/public/business/${slug}/services`);
        setServices(svcRes.data.data);
      } catch {
        toast.error('Business not found');
        navigate('/book');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessAndServices();
  }, [slug, navigate]);

  // Pre-fill user info
  useEffect(() => {
    if (user) {
      setCustomer((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.duration,
    0
  );
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const toggleService = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s._id === service._id);
      if (exists) return prev.filter((s) => s._id !== service._id);
      return [...prev, service];
    });
    setSelectedSlot('');
  };

  // Fetch slots
  useEffect(() => {
    if (!selectedServices.length || !selectedDate || !business) return;
    const fetchSlots = async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setAvailableSlots([]);
      setSelectedSlot('');
      try {
        const serviceIds = selectedServices.map((s) => s._id).join(',');
        const res = await apiClient.get(
          `/public/business/${business.slug}/slots?serviceIds=${serviceIds}&duration=${totalDuration}&date=${dateStr}`
        );
        setAvailableSlots(res.data.data.availableSlots || []);
      } catch {
        toast.error('Failed to load available slots');
      }
    };
    fetchSlots();
  }, [selectedServices, selectedDate, business, totalDuration]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedServices.length) return toast.error('Select at least one service');
    if (!selectedSlot || !selectedDate)
      return toast.error('Select a date and time');
    if (!customer.name || !customer.email || !customer.phone)
      return toast.error('Please fill in all customer fields');

    setSubmitting(true);
    try {
      const payload = {
        serviceIds: selectedServices.map((s) => s._id),
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        notes: customer.notes || '',
      };
      const res = await apiClient.post(
        `/public/business/${business.slug}/bookings`,
        payload
      );
      setBookingResult(res.data.data);
      toast.success('Booking confirmed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (bookingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Booking Confirmed! 🎉
          </h2>
          <p className="mt-2 text-gray-600">
            Your appointment has been booked successfully.
          </p>
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
            <p className="text-sm text-gray-500">Booking Reference</p>
            <p className="text-lg font-mono font-bold text-indigo-600">
              {bookingResult.bookingReference}
            </p>
          </div>
          <div className="mt-4 text-sm text-gray-600 space-y-1 text-left bg-gray-50 p-4 rounded-xl">
            <p>
              <span className="font-medium">Business:</span> {business.name}
            </p>
            <p>
              <span className="font-medium">Services:</span>{' '}
              {selectedServices.map((s) => s.name).join(', ')}
            </p>
            <p>
              <span className="font-medium">Total Duration:</span>{' '}
              {totalDuration} min
            </p>
            <p>
              <span className="font-medium">Date:</span>{' '}
              {selectedDate?.toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p>
              <span className="font-medium">Time:</span> {selectedSlot}
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() =>
                navigate(`/reschedule/${bookingResult.bookingReference}`)
              }
              className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition font-medium"
            >
              Reschedule
            </button>
            <button
              onClick={() => navigate('/book')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  const isReady =
    selectedServices.length > 0 &&
    selectedDate &&
    selectedSlot &&
    customer.name &&
    customer.email &&
    customer.phone;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-14 h-14 rounded-xl object-cover bg-white"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{business.name}</h1>
              {business.description && (
                <p className="text-indigo-100 text-sm">
                  {business.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/book')}
            className="flex items-center gap-1 text-sm bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Choose Services
                </h2>
                {selectedServices.length > 0 && (
                  <button
                    onClick={() => setSelectedServices([])}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <X size={16} /> Clear All
                  </button>
                )}
              </div>

              {services.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No services available yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((svc) => {
                    const isSelected = selectedServices.some(
                      (s) => s._id === svc._id
                    );
                    return (
                      <button
                        key={svc._id}
                        type="button"
                        onClick={() => toggleService(svc)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">
                              {svc.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                              ₹{svc.price} · {svc.duration} min
                            </div>
                            {svc.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {svc.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full p-1">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-sm">
                  <span className="font-medium text-indigo-900">Selected:</span>{' '}
                  <span className="text-indigo-700">
                    {selectedServices.map((s) => s.name).join(', ')}
                  </span>
                  <span className="ml-4 text-gray-600">
                    ₹{totalPrice} · {totalDuration} min
                  </span>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Date & Time
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <ReactDatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    dateFormat="EEEE, MMM d, yyyy"
                    placeholderText="Choose a date"
                    className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Slots
                  </label>
                  {!selectedDate ? (
                    <p className="text-sm text-gray-400 italic">
                      Select a date first
                    </p>
                  ) : selectedServices.length === 0 ? (
                    <p className="text-sm text-yellow-600">
                      Select at least one service first
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-yellow-600">
                      No slots available for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 text-sm rounded-xl border transition-all ${
                            selectedSlot === slot
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                              : 'border-gray-300 hover:border-indigo-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Details
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer({ ...customer, name: e.target.value })
                        }
                        required
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer({ ...customer, email: e.target.value })
                        }
                        required
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      required
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                    <textarea
                      value={customer.notes}
                      onChange={(e) =>
                        setCustomer({ ...customer, notes: e.target.value })
                      }
                      rows={2}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Any special requests..."
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <ShoppingBag size={18} /> Booking Summary
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Business</span>
                    <span className="font-medium text-gray-900 text-right">
                      {business.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Services</span>
                    <ul className="mt-1 space-y-1">
                      {selectedServices.length === 0 ? (
                        <li className="text-gray-400 italic">
                          None selected
                        </li>
                      ) : (
                        selectedServices.map((s) => (
                          <li
                            key={s._id}
                            className="flex justify-between text-gray-700"
                          >
                            <span>{s.name}</span>
                            <span>₹{s.price}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-gray-900">Total Duration</span>
                    <span className="text-gray-900">{totalDuration} min</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">
                      {selectedDate
                        ? selectedDate.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium text-gray-900">
                      {selectedSlot || '—'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isReady || submitting}
                  className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
                {!isReady && (
                  <p className="mt-3 text-xs text-gray-400 text-center">
                    {selectedServices.length === 0
                      ? 'Select at least one service'
                      : !selectedDate
                      ? 'Pick a date'
                      : !selectedSlot
                      ? 'Choose a time slot'
                      : 'Fill in your details'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingWizard;