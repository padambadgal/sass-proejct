import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);

  // Fetch all businesses owned by the user
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

  // Fetch services when selected business changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/services?businessId=${selectedBusinessId}`);
        setServices(res.data.data);
        // Get plan limits – we'll call subscription endpoint or extract from the response
        // For now, we'll fetch subscription info separately.
        const subRes = await apiClient.get('/subscriptions/me');
        if (subRes.data.data) {
          const plan = subRes.data.data.planDetails;
          const currentCount = res.data.data.filter(s => s.status === 'active').length;
          setPlanInfo({
            maxServices: plan.maxServices,
            currentCount,
            remaining: plan.maxServices === Infinity ? '∞' : plan.maxServices - currentCount,
          });
        }
      } catch (err) {
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [selectedBusinessId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await apiClient.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      toast.success('Service deleted');
      // Update remaining count
      setPlanInfo(prev => ({
        ...prev,
        currentCount: prev.currentCount - 1,
        remaining: prev.maxServices === Infinity ? '∞' : prev.maxServices - (prev.currentCount - 1),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
        <p className="mt-1 text-sm text-gray-500">Create a business first to add services.</p>
        <Link to="/business/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
          Add Business
        </Link>
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

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : services.length === 0 ? (
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
                      {svc.status}
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
                      onClick={() => handleDelete(svc._id)}
                      className="text-red-600 hover:text-red-900"
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

export default ServiceList;