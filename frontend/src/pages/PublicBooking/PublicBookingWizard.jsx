import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = ['Service', 'Date & Time', 'Your Details'];

const BookingWizard = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

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
  const [currentStep, setCurrentStep] = useState(0);

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
      toast.error('Please complete all steps');
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

  // Navigation
  const nextStep = () => {
    if (currentStep === 0 && !selectedService) {
      toast.error('Please select a service');
      return;
    }
    if (currentStep === 1 && !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    if (currentStep === 0) {
      navigate('/book');
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Success screen
  if (bookingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Check className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="mt-2 text-gray-600">Your appointment has been booked successfully.</p>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Booking Reference</p>
            <p className="text-lg font-mono font-bold text-indigo-600">{bookingResult.bookingReference}</p>
          </div>
          <div className="mt-4 text-sm text-gray-500 space-y-1 text-left">
            <p><span className="font-medium">Business:</span> {business.name}</p>
            <p><span className="font-medium">Service:</span> {selectedService.name}</p>
            <p><span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
            <p><span className="font-medium">Time:</span> {selectedSlot}</p>
            <p><span className="font-medium">Customer:</span> {customer.name}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Book Another Appointment
          </button>
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

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Service
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{business.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Select a service</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((svc) => (
                <div
                  key={svc._id}
                  onClick={() => setSelectedService(svc)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedService?._id === svc._id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{svc.name}</div>
                  <div className="text-sm text-gray-500">₹{svc.price} · {svc.duration} min</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 1: // Date & Time
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <ReactDatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                dateFormat="EEEE, MMMM d, yyyy"
                placeholderText="Choose a date"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slots</label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-500">No slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 text-sm rounded-md border ${
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
            )}
          </div>
        );
      case 2: // Customer Details
        return (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  rows="2"
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Any special requests..."
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Book an Appointment</h1>
            <p className="text-sm text-indigo-100">{business.name}</p>
          </div>
          <button
            onClick={() => navigate('/book')}
            className="text-sm bg-white/20 px-3 py-1 rounded-md hover:bg-white/30 transition"
          >
            Change Business
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 flex justify-center gap-2">
          {steps.map((label, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1 text-sm font-medium ${
                idx <= currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
              {idx < steps.length - 1 && (
                <ChevronRight size={16} className={`${idx < currentStep ? 'text-indigo-300' : 'text-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">{renderStep()}</div>

        {/* Navigation (only for steps 0 and 1) */}
        {currentStep < 2 && (
          <div className="px-6 pb-6 flex justify-between">
            <button
              onClick={prevStep}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft size={16} className="inline mr-1" /> Back
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-1"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;