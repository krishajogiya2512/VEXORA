import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PAGE_META = {
  '/dashboard': { title: 'Dashboard',          sub: 'Platform overview' },
  '/analyzer':  { title: 'Profile Analyzer',   sub: 'Submit and analyze social media profiles' },
  '/history':   { title: 'Detection History',  sub: 'All previous analysis records' },
  '/reports':   { title: 'Reports',            sub: 'Manage and review investigation reports' },
  '/cases':     { title: 'Case Management',    sub: 'Track and manage investigation cases' },
  '/evidence':  { title: 'Evidence',           sub: 'Upload and manage supporting evidence' },
  '/settings':  { title: 'Settings',           sub: 'Account preferences' },
};

const ROLE_STYLES = {
  ADMIN:   'text-purple-400 bg-purple-500/10 ring-purple-500/25',
  ANALYST: 'text-vx-accent bg-vx-accent/10 ring-vx-accent/25',
  VIEWER:  'text-green-400 bg-green-500/10 ring-green-500/25',
};

export default function Navbar({ backendOnline }) {
  const location = useLocation();
  const { user } = useAuth();

  const isDetection = location.pathname.startsWith('/detection/');
  const page = isDetection
    ? { title: 'Detection Result', sub: 'Profile analysis result' }
    : PAGE_META[location.pathname] || { title: 'VEXORA', sub: '' };

  const initials  = user?.name?.charAt(0).toUpperCase() || 'U';
  const roleCls   = ROLE_STYLES[user?.role] || 'text-vx-muted bg-vx-secondary ring-vx-border';

  return (
    <header className="h-13 bg-vx-sidebar border-b border-vx-border flex items-center justify-between px-5 flex-shrink-0 drag-region">
      {/* Page identity */}
      <div className="no-drag flex items-baseline gap-2.5 min-w-0">
        <h1 className="text-vx-text font-semibold text-[15px] leading-tight whitespace-nowrap">
          {page.title}
        </h1>
        {page.sub && (
          <span className="text-vx-muted text-xs hidden sm:block truncate">{page.sub}</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 no-drag flex-shrink-0">
        {/* Backend status pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1
            ${backendOnline
              ? 'bg-green-500/8 ring-green-500/20 text-green-400'
              : 'bg-red-500/8 ring-red-500/20 text-red-400'
            }`}
        >
          {backendOnline
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />
          }
          {backendOnline ? 'Online' : 'Offline'}
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="w-8 h-8 rounded-lg text-vx-muted hover:text-vx-text hover:bg-vx-secondary transition-colors flex items-center justify-center"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Avatar + role */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ring-1 ${roleCls}`}
          >
            {initials}
          </div>
          {user?.name && (
            <span className="text-vx-sub text-xs font-medium hidden md:block">{user.name}</span>
          )}
        </div>
      </div>
    </header>
  );
}
