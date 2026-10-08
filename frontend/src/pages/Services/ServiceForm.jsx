import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../api/client';
import ImageUpload from '../../components/common/ImageUpload';
import toast from 'react-hot-toast';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  image: z.string().optional(),
});

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const businessId = location.state?.businessId || '';

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 30,
      image: '',
    },
  });

  const image = watch('image');

  // Fetch service data if editing
  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      apiClient
        .get(`/services/${id}`)
        .then((res) => {
          const data = res.data.data;
          reset({
            name: data.name || '',
            description: data.description || '',
            price: data.price || 0,
            duration: data.duration || 30,
            image: data.image || '',
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
          toast.error('No business selected. Please go back.');
          return;
        }
        await apiClient.post('/services', { ...data, businessId });
        toast.success('Service created');
      }
      navigate('/services');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!businessId && !id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No business selected. Please go back and select a business.
        </p>
        <button
          onClick={() => navigate('/services')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Service' : 'Add Service'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {id
            ? 'Update your service details'
            : 'Add a new service offering for your customers'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6"
      >
        {/* Image + Basics layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 ">
            <ImageUpload
              value={image}
              onChange={(url) => setValue('image', url, { shouldValidate: true })}
              folder="service-images"
              label="Service Image"
              aspect="square"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Service Name *
              </label>
              <input
                {...register('name')}
                placeholder="e.g. Haircut & Styling"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  {...register('price')}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (min) *
                </label>
                <input
                  {...register('duration')}
                  type="number"
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                {errors.duration && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.duration.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="What does this service include?"
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="px-4 py-2.5 border border-gray-300 cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 cursor-pointer text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : id ? 'Update Service' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;