import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Save,
  Store,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
} from 'lucide-react';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const STEPS = [
  {
    title: 'Create your business',
    text: 'Add name, phone and a booking slug.',
  },
  {
    title: 'Come back here',
    text: 'Availability unlocks as soon as a business exists.',
  },
  {
    title: 'Set your hours',
    text: 'Open days, working hours and breaks.',
  },
];

const defaultDay = (dayOfWeek) => ({
  dayOfWeek,
  isOpen: false,
  startTime: '09:00',
  endTime: '18:00',
  breaks: [],
});

const AvailabilitySchedule = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

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
        else toast.success('Business found — you can set availability now!');
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

  /* ---------------- Availability ---------------- */
  useEffect(() => {
    if (!selectedBusinessId) {
      setSchedule([]);
      return;
    }

    let cancelled = false;

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/availability?businessId=${selectedBusinessId}`);
        if (cancelled) return;
        const data = res.data.data || [];
        const fullSchedule = DAYS.map((day) => {
          const existing = data.find((d) => d.dayOfWeek === day.value);
          if (existing) {
            return {
              dayOfWeek: existing.dayOfWeek,
              isOpen: existing.isOpen,
              startTime: existing.startTime || '09:00',
              endTime: existing.endTime || '18:00',
              breaks: existing.breaks || [],
            };
          }
          return defaultDay(day.value);
        });
        setSchedule(fullSchedule);
      } catch (err) {
        if (cancelled) return;
        toast.error('Failed to load availability');
        setSchedule(DAYS.map((day) => defaultDay(day.value)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId]);

  /* ---------------- Local updates ---------------- */
  const updateDay = (index, field, value) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addBreak = (index) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        breaks: [...updated[index].breaks, { start: '12:00', end: '13:00' }],
      };
      return updated;
    });
  };

  const removeBreak = (dayIndex, breakIndex) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        breaks: updated[dayIndex].breaks.filter((_, i) => i !== breakIndex),
      };
      return updated;
    });
  };

  const updateBreak = (dayIndex, breakIndex, field, value) => {
    setSchedule((prev) => {
      const updated = [...prev];
      const breaks = [...updated[dayIndex].breaks];
      breaks[breakIndex] = { ...breaks[breakIndex], [field]: value };
      updated[dayIndex] = { ...updated[dayIndex], breaks };
      return updated;
    });
  };

  /* ---------------- Save ---------------- */
  const handleSave = async () => {
    if (!selectedBusinessId) return;

    // Client-side validation: end must be after start, breaks inside working hours
    for (const day of schedule) {
      if (!day.isOpen) continue;
      if (day.startTime >= day.endTime) {
        toast.error(`${DAYS[day.dayOfWeek].label}: end time must be after start time.`);
        return;
      }
      for (const br of day.breaks) {
        if (br.start >= br.end) {
          toast.error(`${DAYS[day.dayOfWeek].label}: break end must be after break start.`);
          return;
        }
        if (br.start < day.startTime || br.end > day.endTime) {
          toast.error(
            `${DAYS[day.dayOfWeek].label}: breaks must be inside working hours.`
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      const daysPayload = schedule.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        isOpen: day.isOpen,
        startTime: day.startTime || '09:00',
        endTime: day.endTime || '18:00',
        breaks: day.breaks.map((b) => ({ start: b.start, end: b.end })),
      }));

      await apiClient.post('/availability/bulk', {
        businessId: selectedBusinessId,
        days: daysPayload,
      });
      toast.success('Availability saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessChange = (e) => {
    setSelectedBusinessId(e.target.value);
  };

  const selectedBusiness = businesses.find((b) => b._id === selectedBusinessId);

  const copyBookingUrl = () => {
    if (!selectedBusiness?.slug) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/book/${selectedBusiness.slug}`
    );
    toast.success('Booking URL copied!');
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
              Availability is tied to a specific business — its hours, breaks and public
              booking page. Set up your business once and this page will unlock
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Availability Schedule</h1>
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="business" className="sr-only">
              Select business
            </label>
            <select
              id="business"
              value={selectedBusinessId}
              onChange={handleBusinessChange}
              className="block w-48 p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {businesses.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* ===== PUBLIC BOOKING URL SECTION ===== */}
      {selectedBusiness?.slug && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-green-800">
                🔗 Your Public Booking URL
              </p>
              <p className="text-sm text-gray-600">
                Share this link with your customers to accept bookings:
              </p>
              <a
                href={`/book/${selectedBusiness.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-sm text-indigo-600 hover:underline"
              >
                /book/{selectedBusiness.slug}
                <ExternalLink size={12} />
              </a>
            </div>
            <button
              type="button"
              onClick={copyBookingUrl}
              className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white transition hover:bg-indigo-700"
            >
              <Copy size={14} /> Copy URL
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {schedule.map((day, index) => (
            <div
              key={day.dayOfWeek}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">{DAYS[index].label}</h3>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) => updateDay(index, 'isOpen', e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2"
                    aria-hidden="true"
                  />
                  <span
                    className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5"
                    aria-hidden="true"
                  />
                </label>
              </div>

              {day.isOpen ? (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500">Start</label>
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDay(index, 'startTime', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500">End</label>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(index, 'endTime', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Breaks</label>
                    {day.breaks.map((br, brIdx) => (
                      <div key={brIdx} className="mt-1 flex items-center gap-2">
                        <input
                          type="time"
                          value={br.start}
                          onChange={(e) =>
                            updateBreak(index, brIdx, 'start', e.target.value)
                          }
                          className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <input
                          type="time"
                          value={br.end}
                          onChange={(e) =>
                            updateBreak(index, brIdx, 'end', e.target.value)
                          }
                          className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeBreak(index, brIdx)}
                          aria-label="Remove break"
                          className="text-red-500 transition hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addBreak(index)}
                      className="mt-2 flex cursor-pointer items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <Plus size={14} /> Add Break
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Closed</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilitySchedule;