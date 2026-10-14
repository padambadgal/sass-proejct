import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Check your inbox</h2>
          <p className="mt-2 text-gray-600 text-sm">
            If an account exists for <strong>{getValues('email')}</strong>, we've sent
            a password reset link. It expires in 15 minutes.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
          >
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Forgot password?</h2>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                {...register('email')}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Remembered it?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;