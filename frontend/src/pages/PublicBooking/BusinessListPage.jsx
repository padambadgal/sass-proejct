import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Store, Search, ChevronRight, Phone, MapPin, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/public/businesses');
        setBusinesses(res.data.data);
        setFilteredBusinesses(res.data.data);
      } catch {
        toast.error('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  // Search/filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBusinesses(businesses);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = businesses.filter((biz) => {
      const name = biz.name?.toLowerCase() || '';
      const desc = biz.description?.toLowerCase() || '';
      const phone = biz.phone || '';
      const city = biz.address?.city?.toLowerCase() || '';
      const state = biz.address?.state?.toLowerCase() || '';
      const country = biz.address?.country?.toLowerCase() || '';
      return name.includes(term) || desc.includes(term) || phone.includes(term) || city.includes(term) || state.includes(term) || country.includes(term);
    });
    setFilteredBusinesses(filtered);
  }, [searchTerm, businesses]);

  const handleSelect = (business) => {
    if (!isAuthenticated) {
      toast.error('Please login first to book an appointment.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSelectedBusiness(business);
  };

  const handleNext = () => {
    if (!isAuthenticated) {
      toast.error('Please login first to book an appointment.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!selectedBusiness) {
      toast.error('Please select a business');
      return;
    }
    navigate(`/book/${selectedBusiness.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50">
      {/* Top Bar */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Appoint<span className="text-gray-900">SaaS</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-bookings"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition flex items-center gap-1"
                >
                  <Calendar size={16} /> My Bookings
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    localStorage.removeItem('authToken');
                    window.location.href = '/book';
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  state={{ from: location.pathname }}
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-indigo-600 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Find a Business</h1>
          <p className="mt-3 text-lg text-indigo-100 max-w-2xl mx-auto">
            Browse our trusted partners and book your appointment in seconds.
          </p>
          <div className="mt-6 max-w-lg mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, service, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Store className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No businesses found</h3>
            <p className="text-gray-500">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBusinesses.map((biz) => (
                <div
                  key={biz._id}
                  onClick={() => handleSelect(biz)}
                  className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedBusiness?._id === biz._id
                      ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg'
                      : 'hover:-translate-y-1'
                  }`}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                      {biz.logo ? <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover rounded-full" /> : biz.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{biz.name}</h3>
                      {biz.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{biz.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        {biz.phone && <span className="flex items-center gap-1"><Phone size={14} /> {biz.phone}</span>}
                        {biz.address?.city && <span className="flex items-center gap-1"><MapPin size={14} /> {biz.address.city}</span>}
                      </div>
                    </div>
                    {selectedBusiness?._id === biz._id && (
                      <div className="flex-shrink-0"><div className="bg-indigo-600 text-white rounded-full p-1"><ChevronRight size={18} /></div></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedBusiness && (
              <div className="mt-8 bg-white rounded-xl shadow-md p-6 flex flex-wrap items-center justify-between gap-4 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {selectedBusiness.name.charAt(0).toUpperCase()}
                  </div>
                  <div><p className="font-medium text-gray-900">{selectedBusiness.name}</p><p className="text-sm text-gray-500">{selectedBusiness.phone}</p></div>
                </div>
                <button onClick={handleNext} className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                  Continue <ChevronRight size={18} className="ml-2" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessListPage;