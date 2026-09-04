import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Calendar, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await apiClient.get('/customers/bookings');
        setBookings(res.data.data);
      } catch (err) {
        toast.error('Failed to load your bookings');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyBookings();
  }, [refreshKey]);

  const handleReschedule = (booking) => {
    // Navigate to the customer reschedule page using the booking reference
    navigate(`/reschedule/${booking.bookingReference}`);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link to="/book" className="text-indigo-600 hover:underline text-sm">
          + Book New
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">You have no bookings yet.</p>
          <Link to="/book" className="mt-4 inline-block text-indigo-600 hover:underline">
            Book an appointment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((b) => {
                  const canReschedule = ['pending', 'confirmed'].includes(b.status);
                  return (
                    <tr key={b._id}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{b.bookingReference}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{b.businessId?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{b.serviceId?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{b.startTime} – {b.endTime}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {canReschedule && (
                          <button
                            onClick={() => handleReschedule(b)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          >
                            <RefreshCw size={16} /> Reschedule
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;