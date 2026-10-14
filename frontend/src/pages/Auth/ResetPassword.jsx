import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const schema = z
  .object({
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState({ nw: false, cf: false });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ newPassword }) => {
    try {
      await apiClient.post(`/auth/reset-password/${token}`, { newPassword });
      toast.success('Password reset! You can log in now.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <ShieldCheck className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Set new password</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose a strong password you haven't used before.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'newPassword', label: 'New Password', showKey: 'nw' },
            { name: 'confirmPassword', label: 'Confirm Password', showKey: 'cf' },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={show[f.showKey] ? 'text' : 'password'}
                  {...register(f.name)}
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, [f.showKey]: !s[f.showKey] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600"
                  tabIndex={-1}
                >
                  {show[f.showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors[f.name] && (
                <p className="text-red-500 text-xs mt-1">{errors[f.name].message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;