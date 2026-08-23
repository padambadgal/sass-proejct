import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Plus, Edit, Trash2, AlertCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);

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

  // Fetch staff when business changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/staff?businessId=${selectedBusinessId}`);
        setStaff(res.data.data);

        // Get plan limits
        const subRes = await apiClient.get('/subscriptions/me');
        if (subRes.data.data) {
          const plan = subRes.data.data.planDetails;
          if (plan) {
            const currentCount = res.data.data.filter(s => s.status === 'active').length;
            setPlanInfo({
              maxStaff: plan.maxStaff,
              currentCount,
              remaining: plan.maxStaff === Infinity ? '∞' : plan.maxStaff - currentCount,
            });
          }
        }
      } catch (err) {
        toast.error('Failed to load staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [selectedBusinessId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this staff member?')) return;
    try {
      await apiClient.delete(`/staff/${id}`);
      setStaff(prev => prev.map(s => s._id === id ? { ...s, status: 'inactive' } : s));
      toast.success('Staff deactivated');
      // Update remaining count
      setPlanInfo(prev => ({
        ...prev,
        currentCount: prev.currentCount - 1,
        remaining: prev.maxStaff === Infinity ? '∞' : prev.maxStaff - (prev.currentCount - 1),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleBusinessChange = (e) => {
    setSelectedBusinessId(e.target.value);
  };

  // Helper to get service names
  const getServiceNames = (staffMember) => {
    if (!staffMember.services || staffMember.services.length === 0) return '—';
    return staffMember.services.map(s => s.name).join(', ');
  };

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No business found</h3>
        <p className="mt-1 text-sm text-gray-500">Create a business first to add staff.</p>
        <Link to="/business/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
          Add Business
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Staff</h1>
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
          <Link
            to="/staff/new"
            state={{ businessId: selectedBusinessId }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" /> Add Staff
          </Link>
        </div>
      </div>

      {/* Plan limit info */}
      {planInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          Staff used: {planInfo.currentCount} / {planInfo.maxStaff === Infinity ? '∞' : planInfo.maxStaff}
          {planInfo.remaining !== '∞' && planInfo.remaining <= 1 && (
            <span className="ml-2 text-red-600 font-semibold">(Only {planInfo.remaining} left)</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No staff members yet. Click "Add Staff" to build your team.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{getServiceNames(member)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/staff/${member._id}/edit`}
                      state={{ businessId: selectedBusinessId }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={member.status === 'inactive'}
                    >
                      <Trash2 size={18} className="inline" />
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