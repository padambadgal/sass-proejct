import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data.data);
      } catch (err) {
        // Not logged in or token expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Register
  const register = async (name, email, password) => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      setUser(res.data.data);
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
      setUser(res.data.data);
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
      setUser(null);
      toast.success('Logged out');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);