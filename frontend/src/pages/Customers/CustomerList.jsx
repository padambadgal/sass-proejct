import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Search,
  Eye,
  Edit,
  Power,
  Loader2,
  Users,
  Store,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  {
    title: 'Create your business',
    text: 'Add name, phone and a booking slug.',
  },
  {
    title: 'Come back here',
    text: 'Customers appear once a business exists.',
  },
  {
    title: 'Share your booking link',
    text: 'Every booking adds a customer automatically.',
  },
];

const CustomerList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

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
        else toast.success('Business found — you can view customers now!');
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

  /* ---------------- Customers ---------------- */
  useEffect(() => {
    if (!selectedBusinessId) {
      setCustomers([]);
      setFilteredCustomers([]);
      return;
    }

    let cancelled = false;

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/customers?businessId=${selectedBusinessId}`);
        if (cancelled) return;
        const data = res.data.data || [];
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (err) {
        if (!cancelled) toast.error('Failed to load customers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId]);

  /* ---------------- Search ---------------- */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term))
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  /* ---------------- Toggle status ---------------- */
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this customer?`)) return;

    setTogglingId(id);
    try {
      await apiClient.patch(`/customers/${id}`, { status: newStatus });
      setCustomers((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Customer ${action}d successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} customer`);
    } finally {
      setTogglingId(null);
    }
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
          {/* Header */}
          <div className="border-b border-gray-100 bg-gradient-to-b from-indigo-50/80 to-white px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-indigo-50">
              <Store className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Create a business first
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Customers are always tied to a business — that's where bookings, contact
              details and history are stored. Set up your business once and this page
              will unlock automatically.
            </p>
          </div>

          {/* Steps */}
          <ol className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{step.text}</p>
              </li>
            ))}
          </ol>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <button
              type="button"
              onClick={() => fetchBusinesses({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
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
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="business" className="sr-only">
              Select business
            </label>
            <select
              id="business"
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="block w-48 p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {businesses.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 md:w-96"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">
            {customers.length === 0
              ? 'No customers yet.'
              : 'No customers match your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Bookings', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCustomers.map((c) => (
                <tr key={c._id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {c.email || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {c.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {c.totalBookings || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        c.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      to={`/customers/${c._id}`}
                      aria-label={`View ${c.name}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye size={18} className="inline cursor-pointer" />
                    </Link>
                    {/* <Link
                      to={`/customers/${c._id}/edit`}
                      aria-label={`Edit ${c.name}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} className="inline cursor-pointer" />
                    </Link> */}
                    {/* <button
                      type="button"
                      onClick={() => handleToggleStatus(c._id, c.status)}
                      disabled={togglingId === c._id}
                      aria-label={
                        c.status === 'active'
                          ? `Deactivate ${c.name}`
                          : `Activate ${c.name}`
                      }
                      className={`${
                        c.status === 'active'
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-green-600 hover:text-green-800'
                      } disabled:opacity-50`}
                    >
                      {togglingId === c._id ? (
                        <Loader2 size={18} className="inline animate-spin" />
                      ) : (
                        <Power size={18} className="inline cursor-pointer" />
                      )}
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-6 py-3 text-sm text-gray-500">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;