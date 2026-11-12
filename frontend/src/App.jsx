import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProfileAnalyzer from './pages/ProfileAnalyzer';
import DetectionResults from './pages/DetectionResults';
import ProfileHistory from './pages/ProfileHistory';
import Reports from './pages/Reports';
import Evidence from './pages/Evidence';
import CaseManagement from './pages/CaseManagement';
import Settings from './pages/Settings';

// Use HashRouter for Electron (file:// protocol) and BrowserRouter for web
const Router = window.electronAPI?.isElectron ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyzer" element={<ProfileAnalyzer />} />
              <Route path="/detection/:id" element={<DetectionResults />} />
              <Route path="/history" element={<ProfileHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/cases" element={<CaseManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
