import { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import apiClient from '../../api/client';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const RescheduleModal = ({ booking, isOpen, onClose, onSuccess }) => {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch slots when date changes
  useEffect(() => {
    if (!booking || !isOpen) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      setSlots([]);
      try {
        const dateStr = date.toISOString().split('T')[0];
        const res = await apiClient.get(
          `/slots/available-times?businessId=${booking.businessId._id}&serviceId=${booking.serviceId._id}&date=${dateStr}`
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
      await apiClient.patch(`/bookings/${booking._id}/reschedule`, {
        date: date.toISOString().split('T')[0],
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reschedule Booking</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Booking: <span className="font-mono">{booking.bookingReference}</span>
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <ReactDatePicker
              selected={date}
              onChange={setDate}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
          {loadingSlots ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No available slots for this date</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 text-sm rounded-md border ${
                    selectedSlot === slot
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedSlot}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;