import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Calendar, Clock, User, Mail, Loader2, CheckCircle, AlertCircle, X, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatLocalDate } from '../../utils/date';

const CustomerReschedule = () => {
  const { reference } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('verify'); // 'verify' | 'booking' | 'success'
  const [booking, setBooking] = useState(null);
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goToMyBookings = () => navigate('/my-bookings');

  // ---------- Verify ----------
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please provide your email');
      return;
    }
    setVerifying(true);
    try {
      const res = await apiClient.get(`/public/bookings/${reference}`, {
        params: { email },
      });
      const data = res.data.data;
      setBooking(data);
      setSelectedDate(new Date(data.date));
      setStep('booking');
      toast.success('Email verified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking not found or verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // ---------- Fetch slots ----------
  useEffect(() => {
    if (!booking || !selectedDate) return;
    const fetchSlots = async () => {
      const dateStr = formatLocalDate(selectedDate);
      try {
        const res = await apiClient.get(
          `/public/business/${booking.businessId.slug}/slots?serviceIds=${booking.serviceId._id}&date=${dateStr}`
        );
        setAvailableSlots(res.data.data.availableSlots || []);
        setSelectedSlot('');
      } catch {
        toast.error('Failed to load slots');
      }
    };
    fetchSlots();
  }, [booking, selectedDate]);

  // ---------- Submit reschedule ----------
  const handleReschedule = async () => {
    if (!selectedSlot || !selectedDate) {
      toast.error('Please select a new date and time');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.patch(`/public/bookings/${reference}/reschedule`, {
        date: formatLocalDate(selectedDate),
        startTime: selectedSlot,
        email,
      });
      toast.success('Booking rescheduled successfully!');
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Success screen ----------
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Booking Rescheduled! ✅</h2>
          <p className="mt-2 text-gray-600">Your appointment has been updated.</p>

          <div className="mt-4 text-sm text-gray-500 space-y-1 text-left bg-gray-50 p-4 rounded-xl">
            <p><span className="font-medium">Business:</span> {booking.businessId.name}</p>
            <p><span className="font-medium">Service:</span> {booking.serviceId.name}</p>
            <p>
              <span className="font-medium">New Date:</span>{' '}
              {selectedDate?.toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p><span className="font-medium">New Time:</span> {selectedSlot}</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToMyBookings}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              My Bookings
            </button>
            <button
              onClick={() => navigate('/book')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Verify step ----------
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900">Reschedule Your Booking</h2>
          <p className="mt-2 text-gray-600">
            Enter the email you used when booking to verify your identity.
          </p>

          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-indigo-600 cursor-pointer text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            {/* Cancel button */}
            <button
              type="button"
              onClick={goToMyBookings}
              className="w-full py-3 border cursor-pointer border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Cancel
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Booking reference: <span className="font-mono">{reference}</span>
          </p>
        </div>
      </div>
    );
  }

  // ---------- Booking detail + reschedule ----------
  if (step === 'booking' && booking) {
    const canReschedule = ['pending', 'confirmed'].includes(booking.status);

    if (!canReschedule) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-yellow-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Cannot Reschedule</h2>
            <p className="mt-2 text-gray-600">
              This booking has status "{booking.status}" and cannot be rescheduled.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={goToMyBookings}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                My Bookings
              </button>
              <button
                onClick={() => navigate('/book')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with back button */}
          <div className="bg-indigo-600 px-6 py-4 text-white flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Reschedule Booking</h1>
              <p className="text-indigo-100 text-sm">{booking.businessId.name}</p>
            </div>
            <button
              type="button"
              onClick={goToMyBookings}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="Back to My Bookings"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Current booking details */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-medium">Reference:</span> {booking.bookingReference}</p>
              <p><span className="font-medium">Service:</span> {booking.serviceId.name} (₹{booking.serviceId.price})</p>
              <p><span className="font-medium">Current Date:</span> {new Date(booking.date).toLocaleDateString('en-IN')}</p>
              <p><span className="font-medium">Current Time:</span> {booking.startTime}</p>
              <p><span className="font-medium">Status:</span> {booking.status}</p>
            </div>

            {/* New date & time */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select New Date & Time</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <ReactDatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    dateFormat="EEEE, MMMM d, yyyy"
                    className="w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Slots</label>
                  {availableSlots.length === 0 ? (
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={goToMyBookings}
                className="sm:w-40 py-3 border cursor-pointer border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={submitting || !selectedSlot || !selectedDate}
                className="flex-1 py-3 cursor-pointer bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomerReschedule;