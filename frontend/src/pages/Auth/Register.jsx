import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { User, Mail, Lock, Phone, Store, UserRound } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'customer']).default('owner'),
});

const Register = () => {
  const { register: registerUser, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const params = new URLSearchParams(location.search);
  const planParam = params.get('plan');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: planParam ? 'owner' : 'customer' },
  });

  const role = watch('role');

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') navigate('/book');
      else if (user.role === 'staff') navigate('/bookings');
      else if (planParam) navigate(`/checkout?plan=${planParam}`);
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate, planParam]);

  const onSubmit = async (data) => {
    const result = await registerUser(
      data.name,
      data.email,
      data.password,
      data.phone,
      data.role
    );
    if (result.success) {
      if (result.user.role === 'customer') navigate('/book');
      else if (planParam) navigate(`/checkout?plan=${planParam}`);
      else if (data.role === 'owner') navigate('/pricing');
      else navigate('/book');
    }
  };

  const inputWrap =
    'appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => registerUser && setRole('owner')}
              onChange={() => {}}
              {...register('role')}
              className="hidden"
            />
            <label
              className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center transition ${
                role === 'owner'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <input
                type="radio"
                value="owner"
                {...register('role')}
                className="hidden"
              />
              <Store
                className={`h-6 w-6 mb-1 ${
                  role === 'owner' ? 'text-indigo-600' : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-medium">Business Owner</span>
            </label>
            <label
              className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center transition ${
                role === 'customer'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <input
                type="radio"
                value="customer"
                {...register('role')}
                className="hidden"
              />
              <UserRound
                className={`h-6 w-6 mb-1 ${
                  role === 'customer' ? 'text-indigo-600' : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-medium">Customer</span>
            </label>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Full Name"
              {...register('name')}
              className={inputWrap}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email address"
              {...register('email')}
              className={inputWrap}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone number"
              {...register('phone')}
              className={inputWrap}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              {...register('password')}
              className={inputWrap}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;