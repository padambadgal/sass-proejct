import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  const loadSubscription = async () => {
    try {
      const res = await apiClient.get('/subscriptions/me');
      setSubscription(res.data.data);
    } catch {
      setSubscription(null);
    }
  };

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data.data);
        await loadSubscription();
      } catch {
        localStorage.removeItem('token');
        setUser(null);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Register
  const register = async (name, email, password) => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, role: 'user' });
      localStorage.setItem('token', res.data.data.token);
      setUser(res.data.data);
      await loadSubscription();
      toast.success('Registration successful!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.data.token);
      setUser(res.data.data);
      await loadSubscription();
      toast.success('Welcome back!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
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
    loadSubscription,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
