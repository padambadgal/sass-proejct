import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../api/client';
import ImageUpload from '../../components/common/ImageUpload';
import toast from 'react-hot-toast';

// Helper: generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const businessSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  logo: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  timezone: z.string().optional(),
});

const BusinessForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      phone: '',
      email: '',
      logo: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      timezone: 'Asia/Kolkata',
    },
  });

  const name = watch('name');
  const logo = watch('logo');

  // Auto-generate slug from name when creating
  useEffect(() => {
    if (!id && name) {
      const generated = generateSlug(name);
      setValue('slug', generated, { shouldValidate: true });
    }
  }, [name, id, setValue]);

  // Fetch if editing
  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      apiClient
        .get(`/business/${id}`)
        .then((res) => {
          const data = res.data.data;
          reset({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            phone: data.phone || '',
            email: data.email || '',
            logo: data.logo || '',
            address: data.address || {
              street: '',
              city: '',
              state: '',
              country: '',
              postalCode: '',
            },
            timezone: data.timezone || 'Asia/Kolkata',
          });
        })
        .catch(() => toast.error('Failed to load business'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = logoFile ? new FormData() : data;
      if (logoFile) {
        Object.entries(data).forEach(([key, value]) => {
          payload.append(key, key === 'address' ? JSON.stringify(value) : value);
        });
        payload.append('logo', logoFile);
      }

      if (id) {
        await apiClient.patch(`/business/${id}`, payload, {
          headers: logoFile ? { 'Content-Type': undefined } : undefined,
        });
        toast.success('Business updated');
      } else {
        const res = await apiClient.post('/business', payload, {
          headers: logoFile ? { 'Content-Type': undefined } : undefined,
        });
        toast.success(
          res.data.message || 'Business created with default working hours!'
        );
      }
      navigate('/business');
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Business' : 'Add Business'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {id
            ? 'Update your business details'
            : 'Set up your business to start accepting bookings'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6"
      >
        {/* Logo + Name side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ImageUpload
              value={logo}
              onChange={(url) => setValue('logo', url, { shouldValidate: true })}
              onFileChange={setLogoFile}
              uploadUrl={null}
              uploadField="logo"
              responseImageField="logo"
              removeUrl={id ? `/business/${id}` : null}
              removeField="deleteLogo"
              removeMessage="Business logo removed"
              folder="business-logos"
              label="Business Logo"
              aspect="square"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Name *
              </label>
              <input
                {...register('name')}
                placeholder="e.g. Glow Salon & Spa"
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug (URL identifier) *
                {!id && (
                  <span className="text-xs text-gray-400 ml-2">
                    (auto-generated from name)
                  </span>
                )}
              </label>
              <input
                {...register('slug')}
                readOnly={!!id}
                className={`mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  id ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.slug.message}
                </p>
              )}
              {!id && (
                <p className="text-xs text-gray-400 mt-1">
                  Your public booking URL:{' '}
                  <span className="font-mono text-indigo-600">
                    /book/your-slug
                  </span>
                </p>
              )}
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
            placeholder="Tell your customers what you offer..."
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              {...register('phone')}
              placeholder="+91 98765 43210"
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="hello@business.com"
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              {...register('address.street')}
              placeholder="Street"
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <input
              {...register('address.city')}
              placeholder="City"
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <input
              {...register('address.state')}
              placeholder="State"
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <input
              {...register('address.country')}
              placeholder="Country"
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <input
              {...register('address.postalCode')}
              placeholder="Postal Code"
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition md:col-span-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            {...register('timezone')}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (UTC +5:30)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Australia/Sydney">Australia/Sydney</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/business')}
            className="px-4 py-2.5 border border-gray-300 cursor-pointer rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 text-white cursor-pointer rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : id ? 'Update Business' : 'Create Business'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessForm;