import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { AlertCircle, Plus, Trash2, Save } from 'lucide-react';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
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
  const [saving, setSaving] = useState(false);

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

  // Fetch availability when business changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/availability?businessId=${selectedBusinessId}`);
        const data = res.data.data; // array of availability objects
        // Build full 7-day schedule: start with defaults, then override with fetched data
        const fullSchedule = DAYS.map(day => {
          const existing = data.find(d => d.dayOfWeek === day.value);
          if (existing) {
            return {
              dayOfWeek: existing.dayOfWeek,
              isOpen: existing.isOpen,
              startTime: existing.startTime || '09:00',
              endTime: existing.endTime || '18:00',
              breaks: existing.breaks || [],
            };
          } else {
            return defaultDay(day.value);
          }
        });
        setSchedule(fullSchedule);
      } catch (err) {
        toast.error('Failed to load availability');
        // Set default schedule
        setSchedule(DAYS.map(day => defaultDay(day.value)));
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [selectedBusinessId]);

  // Update a specific day's field
  const updateDay = (index, field, value) => {
    setSchedule(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add a break to a day
  const addBreak = (index) => {
    const day = schedule[index];
    const newBreak = { start: '12:00', end: '13:00' };
    setSchedule(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        breaks: [...updated[index].breaks, newBreak],
      };
      return updated;
    });
  };

  // Remove a break from a day
  const removeBreak = (dayIndex, breakIndex) => {
    setSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        breaks: updated[dayIndex].breaks.filter((_, i) => i !== breakIndex),
      };
      return updated;
    });
  };

  // Update a break field (start or end)
  const updateBreak = (dayIndex, breakIndex, field, value) => {
    setSchedule(prev => {
      const updated = [...prev];
      const breaks = [...updated[dayIndex].breaks];
      breaks[breakIndex] = { ...breaks[breakIndex], [field]: value };
      updated[dayIndex] = { ...updated[dayIndex], breaks };
      return updated;
    });
  };

  // Save all changes
  const handleSave = async () => {
    if (!selectedBusinessId) return;
    setSaving(true);
    try {
      // Prepare payload: days array (exclude day names, just dayOfWeek, isOpen, startTime, endTime, breaks)
      const daysPayload = schedule.map(day => ({
        dayOfWeek: day.dayOfWeek,
        isOpen: day.isOpen,
        startTime: day.startTime || '09:00',
        endTime: day.endTime || '18:00',
        breaks: day.breaks.map(b => ({ start: b.start, end: b.end })),
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

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No business found</h3>
        <p className="mt-1 text-sm text-gray-500">Create a business first to set availability.</p>
        <Link to="/business/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
          Add Business
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Availability Schedule</h1>
        <div className="flex items-center gap-4">
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
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {schedule.map((day, index) => (
            <div key={day.dayOfWeek} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">{DAYS[index].label}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) => updateDay(index, 'isOpen', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform translate-x-0.5 peer-checked:translate-x-5"></div>
                  </div>
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
                        className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500">End</label>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(index, 'endTime', e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Break List */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Breaks</label>
                    {day.breaks.map((br, brIdx) => (
                      <div key={brIdx} className="flex items-center gap-2 mt-1">
                        <input
                          type="time"
                          value={br.start}
                          onChange={(e) => updateBreak(index, brIdx, 'start', e.target.value)}
                          className="w-1/2 border border-gray-300 rounded-md py-1 px-2 text-sm"
                        />
                        <input
                          type="time"
                          value={br.end}
                          onChange={(e) => updateBreak(index, brIdx, 'end', e.target.value)}
                          className="w-1/2 border border-gray-300 rounded-md py-1 px-2 text-sm"
                        />
                        <button
                          onClick={() => removeBreak(index, brIdx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addBreak(index)}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Break
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mt-2">Closed</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilitySchedule;