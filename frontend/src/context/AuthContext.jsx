import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndSubscription = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userRes = await apiClient.get('/auth/me');
        setUser(userRes.data.data);
        await refreshSubscription();
      } catch {
        localStorage.removeItem('authToken');
        setUser(null);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };
    loadUserAndSubscription();
  }, []);

  const refreshSubscription = async () => {
    try {
      const res = await apiClient.get('/subscriptions/me');
      setSubscription(res.data.data);
    } catch {
      setSubscription(null);
    }
  };

  const register = async (name, email, password, phone = '', role = 'owner') => {
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        phone,
        role,
      });
      const { data, token } = res.data;
      if (token) localStorage.setItem('authToken', token);
      setUser(data);
      await refreshSubscription();
      toast.success('Registration successful!');
      // console.log('Registration successful:', data);
      return { success: true, user: data };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return { success: false };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { data, token } = res.data;
      if (token) localStorage.setItem('authToken', token);
      setUser(data);
      await refreshSubscription();
      toast.success('Welcome back!');
      return { success: true, user: data };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    localStorage.removeItem('authToken');
    setUser(null);
    setSubscription(null);
    toast.success('Logged out');
  };

  const value = {
    user,
    subscription,
    loading,
    register,
    login,
    logout,
    refreshSubscription,
    isAuthenticated: !!user,
    hasActiveSubscription: subscription?.status === 'active',
    isOwner: user?.role === 'owner',
    isStaff: user?.role === 'staff',
    isCustomer: user?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);