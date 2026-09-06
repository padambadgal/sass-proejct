import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Plus, Edit, Power, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);

  const fetchBusinesses = async () => {
    try {
      // ✅ Fixed: use /business instead of /business/me
      const res = await apiClient.get('/business/me');
      setBusinesses(res.data.data);

      // Get plan limits
      const subRes = await apiClient.get('/subscriptions/me');
      if (subRes.data.data) {
        const plan = subRes.data.data.planDetails;
        if (plan) {
          const currentCount = res.data.data.filter(b => b.isActive === true).length;
          setPlanInfo({
            maxBusinesses: plan.maxBusinesses,
            currentCount,
            remaining: plan.maxBusinesses === Infinity ? '∞' : plan.maxBusinesses - currentCount,
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this business?`)) return;
    setTogglingId(id);
    try {
      await apiClient.patch(`/business/${id}`, { isActive: newStatus });
      setBusinesses(prev => prev.map(b => b._id === id ? { ...b, isActive: newStatus } : b));
      toast.success(`Business ${action}d successfully`);

      // Update plan counters
      const activeCount = businesses.filter(b => b._id !== id ? b.isActive : newStatus).length;
      setPlanInfo(prev => ({
        ...prev,
        currentCount: activeCount,
        remaining: prev.maxBusinesses === Infinity ? '∞' : prev.maxBusinesses - activeCount,
      }));
    } catch (err) {
      toast.error(`Failed to ${action} business`);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">My Businesses</h1>
        <Link
          to="/business/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          <Plus size={18} className="mr-2" /> Add Business
        </Link>
      </div>

      {/* Plan limit info */}
      {planInfo && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">{planInfo.planName || 'Current'} Plan</span>
              <span className="mx-2">·</span>
              <span>
                Businesses: <strong>{planInfo.currentCount}</strong> / {planInfo.maxBusinesses === Infinity ? '∞' : planInfo.maxBusinesses}
              </span>
            </div>
            {planInfo.remaining !== '∞' && planInfo.remaining <= 1 && (
              <span className="text-red-600 font-semibold">
                ⚠️ Only {planInfo.remaining} business slot left
              </span>
            )}
          </div>
          {planInfo.remaining !== '∞' && planInfo.remaining === 0 && (
            <div className="mt-2 text-red-600 font-medium">
              You've reached your business limit. Upgrade your plan to add more businesses.
            </div>
          )}
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No businesses yet. Click "Add Business" to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businesses.map((biz) => (
                <tr key={biz._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{biz.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      {biz.slug}
                      <a
                        href={`/book/${biz.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{biz.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${biz.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {biz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/business/${biz._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(biz._id, biz.isActive)}
                      disabled={togglingId === biz._id}
                      className={`${biz.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                        } disabled:opacity-50`}
                    >
                      {togglingId === biz._id ? (
                        <Loader2 size={18} className="inline animate-spin" />
                      ) : (
                        <Power size={18} className="inline" />
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

export default BusinessList;