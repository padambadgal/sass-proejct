import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
});

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const businessId = location.state?.businessId || '';

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', description: '', price: 0, duration: 30 },
  });

  // If editing, fetch service data
  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      apiClient.get(`/services/${id}`)
        .then(res => {
          const data = res.data.data;
          reset({
            name: data.name || '',
            description: data.description || '',
            price: data.price || 0,
            duration: data.duration || 30,
          });
        })
        .catch(() => toast.error('Failed to load service'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (id) {
        await apiClient.patch(`/services/${id}`, data);
        toast.success('Service updated');
      } else {
        if (!businessId) {
          toast.error('No business selected. Please go back and select a business.');
          return;
        }
        await apiClient.post('/services', { ...data, businessId });
        toast.success('Service created');
      }
      navigate('/services');
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="text-center py-8">Loading...</div>;
  if (!businessId && !id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No business selected. Please go back and select a business.</p>
        <button onClick={() => navigate('/services')} className="mt-4 text-indigo-600">Back to Services</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Service' : 'Add Service'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Service Name *</label>
          <input
            {...register('name')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (₹) *</label>
            <input
              {...register('price')}
              type="number"
              step="0.01"
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes) *</label>
            <input
              {...register('duration')}
              type="number"
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/services')}
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

export default ServiceForm;