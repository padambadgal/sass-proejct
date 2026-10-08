import React from 'react'
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowLeft, LockKeyholeOpen  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



const ChangePassword = () => {

  const navigate = useNavigate();

  const changePasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

  const changePasswordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async ({ email, newPassword }) => {
    try {
      const response = await apiClient.post('/auth/change-password', {
        email,
        newPassword,
      });
      toast.success(response.data.message);
      changePasswordForm.reset();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const inputWrap =
    'appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition';

  const title = 'Change your password';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-3">
            <LockKeyholeOpen className="h-7 w-7 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          <form
            className="space-y-4 mt-5"
            onSubmit={changePasswordForm.handleSubmit(onChangePassword)}
          >
            <p className="text-sm text-gray-600">
              Verify your account with your email and current password, then choose a new password.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email address"
                {...changePasswordForm.register('email')}
                className={inputWrap}
              />
              {changePasswordForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {changePasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            {/* <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                {...changePasswordForm.register('currentPassword')}
                className={inputWrap}
              />
              {changePasswordForm.formState.errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {changePasswordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div> */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                {...changePasswordForm.register('newPassword')}
                className={inputWrap}
              />
              {changePasswordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {changePasswordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                {...changePasswordForm.register('confirmPassword')}
                className={inputWrap}
              />
              {changePasswordForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {changePasswordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={changePasswordForm.formState.isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {changePasswordForm.formState.isSubmitting ? 'Changing password...' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword