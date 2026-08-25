import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { Store, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessListPage = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/public/businesses');
        setBusinesses(res.data.data);
      } catch {
        toast.error('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const handleNext = () => {
    if (!selectedBusiness) {
      toast.error('Please select a business');
      return;
    }
    navigate(`/book/${selectedBusiness.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Business</h1>
        {businesses.length === 0 ? (
          <p className="text-gray-500">No businesses available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((biz) => (
              <div
                key={biz._id}
                onClick={() => setSelectedBusiness(biz)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedBusiness?._id === biz._id
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Store className="h-8 w-8 text-indigo-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">{biz.name}</h3>
                    <p className="text-sm text-gray-500">{biz.phone}</p>
                  </div>
                </div>
                {biz.description && <p className="mt-2 text-sm text-gray-600">{biz.description}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selectedBusiness}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessListPage;