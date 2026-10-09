import { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import apiClient from '../../api/client';
import { X, Calendar, Clock, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatLocalDate } from '../../utils/date';

const RescheduleModal = ({ booking, isOpen, onClose, onSuccess }) => {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset when modal opens with a new booking
  useEffect(() => {
    if (booking && isOpen) {
      const bookingDate = booking.date ? new Date(booking.date) : new Date();
      setDate(bookingDate);
      setSelectedSlot('');
    }
  }, [booking, isOpen]);

  // Fetch slots when date or booking changes
  useEffect(() => {
    if (!booking || !isOpen) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      setSlots([]);
      try {
        const dateStr = formatLocalDate(date);
        // Extract IDs safely — booking.businessId / booking.serviceId may be
        // populated objects or plain strings
        const businessId =
          typeof booking.businessId === 'object'
            ? booking.businessId._id
            : booking.businessId;
        const serviceId =
          typeof booking.serviceId === 'object'
            ? booking.serviceId._id
            : booking.serviceId;

        const res = await apiClient.get(
          `/slots/available-times?businessId=${businessId}&serviceId=${serviceId}&date=${dateStr}`
        );
        setSlots(res.data.data.availableSlots || []);
      } catch (err) {
        toast.error('Failed to load available slots');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date, booking, isOpen]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setSubmitting(true);
    try {
      // ✅ Use owner-side endpoint (auth required)
      await apiClient.patch(`/bookings/${booking._id}/reschedule`, {
        date: formatLocalDate(date),
        startTime: selectedSlot,
      });
      toast.success('Booking rescheduled successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  // Safe field extraction
  const serviceName =
    typeof booking.serviceId === 'object'
      ? booking.serviceId?.name
      : 'Service';
  const customerName =
    typeof booking.customer === 'object' ? booking.customer?.name : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Reschedule Booking
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Change the date and time for {customerName || 'this booking'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Booking reference */}
        <div className="bg-indigo-50 rounded-xl p-3 mb-5 text-sm flex items-center justify-between">
          <div>
            <div className="text-indigo-700 font-medium">
              {booking.bookingReference}
            </div>
            {serviceName && (
              <div className="text-xs text-indigo-600">{serviceName}</div>
            )}
          </div>
          <span className="text-xs text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-100">
            {booking.startTime} – {booking.endTime}
          </span>
        </div>

        {/* Date picker */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            New Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />
            <ReactDatePicker
              selected={date}
              onChange={setDate}
              minDate={new Date()}
              dateFormat="EEEE, MMMM d, yyyy"
              className="pl-10 w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholderText="Select a date"
            />
          </div>
        </div>

        {/* Time slots */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Time
          </label>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
              <span className="ml-2 text-sm text-gray-500">
                Loading slots...
              </span>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Clock className="mx-auto h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500 mt-1">
                No slots available for this date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 text-sm rounded-xl border transition-all duration-150 ${
                    selectedSlot === slot
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedSlot}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Check size={18} />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;