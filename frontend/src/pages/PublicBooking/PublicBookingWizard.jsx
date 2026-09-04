import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock, User, Mail, Phone, FileText, Check, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PublicBookingWizard = () => {
  const { isAuthenticated, user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  // State
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Fetch business and services
  useEffect(() => {
    const fetchBusinessAndServices = async () => {
      setLoading(true);
      try {
        const bizRes = await apiClient.get(`/public/business/${slug}`);
        setBusiness(bizRes.data.data);

        const svcRes = await apiClient.get(`/public/business/${slug}/services`);
        setServices(svcRes.data.data);
        if (svcRes.data.data.length > 0) {
          setSelectedService(svcRes.data.data[0]);
        }
      } catch {
        toast.error('Business not found');
        navigate('/book');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessAndServices();
  }, [slug, navigate]);

  // Fetch slots
  useEffect(() => {
    if (!selectedService || !selectedDate || !business) return;
    const fetchSlots = async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setAvailableSlots([]);
      setSelectedSlot('');
      try {
        const res = await apiClient.get(
          `/public/business/${business.slug}/slots?serviceId=${selectedService._id}&date=${dateStr}`
        );
        setAvailableSlots(res.data.data.availableSlots || []);
      } catch {
        toast.error('Failed to load available slots');
      }
    };
    fetchSlots();
  }, [selectedService, selectedDate, business]);

  // Submit booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !selectedDate || !selectedService || !business) {
      toast.error('Please complete all selections');
      return;
    }
    if (!customer.name || !customer.email || !customer.phone) {
      toast.error('Please fill in all customer fields');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const payload = {
        serviceId: selectedService._id,
        date: dateStr,
        startTime: selectedSlot,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        notes: customer.notes || '',
      };
      const res = await apiClient.post(`/public/business/${business.slug}/bookings`, payload);
      setBookingResult(res.data.data);
      toast.success('Booking confirmed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
  if (!isAuthenticated) {
    toast('Please login to book an appointment'); // ✅ Correct
    navigate('/login');
  }
}, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setCustomer(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);
  // ===== SUCCESS SCREEN (with Reschedule button) =====
  if (bookingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Booking Confirmed! 🎉</h2>
          <p className="mt-2 text-gray-600">Your appointment has been booked successfully.</p>
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Booking Reference</p>
            <p className="text-lg font-mono font-bold text-indigo-600">{bookingResult.bookingReference}</p>
          </div>
          <div className="mt-4 text-sm text-gray-500 space-y-1 text-left bg-gray-50 p-4 rounded-xl">
            <p><span className="font-medium">Business:</span> {business.name}</p>
            <p><span className="font-medium">Service:</span> {selectedService.name}</p>
            <p><span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
            <p><span className="font-medium">Time:</span> {selectedSlot}</p>
            <p><span className="font-medium">Customer:</span> {customer.name}</p>
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {/* Reschedule button */}
            <button
              onClick={() => navigate(`/reschedule/${bookingResult.bookingReference}`)}
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition font-medium"
            >
              Reschedule Appointment
            </button>

            {/* Book Another button */}
            <button
              onClick={() => navigate('/book')}
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
            >
              Book Another Appointment
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

  const isReady = selectedService && selectedDate && selectedSlot && customer.name && customer.email && customer.phone;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-indigo-100 text-sm">{business.description}</p>
          </div>
          <button
            onClick={() => navigate('/book')}
            className="flex items-center gap-1 text-sm bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition"
          >
            <ArrowLeft size={16} /> Change Business
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column – Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Service</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => (
                  <div
                    key={svc._id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedService?._id === svc._id
                        ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="font-medium text-gray-900">{svc.name}</div>
                    <div className="text-sm text-gray-500">₹{svc.price} · {svc.duration} min</div>
                    {svc.description && <div className="text-xs text-gray-400 mt-1">{svc.description}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <ReactDatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    dateFormat="EEEE, MMMM d, yyyy"
                    placeholderText="Choose a date"
                    className="w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slots</label>
                  {!selectedDate ? (
                    <p className="text-sm text-gray-400 italic">Select a date first</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-yellow-600">No slots available for this date</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 text-sm rounded-xl border transition-all ${selectedSlot === slot
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        required
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        required
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                    <textarea
                      value={customer.notes}
                      onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      rows="2"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Any special requests..."
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column – Booking Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-lg mb-4">Booking Summary</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Business</span>
                    <span className="font-medium text-gray-900">{business.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium text-gray-900">{selectedService?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium text-gray-900">{selectedService?.duration || '—'} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">
                      {selectedDate ? selectedDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium text-gray-900">{selectedSlot || '—'}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">₹{selectedService?.price || 0}</span>
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
                    Please select a service, date, time, and fill in your details.
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