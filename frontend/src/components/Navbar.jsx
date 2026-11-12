import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Platform Overview' },
  '/analyzer':  { title: 'Profile Analyzer', sub: 'Submit and analyze social media profiles' },
  '/history':   { title: 'Detection History', sub: 'All previous analysis records' },
  '/reports':   { title: 'Reports', sub: 'Manage and review investigation reports' },
  '/cases':     { title: 'Case Management', sub: 'Track and manage investigation cases' },
  '/evidence':  { title: 'Evidence Management', sub: 'Upload and manage supporting evidence' },
  '/settings':  { title: 'Settings', sub: 'Application preferences and account settings' },
};

export default function Navbar({ backendOnline }) {
  const location = useLocation();
  const { user } = useAuth();

  // Match /detection/:id
  const isDetection = location.pathname.startsWith('/detection/');
  const page = isDetection
    ? { title: 'Detection Result', sub: 'Profile analysis result' }
    : pageTitles[location.pathname] || { title: 'VEXORA', sub: '' };

  return (
    <header className="h-14 bg-vx-sidebar border-b border-vx-border flex items-center justify-between px-6 flex-shrink-0 drag-region">
      <div className="no-drag">
        <h1 className="text-vx-text font-semibold text-base">{page.title}</h1>
        {page.sub && <p className="text-vx-muted text-xs">{page.sub}</p>}
      </div>

      <div className="flex items-center gap-3 no-drag">
        {/* Backend status */}
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${backendOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {backendOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {backendOnline ? 'Backend Online' : 'Backend Offline'}
        </div>

        {/* Notifications placeholder */}
        <button className="relative w-8 h-8 rounded-lg bg-vx-secondary hover:bg-vx-border transition-colors flex items-center justify-center">
          <Bell className="w-4 h-4 text-vx-muted" />
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-vx-blue/20 border border-vx-blue/30 flex items-center justify-center">
          <span className="text-vx-blue text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  );
}
