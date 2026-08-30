import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { Store, ChevronRight, Phone, MapPin, Loader2, Sparkles, Star, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { Search } from "lucide-react";

const BusinessListPage = () => {
  const navigate = useNavigate();
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
        // Auto‑select the first business (optional)
        if (res.data.data.length > 0) {
          setSelectedBusiness(res.data.data[0]);
        }
      } catch {
        toast.error('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBusinesses(businesses);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = businesses.filter(
      (biz) =>
        biz.name.toLowerCase().includes(term) ||
        (biz.description && biz.description.toLowerCase().includes(term)) ||
        (biz.phone && biz.phone.includes(term))
    );
    setFilteredBusinesses(filtered);
  }, [searchTerm, businesses]);

  const handleSelect = (business) => {
    setSelectedBusiness(business);
  };

  const handleNext = () => {
    if (!selectedBusiness) {
      toast.error('Please select a business');
      return;
    }
    navigate(`/book/${selectedBusiness.slug}`);
  };

  // Get a random "premium" badge for some businesses
  const getBadge = (index) => {
    if (index === 0) return { label: '⭐ Featured', color: 'bg-amber-100 text-amber-800' };
    if (index % 3 === 0) return { label: '🏆 Top Rated', color: 'bg-blue-100 text-blue-800' };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section – Luxury feel */}
      <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white py-16 px-4 overflow-hidden">
        {/* Decorative overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtMy4zMTQgMC02IDIuNjg2LTYgNnMyLjY4NiA2IDYgNiA2LTIuNjg2IDYtNi0yLjY4Ni02LTYtNnoiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+')] bg-repeat"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-indigo-100 mb-4">
            <Sparkles size={16} className="text-amber-300" />
            <span>Premium Partners</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Discover <span className="text-amber-300">Exceptional</span> Services
          </h1>
          <p className="mt-4 text-xl text-indigo-200 max-w-2xl mx-auto">
            Handpicked businesses, ready to serve you with excellence.
          </p>
          {/* Search – glass effect */}
          <div className="mt-8 max-w-lg mx-auto relative">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 z-10"
              />              <input
                type="text"
                placeholder="Search by name, service, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-gray-100">
            <Store className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-800">No businesses found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or explore our full list.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBusinesses.map((biz, index) => {
                const badge = getBadge(index);
                return (
                  <div
                    key={biz._id}
                    onClick={() => handleSelect(biz)}
                    className={`group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${selectedBusiness?._id === biz._id
                        ? 'ring-2 ring-amber-500 ring-offset-4 shadow-2xl'
                        : 'border border-gray-100'
                      }`}
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4">
                        {/* Logo / Avatar */}
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-700 text-2xl font-bold shadow-inner">
                          {biz.logo ? (
                            <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            biz.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{biz.name}</h3>
                            {badge && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          {biz.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{biz.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            {biz.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={14} className="text-indigo-400" /> {biz.phone}
                              </span>
                            )}
                            {biz.address?.city && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} className="text-indigo-400" /> {biz.address.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Selection indicator */}
                      {selectedBusiness?._id === biz._id && (
                        <div className="mt-4 flex justify-end">
                          <div className="bg-amber-500 text-white rounded-full p-1.5 shadow-md">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Business – Premium CTA */}
            {selectedBusiness && (
              <div className="mt-10 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-3xl">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {selectedBusiness.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-xl text-gray-900">{selectedBusiness.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>Premium Partner</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="group inline-flex items-center px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Continue
                  <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer / subtle branding */}
      <div className="text-center py-6 text-sm text-gray-400 border-t border-gray-200">
        <span className="flex items-center justify-center gap-1">
          <Award size={14} className="text-amber-400" />
          <span>Curated with care – Book with confidence</span>
        </span>
      </div>
    </div>
  );
};

export default BusinessListPage;