import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Plus, Edit, Power, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);

  // Fetch all businesses owned by the user
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoadingBusinesses(true);
      try {
        // ✅ Fixed: use /business instead of /business/me
        const res = await apiClient.get('/business/me');
        setBusinesses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedBusinessId(res.data.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load businesses');
      } finally {
        setLoadingBusinesses(false);
      }
    };
    fetchBusinesses();
  }, []);

  // Fetch services when selected business changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/services?businessId=${selectedBusinessId}`);
        const servicesData = res.data.data || [];
        setServices(servicesData);

        // Get plan limits
        const subRes = await apiClient.get('/subscriptions/me');
        if (subRes.data.data) {
          const plan = subRes.data.data.planDetails;
          if (plan) {
            const currentCount = servicesData.filter(s => s.status === 'active').length;
            setPlanInfo({
              maxServices: plan.maxServices,
              currentCount,
              remaining: plan.maxServices === Infinity ? '∞' : plan.maxServices - currentCount,
            });
          }
        }
      } catch (err) {
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [selectedBusinessId]);

  // Toggle service status (active ↔ inactive)
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this service?`)) return;

    setTogglingId(id);
    try {
      await apiClient.patch(`/services/${id}`, { status: newStatus });
      setServices(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
      toast.success(`Service ${action}d successfully`);

      // Update plan counters
      const activeCount = services.filter(s => s._id !== id ? s.status === 'active' : newStatus === 'active').length;
      setPlanInfo(prev => ({
        ...prev,
        currentCount: activeCount,
        remaining: prev.maxServices === Infinity ? '∞' : prev.maxServices - activeCount,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} service`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleBusinessChange = (e) => {
    setSelectedBusinessId(e.target.value);
  };

  // Show loader while businesses are loading
  if (loadingBusinesses) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No business found</h3>
        <p className="mt-1 text-sm text-gray-500">Create a business first to add services.</p>
        <Link to="/business/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
          Add Business
        </Link>
      </div>
    );
  }

  // ✅ Professional loader animation for services
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
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
            to="/services/new"
            state={{ businessId: selectedBusinessId }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" /> Add Service
          </Link>
        </div>
      </div>

      {/* Plan limit info */}
      {planInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          Services used: {planInfo.currentCount} / {planInfo.maxServices === Infinity ? '∞' : planInfo.maxServices}
          {planInfo.remaining !== '∞' && planInfo.remaining <= 2 && (
            <span className="ml-2 text-red-600 font-semibold">(Only {planInfo.remaining} left)</span>
          )}
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No services yet. Click "Add Service" to create one.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((svc) => (
                <tr key={svc._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{svc.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{svc.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{svc.duration} min</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      svc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {svc.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/services/${svc._id}/edit`}
                      state={{ businessId: selectedBusinessId }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(svc._id, svc.status)}
                      disabled={togglingId === svc._id}
                      className={`${
                        svc.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      } disabled:opacity-50`}
                    >
                      {togglingId === svc._id ? (
                        <span className="inline-block animate-spin">⟳</span>
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

export default ServiceList;