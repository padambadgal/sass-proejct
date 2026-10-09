import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Eye,
  CheckCircle,
  RefreshCw,
  XCircle,
  Ban,
  Calendar as CalIcon,
  Store,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatLocalDate } from '../../utils/date';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import RescheduleModal from './RescheduleModal';

const STEPS = [
  {
    title: 'Create your business',
    text: 'Add name, phone and a booking slug.',
  },
  {
    title: 'Share your booking link',
    text: 'Customers book from your public page.',
  },
  {
    title: 'Manage bookings here',
    text: 'Confirm, complete (paid/unpaid) or reschedule.',
  },
];

const BookingList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date());
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------------- Businesses ---------------- */
  const fetchBusinesses = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoadingBusinesses(true);

    try {
      const res = await apiClient.get('/business/me');
      const list = res.data.data || [];
      setBusinesses(list);
      setSelectedBusinessId((prev) =>
        list.some((b) => b._id === prev) ? prev : list[0]?._id || ''
      );

      if (silent) {
        if (list.length === 0) toast.error('Still no business found. Please create one.');
        else toast.success('Business found — you can manage bookings now!');
      }
      return list;
    } catch (err) {
      toast.error('Failed to load businesses');
      return [];
    } finally {
      setLoadingBusinesses(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  /* ---------------- Bookings ---------------- */
  useEffect(() => {
    if (!selectedBusinessId) {
      setBookings([]);
      return;
    }

    let cancelled = false;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const dateStr = formatLocalDate(dateFilter);
        let url = `/bookings?businessId=${selectedBusinessId}`;
        if (statusFilter !== 'all') url += `&status=${statusFilter}`;
        url += `&date=${dateStr}`;
        const res = await apiClient.get(url);
        if (cancelled) return;
        setBookings(res.data.data || []);
      } catch (err) {
        if (cancelled) return;
        toast.error('Failed to load bookings');
        setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId, statusFilter, dateFilter, refreshKey]);

  /* ---------------- Status transitions ----------------
   * pending   → confirmed | cancelled (unpaid)
   * confirmed → completed (paid) | completed (unpaid)
   * completed → toggle paymentStatus only (paid ↔ unpaid)
   * cancelled → (terminal)
   * ---------------------------------------------------- */
  const handleStatusChange = async (bookingId, newStatus, paymentStatus) => {
    const payload = { status: newStatus };
    if (paymentStatus) payload.paymentStatus = paymentStatus;

    let confirmMsg = `Change status to ${newStatus}?`;
    if (newStatus === 'confirmed') {
      confirmMsg = 'Confirm this booking?';
    } else if (newStatus === 'completed' && paymentStatus === 'paid') {
      confirmMsg = 'Mark this booking as completed and PAID?';
    } else if (newStatus === 'completed' && paymentStatus === 'unpaid') {
      confirmMsg = 'Mark this booking as completed but UNPAID?';
    } else if (newStatus === 'cancelled') {
      confirmMsg = 'Cancel this booking?';
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await apiClient.patch(
        `/bookings/${bookingId}/status`,
        payload
      );

      let label = newStatus;
      if (newStatus === 'completed' && paymentStatus === 'paid') label = 'completed & paid';
      else if (newStatus === 'completed' && paymentStatus === 'unpaid') label = 'completed (unpaid)';

      toast.success(`Booking ${label}`);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                status: response.data.data.status,
                paymentStatus:
                  response.data.data.paymentStatus ?? b.paymentStatus,
              }
            : b
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  /* Toggle payment status only — used when booking is already completed */
  const handleTogglePayment = async (bookingId, currentPaymentStatus) => {
    const newPaymentStatus =
      currentPaymentStatus === 'paid' ? 'unpaid' : 'paid';
    const actionLabel =
      newPaymentStatus === 'paid' ? 'mark as PAID' : 'mark as UNPAID';

    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) return;

    try {
      const response = await apiClient.patch(
        `/bookings/${bookingId}/status`,
        { paymentStatus: newPaymentStatus }
      );
      toast.success(`Payment ${newPaymentStatus}`);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                paymentStatus:
                  response.data.data.paymentStatus ?? newPaymentStatus,
              }
            : b
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment update failed');
    }
  };

  const handleRescheduleSuccess = () => {
    setRescheduleBooking(null);
    setRefreshKey((prev) => prev + 1);
    toast.success('Booking rescheduled successfully');
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const paymentColors = {
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-orange-100 text-orange-800',
  };

  /* ---------------- Loaders ---------------- */
  if (loadingBusinesses) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  /* ---------------- Empty state: no business yet ---------------- */
  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-b from-indigo-50/80 to-white px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-indigo-50">
              <Store className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Create a business first
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Bookings belong to a business — that's where your services, working
              hours and public booking page live. Set up your business once and this
              page will unlock automatically.
            </p>
          </div>

          <ol className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <button
              type="button"
              onClick={() => fetchBusinesses({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Checking…' : "I've already created one — Refresh"}
            </button>

            <Link
              to="/business/new"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <Plus size={18} />
              Create Business
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <CheckCircle2 size={14} className="text-green-500" />
          You'll be redirected back here once your business is created.
        </p>
      </div>
    );
  }

  /* ---------------- Main view ---------------- */
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={loading || !selectedBusinessId}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div>
            <label htmlFor="business" className="sr-only">
              Select business
            </label>
            <select
              id="business"
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {businesses.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
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
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <CalIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">
            No bookings for this date and status.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Reference',
                  'Customer',
                  'Service',
                  'Date',
                  'Time',
                  'Status',
                  'Payment',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.map((b) => (
                <tr key={b._id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-900">
                    {b.bookingReference}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {b.customer?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.serviceId?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(b.date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.startTime} – {b.endTime}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        statusColors[b.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        paymentColors[b.paymentStatus] ||
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {b.paymentStatus || 'unpaid'}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-sm font-medium">
                    {/* View — always available */}
                    <Link
                      to={`/bookings/${b._id}`}
                      className="text-blue-600 transition hover:text-blue-900"
                      title="View"
                    >
                      <Eye size={18} className="inline" />
                    </Link>

                    {/* PENDING → Confirm · Cancel · Reschedule */}
                    {b.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(b._id, 'confirmed')
                          }
                          className="text-blue-600 transition hover:text-blue-900"
                          title="Confirm booking"
                        >
                          <CheckCircle size={18} className="inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(b._id, 'cancelled')
                          }
                          className="text-red-600 transition hover:text-red-900"
                          title="Cancel booking"
                        >
                          <Ban size={18} className="inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRescheduleBooking(b)}
                          className="text-indigo-600 transition hover:text-indigo-900"
                          title="Reschedule"
                        >
                          <RefreshCw size={18} className="inline" />
                        </button>
                      </>
                    )}

                    {/* CONFIRMED → Complete Paid · Complete Unpaid · Reschedule */}
                    {b.status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(b._id, 'completed', 'paid')
                          }
                          className="text-green-600 transition hover:text-green-900"
                          title="Complete & mark as paid"
                        >
                          <CheckCircle size={18} className="inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(b._id, 'completed', 'unpaid')
                          }
                          className="text-amber-600 transition hover:text-amber-900"
                          title="Complete (unpaid)"
                        >
                          <XCircle size={18} className="inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRescheduleBooking(b)}
                          className="text-indigo-600 transition hover:text-indigo-900"
                          title="Reschedule"
                        >
                          <RefreshCw size={18} className="inline" />
                        </button>
                      </>
                    )}

                    {/* COMPLETED → toggle payment status only */}
                    {b.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePayment(b._id, b.paymentStatus)
                        }
                        className={`${
                          b.paymentStatus === 'paid'
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                        } transition`}
                        title={
                          b.paymentStatus === 'paid'
                            ? 'Mark as unpaid'
                            : 'Mark as paid'
                        }
                      >
                        <RefreshCw size={18} className="inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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