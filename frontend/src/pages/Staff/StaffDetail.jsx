import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { ArrowLeft, User, Mail, Phone, Briefcase, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await apiClient.get(`/staff/${id}`);
        setStaff(res.data.data);
      } catch (err) {
        toast.error('Failed to load staff details');
        navigate('/staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id, navigate]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!staff) return <div className="text-center py-8">Staff member not found</div>;

  return (
    <div>
      <button
        onClick={() => navigate('/staff')}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} /> Back to Staff
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{staff.name}</h1>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {staff.status}
            </span>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{staff.email || '—'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{staff.phone || '—'}</span>
          </div>
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Assigned Services</p>
              {staff.services && staff.services.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {staff.services.map((svc) => (
                    <li key={svc._id} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500" />
                      {svc.name} (₹{svc.price} · {svc.duration} min)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No services assigned.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to={`/staff/${staff._id}/edit`}
            state={{ businessId: staff.businessId }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Edit Staff
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;