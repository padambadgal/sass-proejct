import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { ArrowLeft, Calendar, Clock, DollarSign, User, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import RescheduleModal from '../Bookings/RescheduleModal';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      try {
        const res = await apiClient.get(`/customers/${id}`);
        setCustomer(res.data.data.customer);
        setBookings(res.data.data.bookings || []);
      } catch (err) {
        toast.error('Failed to load customer details');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetail();
  }, [id, navigate, refreshKey]);

  const handleRescheduleSuccess = () => {
    setRescheduleBooking(null);
    setRefreshKey(prev => prev + 1);
    toast.success('Booking rescheduled successfully');
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!customer) return <div className="text-center py-8">Customer not found</div>;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  // Only pending/confirmed can be rescheduled
  const canReschedule = (status) => ['pending', 'confirmed'].includes(status);

  return (
    <div>
      <button
        onClick={() => navigate('/customers')}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} /> Back to Customers
      </button>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="mt-2 space-y-1 text-gray-600">
              <p><span className="font-medium">Email:</span> {customer.email || '—'}</p>
              <p><span className="font-medium">Phone:</span> {customer.phone}</p>
              {customer.notes && <p><span className="font-medium">Notes:</span> {customer.notes}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/customers/${customer._id}/edit`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit
            </Link>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex gap-6 text-sm">
          <span className="text-gray-500">Total Bookings: <strong className="text-gray-900">{customer.totalBookings || 0}</strong></span>
          <span className="text-gray-500">Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>{customer.status}</span></span>
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Booking History</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{b.bookingReference}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{b.serviceId?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(b.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.startTime} – {b.endTime}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className={`capitalize ${b.paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {canReschedule(b.status) && (
                        <button
                          onClick={() => setRescheduleBooking(b)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          title="Reschedule"
                        >
                          <RefreshCw size={16} /> Reschedule
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        booking={rescheduleBooking}
        isOpen={!!rescheduleBooking}
        onClose={() => setRescheduleBooking(null)}
        onSuccess={handleRescheduleSuccess}
      />
    </div>
  );
};

export default CustomerDetail;