import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});


const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = loginForm;

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') navigate('/book');
      else if (from) navigate(from);
      else if (user.role === 'owner') navigate('/dashboard');
      else navigate('/');
    }
  }, [isAuthenticated, user, navigate, from]);

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      if (result.user.role === 'customer') navigate('/book');
      else if (from) navigate(from);
      else if (result.user.role === 'owner') navigate('/dashboard');
      else navigate('/');
    }
  };


  const inputWrap =
    'appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition';

  const title = 'Welcome back';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-3">
            <LogIn className="h-7 w-7 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
            <p className="mt-2 text-sm text-gray-600">
              New here?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create an account
              </Link>
            </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              autoComplete="email"
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
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              {...register('password')}
              className={inputWrap}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-medium cursor-pointer text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex cursor-pointer justify-center py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;