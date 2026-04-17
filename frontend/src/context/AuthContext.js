import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    localStorage.setItem('access_token', response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      userData,
      { withCredentials: true }
    );
    return response.data;
  };

  const verifyOTP = async (email, otp) => {
    const response = await axios.post(
      `${API_URL}/api/auth/verify-otp`,
      { email, otp },
      { withCredentials: true }
    );
    localStorage.setItem('access_token', response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const resendOTP = async (email) => {
    const response = await axios.post(
      `${API_URL}/api/auth/resend-otp`,
      { email },
      { withCredentials: true }
    );
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.put(
      `${API_URL}/api/users/profile`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      }
    );
    setUser(prev => ({ ...prev, ...response.data }));
    return response.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOTP,
      resendOTP,
      logout,
      updateProfile,
      checkAuth,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
