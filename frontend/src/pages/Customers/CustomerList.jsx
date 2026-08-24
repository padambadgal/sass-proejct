import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Search, Eye, Edit, Trash2, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Fetch customers when business changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/customers?businessId=${selectedBusinessId}`);
        setCustomers(res.data.data);
        setFilteredCustomers(res.data.data);
      } catch (err) {
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [selectedBusinessId]);

  // Search/filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      c.phone.includes(term)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this customer?')) return;
    try {
      await apiClient.delete(`/customers/${id}`);
      setCustomers(prev => prev.map(c => c._id === id ? { ...c, status: 'inactive' } : c));
      toast.success('Customer deactivated');
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
        <p className="mt-1 text-sm text-gray-500">Create a business first to see customers.</p>
        <Link to="/business/new" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
          Add Business
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
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
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full md:w-96 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">
            {customers.length === 0 ? 'No customers yet.' : 'No customers match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.totalBookings || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/customers/${c._id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye size={18} className="inline" />
                    </Link>
                    <Link
                      to={`/customers/${c._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={c.status === 'inactive'}
                    >
                      <Trash2 size={18} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 text-sm text-gray-500 border-t">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;