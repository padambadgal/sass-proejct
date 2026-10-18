import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Eye,
  Plus,
  Edit,
  Power,
  User,
  Users,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  {
    title: 'Create your business',
    text: 'Add name, phone and a booking slug.',
  },
  {
    title: 'Come back here',
    text: 'Staff unlocks as soon as a business exists.',
  },
  {
    title: 'Add your team',
    text: 'Assign services and activate each member.',
  },
];

const StaffList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);

  /* ---------------- Businesses ---------------- */
  const fetchBusinesses = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoadingBusinesses(true);

    try {
      const res = await apiClient.get('/business/me');
      const list = res.data.data || [];
      setBusinesses(list);
      // keep current selection if it still exists, otherwise pick the first one
      setSelectedBusinessId((prev) =>
        list.some((b) => b._id === prev) ? prev : list[0]?._id || ''
      );

      if (silent) {
        if (list.length === 0) toast.error('Still no business found. Please create one.');
        else toast.success('Business found — you can add staff now!');
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

  /* ---------------- Staff ---------------- */
  useEffect(() => {
    if (!selectedBusinessId) {
      setStaff([]);
      setPlanInfo(null);
      return;
    }

    let cancelled = false;

    const fetchStaff = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/staff?businessId=${selectedBusinessId}`);
        const staffData = res.data.data || [];
        if (cancelled) return;
        setStaff(staffData);

        const subRes = await apiClient.get('/subscriptions/me');
        if (cancelled) return;
        const plan = subRes.data.data?.planDetails;
        if (plan) {
          const currentCount = staffData.filter((s) => s.status === 'active').length;
          const maxStaff = plan.maxStaff ?? Infinity;
          setPlanInfo({
            maxStaff,
            currentCount,
            remaining:
              maxStaff === Infinity ? Infinity : Math.max(0, maxStaff - currentCount),
          });
        }
      } catch (err) {
        if (!cancelled) toast.error('Failed to load staff');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStaff();
    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId]);

  /* ---------------- Toggle status ---------------- */
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (newStatus === 'active' && planInfo?.remaining === 0) {
      toast.error('Staff limit reached. Deactivate another staff member or upgrade your plan.');
      return;
    }
    if (!window.confirm(`Are you sure you want to ${action} this staff member?`)) return;

    setTogglingId(id);
    try {
      await apiClient.patch(`/staff/${id}`, { status: newStatus });
      setStaff((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: newStatus } : s))
      );
      toast.success(`Staff ${action}d successfully`);

      const activeCount = staff.filter((s) =>
        s._id !== id ? s.status === 'active' : newStatus === 'active'
      ).length;

      setPlanInfo((prev) =>
        prev
          ? {
              ...prev,
              currentCount: activeCount,
              remaining:
                prev.maxStaff === Infinity
                  ? Infinity
                  : Math.max(0, prev.maxStaff - activeCount),
            }
          : prev
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} staff`);
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------------- Helpers ---------------- */
  const getServiceNames = (member) => {
    if (!member.services || member.services.length === 0) return '—';
    return member.services.map((s) => s.name).join(', ');
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
              <Users className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Create a business first
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Staff members belong to a business — that's where their schedule and assigned
              services live. Set up your business once and this page will unlock
              automatically.
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Staff</h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <div>
            <label htmlFor="business" className="sr-only">
              Select business
            </label>
            <select
              id="business"
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:w-48"
            >
              {businesses.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {planInfo?.remaining === 0 ? (
            <button
              type="button"
              disabled
              title="Staff limit reached — upgrade your plan"
              className="inline-flex self-start cursor-not-allowed items-center justify-center rounded-md bg-gray-400 px-4 py-2 text-white sm:self-auto"
            >
              <Plus size={18} className="mr-2" /> Add Staff
            </button>
          ) : (
            <Link
              to="/staff/new"
              state={{ businessId: selectedBusinessId }}
              className="inline-flex self-start items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 sm:self-auto"
            >
              <Plus size={18} className="mr-2" /> Add Staff
            </Link>
          )}
        </div>
      </div>

      {/* Plan limit info */}
      {planInfo && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Staff used: {planInfo.currentCount} /{' '}
          {planInfo.maxStaff === Infinity ? '∞' : planInfo.maxStaff}
          {planInfo.remaining !== Infinity && planInfo.remaining === 0 && (
            <span className="ml-2 font-semibold text-red-600">(Limit reached)</span>
          )}
          {planInfo.remaining !== Infinity && planInfo.remaining === 1 && (
            <span className="ml-2 font-semibold text-red-600">
              (Only {planInfo.remaining} left)
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">
            No staff members yet. Click &quot;Add Staff&quot; to build your team.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Services', 'Status', 'Actions'].map((h) => (
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
              {staff.map((member) => (
                <tr key={member._id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {member.email || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {member.phone || '—'}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                    {getServiceNames(member)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      to={`/staff/${member._id}`}
                      aria-label={`View ${member.name}`}
                      title="View"
                      className="text-blue-600 transition hover:text-blue-900"
                    >
                      <Eye size={18} className="inline cursor-pointer" />
                    </Link>
                    <Link
                      to={`/staff/${member._id}/edit`}
                      state={{ businessId: selectedBusinessId }}
                      aria-label={`Edit ${member.name}`}
                      className="text-indigo-600 transition hover:text-indigo-900"
                    >
                      <Edit size={18} className="inline cursor-pointer" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member._id, member.status)}
                      disabled={togglingId === member._id}
                      aria-label={
                        member.status === 'active'
                          ? `Deactivate ${member.name}`
                          : `Activate ${member.name}`
                      }
                      className={`${
                        member.status === 'active'
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-green-600 hover:text-green-800'
                      } disabled:opacity-50`}
                    >
                      {togglingId === member._id ? (
                        <Loader2 size={18} className="inline animate-spin" />
                      ) : (
                        <Power size={18} className="inline cursor-pointer" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffList;