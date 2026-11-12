import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('vexora_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vexora_token'));
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Verify token on app start
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.data.user);
            localStorage.setItem('vexora_user', JSON.stringify(res.data.user));
          } else {
            clearSession();
          }
        } catch {
          clearSession();
        }
      }
      setAuthChecked(true);
    };
    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for auth expiry events (from axios interceptor)
  useEffect(() => {
    const handleExpiry = () => clearSession();
    window.addEventListener('vexora:auth-expired', handleExpiry);
    return () => window.removeEventListener('vexora:auth-expired', handleExpiry);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vexora_token');
    localStorage.removeItem('vexora_user');
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.success) {
        const { user: userData, token: newToken } = res.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('vexora_token', newToken);
        localStorage.setItem('vexora_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try { await authService.logout(); } catch (_) {}
    clearSession();
    setLoading(false);
  }, [clearSession]);

  const value = {
    user,
    token,
    loading,
    authChecked,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
