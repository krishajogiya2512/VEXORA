import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-vx-bg flex items-center justify-center">
        <LoadingSpinner size="lg" message="Initializing VEXORA..." />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
