import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  services: z.array(z.string()).optional(),
});

const StaffForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const businessId = location.state?.businessId || '';

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [services, setServices] = useState([]); // all active services
  const [selectedServices, setSelectedServices] = useState([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', email: '', phone: '', services: [] },
  });

  // Fetch services for the business
  useEffect(() => {
    if (!businessId) return;
    const fetchServices = async () => {
      try {
        const res = await apiClient.get(`/services?businessId=${businessId}`);
        setServices(res.data.data.filter(s => s.status === 'active'));
      } catch (err) {
        toast.error('Failed to load services');
      }
    };
    fetchServices();
  }, [businessId]);

  // If editing, fetch staff data
  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      apiClient.get(`/staff/${id}`)
        .then(res => {
          const data = res.data.data;
          setValue('name', data.name || '');
          setValue('email', data.email || '');
          setValue('phone', data.phone || '');
          // Set selected services (array of IDs)
          const serviceIds = data.services.map(s => s._id);
          setValue('services', serviceIds);
          setSelectedServices(serviceIds);
        })
        .catch(() => toast.error('Failed to load staff'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (id) {
        await apiClient.patch(`/staff/${id}`, data);
        toast.success('Staff updated');
      } else {
        if (!businessId) {
          toast.error('No business selected. Please go back.');
          return;
        }
        await apiClient.post('/staff', { ...data, businessId });
        toast.success('Staff added');
      }
      navigate('/staff');
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setSelectedServices(selected);
    setValue('services', selected);
  };

  if (fetchLoading) return <div className="text-center py-8">Loading...</div>;
  if (!businessId && !id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No business selected. Please go back and select a business.</p>
        <button onClick={() => navigate('/staff')} className="mt-4 text-indigo-600">Back to Staff</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Staff' : 'Add Staff'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            {...register('name')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone *</label>
          <input
            {...register('phone')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned Services</label>
          <select
            multiple
            value={selectedServices}
            onChange={handleServiceChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
          >
            {services.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;