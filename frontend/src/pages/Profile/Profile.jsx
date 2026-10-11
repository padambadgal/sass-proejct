import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import ImageUpload from '../../components/common/ImageUpload';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Camera,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Too short').max(15, 'Too long').or(z.literal('')),
  avatar: z.string().optional(),
});

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const Profile = ({ showBack = false }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('general');
  const [show, setShow] = useState({ cur: false, nw: false, cf: false });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema), defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    }
  });

  const {
    register: regPw,
    handleSubmit: submitPw,
    formState: { errors: pwErr, isSubmitting: pwLoading },
    reset: resetPw,
  } = useForm({ resolver: zodResolver(pwSchema) });

  const avatar = watch('avatar');
  const name = watch('name');

  useEffect(() => {
    if (user) reset({ name: user.name, phone: user.phone, avatar: user.avatar });
  }, [user, reset]);


  const saveProfile = async (data) => {
    try {
      console.log('Form data before saving:', data);

      const response = await apiClient.patch('/profile', {
        name: data.name,
        phone: data.phone,
        avatar: data.avatar || '',
      });

      updateUser(response.data.data.user);

      toast.success('Profile updated');
    } catch (e) {
      console.error(
        'Profile update error:',
        e.response?.data || e.message
      );

      toast.error(e.response?.data?.message || 'Update failed');
    }
  };


  const savePassword = async (data) => {
    try {
      await apiClient.patch('/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed');
      resetPw();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  if (!user) return null;

  const initials = user.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="max-w-3xl mx-auto ">
      {showBack && (
        <button
          onClick={() => navigate('/book')}
          className="mb-4 flex items-center cursor-pointer gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back
        </button>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h1>

      {/* ===== HERO ===== */}
      <div className="relative rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-5 sm:p-6">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 w-40 h-40 rounded-full bg-fuchsia-400/20 blur-2xl" />

        <div className="relative flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 bg-white/20 backdrop-blur">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={() => setTab('general')}
              className=" absolute -bottom-1.5 -right-1.5 bg-white text-indigo-600 p-1.5 rounded-lg shadow-lg hover:scale-110 transition"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{user.name}</h1>
            <p className="text-white/80 text-sm truncate">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-white text-[11px] px-2.5 py-1 rounded-full capitalize">
                <Shield size={11} /> {user.role}
              </span>
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-white text-[11px] px-2.5 py-1 rounded-full">
                <Sparkles size={11} /> {user.phone ? 'Verified' : 'Add phone'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2 mb-4 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
        {[
          { key: 'general', label: 'General', icon: <User size={15} /> },
          { key: 'security', label: 'Security', icon: <Lock size={15} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex cursor-pointer items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition ${tab === t.key
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
              : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== GENERAL ===== */}
      {tab === 'general' && (
        <form onSubmit={handleSubmit(saveProfile)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-full sm:w-40 flex-shrink-0">
              <ImageUpload
                value={avatar}                       // watched form value
                onChange={(url) =>
                  setValue('avatar', url, { shouldDirty: true, shouldValidate: true })
                }
                onUploaded={(updatedUser) => {
                  // refresh the AuthContext so the hero avatar updates instantly
                  if (updatedUser) updateUser(updatedUser);
                }}
                label=""
                aspect="square"
              />
            </div>

            <div className="flex-1 space-y-3">
              <Input
                label="Full Name"
                icon={<User size={14} />}
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email"
                icon={<Mail size={14} />}
                value={user.email}
                disabled
              />
              <Input
                label="Phone"
                icon={<Phone size={14} />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => reset({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' })}
              className="px-4 cursor-pointer py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              <Save size={15} /> {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* ===== SECURITY ===== */}
      {tab === 'security' && (
        <form onSubmit={submitPw(savePassword)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4 max-w-md">
          <PwField
            label="Current Password"
            show={show.cur}
            toggle={() => setShow((s) => ({ ...s, cur: !s.cur }))}
            error={pwErr.currentPassword?.message}
            {...regPw('currentPassword')}
          />
          <PwField
            label="New Password"
            show={show.nw}
            toggle={() => setShow((s) => ({ ...s, nw: !s.nw }))}
            error={pwErr.newPassword?.message}
            {...regPw('newPassword')}
          />
          <PwField
            label="Confirm Password"
            show={show.cf}
            toggle={() => setShow((s) => ({ ...s, cf: !s.cf }))}
            error={pwErr.confirmPassword?.message}
            {...regPw('confirmPassword')}
          />

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              <Lock size={15} /> {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ===== Small components =====
const inputCls =
  'w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition';

const Input = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      )}
      <input {...props} className={`${inputCls} ${props.disabled ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} />
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const PwField = ({ label, show, toggle, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`${inputCls} pr-10`}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600"
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default Profile;