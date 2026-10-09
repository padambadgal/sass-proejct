import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Plus,
  Edit,
  Power,
  ExternalLink,
  Loader2,
  Store,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  {
    title: 'Add your business',
    text: 'Name, phone number and a unique booking slug.',
  },
  {
    title: 'Set up services & staff',
    text: 'Define what you offer and who delivers it.',
  },
  {
    title: 'Share your booking link',
    text: 'Customers book directly from your public page.',
  },
];

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);

  /* ---------------- Fetch businesses + plan ---------------- */
  const fetchBusinesses = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get('/business/me');
      const list = res.data.data || [];
      setBusinesses(list);

      // Get plan limits
      const subRes = await apiClient.get('/subscriptions/me');
      if (subRes.data.data) {
        const plan = subRes.data.data.planDetails;
        if (plan) {
          const currentCount = list.filter((b) => b.isActive === true).length;
          const remaining =
            plan.maxBusinesses === Infinity
              ? Infinity
              : Math.max(0, plan.maxBusinesses - currentCount);
          setPlanInfo({
            planName: plan.name,
            maxBusinesses: plan.maxBusinesses,
            currentCount,
            remaining,
          });
        }
      }

      if (silent) {
        if (list.length === 0) toast.error('Still no business found. Try creating one.');
        else toast.success('Business found!');
      }
      return list;
    } catch (err) {
      toast.error('Failed to load businesses');
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  /* ---------------- Toggle status ---------------- */
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    if (newStatus && planInfo?.remaining === 0) {
      toast.error(
        'Business limit reached. Deactivate another business or upgrade your plan.'
      );
      return;
    }
    if (!window.confirm(`Are you sure you want to ${action} this business?`)) return;

    setTogglingId(id);
    try {
      await apiClient.patch(`/business/${id}`, { isActive: newStatus });
      setBusinesses((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isActive: newStatus } : b))
      );
      toast.success(`Business ${action}d successfully`);

      const activeCount = businesses.filter((b) =>
        b._id !== id ? b.isActive : newStatus
      ).length;

      setPlanInfo((prev) =>
        prev
          ? {
              ...prev,
              currentCount: activeCount,
              remaining:
                prev.maxBusinesses === Infinity
                  ? Infinity
                  : Math.max(0, prev.maxBusinesses - activeCount),
            }
          : prev
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} business`);
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------------- Loaders ---------------- */
  if (loading) {
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
              Create your first business
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Your business is the home of your services, staff and bookings. Add
              one in under a minute and your public booking page will be ready to
              share.
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
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {step.text}
                </p>
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
              {refreshing ? 'Checking…' : 'Refresh'}
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
          You can add more businesses later based on your plan.
        </p>
      </div>
    );
  }

  /* ---------------- Main view ---------------- */
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Businesses</h1>
        {planInfo?.remaining === 0 ? (
          <button
            type="button"
            disabled
            title="Business limit reached — upgrade your plan"
            className="inline-flex self-start cursor-not-allowed items-center rounded-md bg-gray-400 px-4 py-2 text-white"
          >
            <Plus size={18} className="mr-2" /> Add Business
          </button>
        ) : (
          <Link
            to="/business/new"
            className="inline-flex self-start items-center rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" /> Add Business
          </Link>
        )}
      </div>

      {/* Plan limit info */}
      {planInfo && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">
                {planInfo.planName || 'Current'} Plan
              </span>
              <span className="mx-2">·</span>
              <span>
                Businesses: <strong>{planInfo.currentCount}</strong> /{' '}
                {planInfo.maxBusinesses === Infinity ? '∞' : planInfo.maxBusinesses}
              </span>
            </div>
            {planInfo.remaining !== Infinity && planInfo.remaining === 1 && (
              <span className="font-semibold text-red-600">
                ⚠️ Only 1 business slot left
              </span>
            )}
          </div>
          {planInfo.remaining !== Infinity && planInfo.remaining === 0 && (
            <div className="mt-2 font-medium text-red-600">
              You&apos;ve reached your business limit. Upgrade your plan to add
              more businesses.
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Slug', 'Phone', 'Status', 'Actions'].map((h) => (
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
            {businesses.map((biz) => (
              <tr key={biz._id} className="transition hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {biz.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    {biz.slug}
                    <a
                      href={`/book/${biz.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open booking page for ${biz.name}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {biz.phone || '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      biz.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {biz.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <Link
                    to={`/business/${biz._id}/edit`}
                    aria-label={`Edit ${biz.name}`}
                    className="text-indigo-600 transition hover:text-indigo-900"
                  >
                    <Edit size={18} className="inline cursor-pointer" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(biz._id, biz.isActive)}
                    disabled={togglingId === biz._id}
                    aria-label={
                      biz.isActive
                        ? `Deactivate ${biz.name}`
                        : `Activate ${biz.name}`
                    }
                    className={`${
                      biz.isActive
                        ? 'text-red-600 hover:text-red-800'
                        : 'text-green-600 hover:text-green-800'
                    } disabled:opacity-50`}
                  >
                    {togglingId === biz._id ? (
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
    </div>
  );
};

export default BusinessList;