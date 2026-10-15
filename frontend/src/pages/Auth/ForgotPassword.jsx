import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

// ---------- Schemas ----------
const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Only numbers allowed'),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================================
const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password, 4=success
  const [email, setEmail] = useState('');
  const [show, setShow] = useState({ nw: false, cf: false });
  const [resending, setResending] = useState(false);

  // Step 1 form
  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  // Step 2 form
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  // Step 3 form
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  // ---------- STEP 1 ----------
  const onSendCode = async ({ email: userEmail }) => {
    try {
      await apiClient.post('/auth/forgot-password', { email: userEmail });
      setEmail(userEmail);
      setStep(2);
      toast.success('Code sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    }
  };

  // ---------- STEP 2 ----------
  const onVerifyOtp = async ({ otp }) => {
    try {
      await apiClient.post('/auth/verify-otp', { email, otp });
      toast.success('Code verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('New code sent');
      otpForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  // ---------- STEP 3 ----------
  const onResetPassword = async ({ newPassword }) => {
    try {
      await apiClient.post('/auth/reset-password', { email, newPassword });
      toast.success('Password reset successful!');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  // ---------- Shared UI ----------
  const inputBase =
    'w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-white';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-10 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">

          {/* ============ STEP 1 — EMAIL ============ */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-3">
                  <Mail className="h-7 w-7 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Forgot your password?
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Enter your email and we'll send a 6-digit reset code.
                </p>
              </div>

              <form
                onSubmit={emailForm.handleSubmit(onSendCode)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...emailForm.register('email')}
                      className={inputBase}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                >
                  {emailForm.formState.isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Send reset code'
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-500">
                Remembered it?{' '}
                <Link
                  to="/login"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Back to login
                </Link>
              </p>
            </>
          )}

          {/* ============ STEP 2 — OTP ============ */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-3">
                  <KeyRound className="h-7 w-7 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Enter verification code
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  We sent a 6-digit code to{' '}
                  <strong className="text-gray-700">{email}</strong>
                </p>
              </div>

              <form
                onSubmit={otpForm.handleSubmit(onVerifyOtp)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    {...otpForm.register('otp')}
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otpForm.formState.isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm shadow-indigo-500/20"
                >
                  {otpForm.formState.isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify code'
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-sm text-gray-500">
                Didn't get the code?{' '}
                <button
                  type="button"
                  onClick={onResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium disabled:opacity-50"
                >
                  {resending && <RefreshCw size={12} className="animate-spin" />}
                  Resend
                </button>
              </div>
            </>
          )}

          {/* ============ STEP 3 — NEW PASSWORD ============ */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
                  <ShieldCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Set a new password
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a strong password you haven't used before.
                </p>
              </div>

              <form
                onSubmit={passwordForm.handleSubmit(onResetPassword)}
                className="space-y-4"
                noValidate
              >
                {[
                  {
                    name: 'newPassword',
                    label: 'New Password',
                    showKey: 'nw',
                    autoComplete: 'new-password',
                  },
                  {
                    name: 'confirmPassword',
                    label: 'Confirm Password',
                    showKey: 'cf',
                    autoComplete: 'new-password',
                  },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={show[f.showKey] ? 'text' : 'password'}
                        autoComplete={f.autoComplete}
                        placeholder="••••••••"
                        {...passwordForm.register(f.name)}
                        className={`${inputBase} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShow((s) => ({ ...s, [f.showKey]: !s[f.showKey] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition"
                        tabIndex={-1}
                      >
                        {show[f.showKey] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors[f.name] && (
                      <p className="text-red-500 text-xs mt-1">
                        {passwordForm.formState.errors[f.name].message}
                      </p>
                    )}
                  </div>
                ))}

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 text-xs text-indigo-800 space-y-0.5">
                  <p className="font-medium mb-1">Password tips</p>
                  <p>• At least 6 characters</p>
                  <p>• Mix letters, numbers, and symbols</p>
                  <p>• Avoid names or common words</p>
                </div>

                <button
                  type="submit"
                  
                  disabled={passwordForm.formState.isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm shadow-indigo-500/20"
                >
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* ============ STEP 4 — SUCCESS ============ */}
          {/* {step === 4 && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Password reset!
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your password has been changed successfully. You can now log in
                with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition shadow-sm shadow-indigo-500/20"
              >
                Go to login
              </button>
            </div>
          )} */}
        </div>

        {/* Footer */}
        {step < 4 && (
          <p className="mt-4 text-center text-xs text-gray-400">
            Tip: the code expires in 10 minutes.
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;