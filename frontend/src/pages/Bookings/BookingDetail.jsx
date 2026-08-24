import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { ArrowLeft, Calendar, Clock, DollarSign, User, Mail, Phone, FileText, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiClient.get(`/bookings/${id}`);
        setBooking(res.data.data);
      } catch (err) {
        toast.error('Failed to load booking details');
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!booking) return <div className="text-center py-8">Booking not found</div>;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  const paymentColors = {
    paid: 'text-green-600',
    unpaid: 'text-gray-500',
    refunded: 'text-orange-600',
    failed: 'text-red-600',
  };

  return (
    <div>
      <button
        onClick={() => navigate('/bookings')}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} /> Back to Bookings
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-sm text-gray-500 font-mono">{booking.bookingReference}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Service Info */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Service Details</h3>
            <p><span className="text-gray-500">Name:</span> {booking.serviceId?.name || '—'}</p>
            <p><span className="text-gray-500">Price:</span> ₹{booking.serviceId?.price || 0}</p>
            <p><span className="text-gray-500">Duration:</span> {booking.serviceId?.duration || '—'} min</p>
          </div>

          {/* Customer Info */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Customer</h3>
            <p><User size={14} className="inline mr-1 text-gray-400" /> {booking.customer?.name || '—'}</p>
            <p><Mail size={14} className="inline mr-1 text-gray-400" /> {booking.customer?.email || '—'}</p>
            <p><Phone size={14} className="inline mr-1 text-gray-400" /> {booking.customer?.phone || '—'}</p>
          </div>

          {/* Date & Time */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Schedule</h3>
            <p><Calendar size={14} className="inline mr-1 text-gray-400" /> {new Date(booking.date).toLocaleDateString('en-IN')}</p>
            <p><Clock size={14} className="inline mr-1 text-gray-400" /> {booking.startTime} – {booking.endTime}</p>
          </div>

          {/* Payment */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Payment</h3>
            <p><CreditCard size={14} className="inline mr-1 text-gray-400" /> Status: <span className={`capitalize font-medium ${paymentColors[booking.paymentStatus] || ''}`}>{booking.paymentStatus}</span></p>
            {booking.paymentId && <p className="text-sm text-gray-500">Ref: {booking.paymentId}</p>}
          </div>
        </div>

        {booking.notes && (
          <div className="mt-4 border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2"><FileText size={14} className="inline mr-1" /> Notes</h3>
            <p className="text-gray-600">{booking.notes}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex gap-3">
          {/* Status update buttons (same as list) */}
          {/* You can add them here or keep them in list only; we'll keep as is */}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;