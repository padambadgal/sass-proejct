import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Calendar as CalIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import RescheduleModal from './RescheduleModal';

const BookingList = () => {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(new Date());
    const [rescheduleBooking, setRescheduleBooking] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // NEW: trigger re-fetch

    // Fetch businesses
    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await apiClient.get('/business/me');
                setBusinesses(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedBusinessId(res.data.data[0]._id);
                }
            } catch (err) {
                toast.error('Failed to load businesses');
            }
        };
        fetchBusinesses();
    }, []);

    // Fetch bookings – now depends on refreshKey
    useEffect(() => {
        if (!selectedBusinessId) return;
        const fetchBookings = async () => {
            setLoading(true);
            try {
                const dateStr = dateFilter.toISOString().split('T')[0];
                let url = `/bookings?businessId=${selectedBusinessId}`;
                if (statusFilter !== 'all') url += `&status=${statusFilter}`;
                url += `&date=${dateStr}`;
                const res = await apiClient.get(url);
                setBookings(res.data.data || []);
            } catch (err) {
                toast.error('Failed to load bookings');
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [selectedBusinessId, statusFilter, dateFilter, refreshKey]); // refreshKey added

    const handleStatusChange = async (bookingId, newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) return;
        try {
            await apiClient.patch(`/bookings/${bookingId}/status`, { status: newStatus });
            toast.success(`Booking ${newStatus}`);
            // Optimistic update
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Status update failed');
        }
    };

    const handleBusinessChange = (e) => {
        setSelectedBusinessId(e.target.value);
    };

    // Reschedule handlers
    const handleRescheduleSuccess = () => {
        setRescheduleBooking(null);
        setRefreshKey(prev => prev + 1); // trigger re-fetch
        toast.success('Booking rescheduled successfully');
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        no_show: 'bg-gray-100 text-gray-800',
    };

    const statusActions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled', 'no_show'],
        completed: [],
        cancelled: [],
        no_show: [],
    };

    if (businesses.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No business found</h3>
                <p className="mt-1 text-sm text-gray-500">Create a business first to manage bookings.</p>
                <Link to="/business/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
                    Add Business
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">Bookings</h1>
                <div className="flex items-center gap-4 flex-wrap">
                    <div>
                        <label htmlFor="business" className="sr-only">Select business</label>
                        <select
                            id="business"
                            value={selectedBusinessId}
                            onChange={handleBusinessChange}
                            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {businesses.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No‑Show</option>
                        </select>
                    </div>
                    <div>
                        <ReactDatePicker
                            selected={dateFilter}
                            onChange={setDateFilter}
                            dateFormat="yyyy-MM-dd"
                            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <CalIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No bookings for this date and status.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-x-auto rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((b) => (
                                <tr key={b._id}>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{b.bookingReference}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{b.customer?.name || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{b.serviceId?.name || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(b.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{b.startTime} – {b.endTime}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium space-x-2 whitespace-nowrap">
                                        <Link to={`/bookings/${b._id}`} className="text-blue-600 hover:text-blue-900" title="View">
                                            <Eye size={18} className="inline" />
                                        </Link>
                                        {statusActions[b.status]?.includes('confirmed') && (
                                            <button onClick={() => handleStatusChange(b._id, 'confirmed')} className="text-blue-600 hover:text-blue-900" title="Confirm">
                                                <CheckCircle size={18} className="inline" />
                                            </button>
                                        )}
                                        {statusActions[b.status]?.includes('completed') && (
                                            <button onClick={() => handleStatusChange(b._id, 'completed')} className="text-green-600 hover:text-green-900" title="Complete">
                                                <CheckCircle size={18} className="inline" />
                                            </button>
                                        )}
                                        {statusActions[b.status]?.includes('cancelled') && (
                                            <button onClick={() => handleStatusChange(b._id, 'cancelled')} className="text-red-600 hover:text-red-900" title="Cancel">
                                                <XCircle size={18} className="inline" />
                                            </button>
                                        )}
                                        {statusActions[b.status]?.includes('no_show') && (
                                            <button onClick={() => handleStatusChange(b._id, 'no_show')} className="text-gray-600 hover:text-gray-900" title="Mark No-Show">
                                                <Clock size={18} className="inline" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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

export default BookingList;