import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import {
  LayoutDashboard, Search, ShieldCheck, History,
  FileText, FolderOpen, Briefcase, Settings,
  LogOut, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyzer',  icon: Search,          label: 'Profile Analyzer' },
  { to: '/history',   icon: History,         label: 'Detection History' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
  { to: '/cases',     icon: Briefcase,       label: 'Case Management' },
  { to: '/evidence',  icon: FolderOpen,      label: 'Evidence' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

const roleColors = { ADMIN: 'text-purple-400', ANALYST: 'text-blue-400', VIEWER: 'text-green-400' };

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <aside
        className={`bg-vx-sidebar border-r border-vx-border flex flex-col h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}
      >
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-5 border-b border-vx-border drag-region`}>
          <div className="w-8 h-8 rounded-lg bg-vx-blue flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3 no-drag">
              <div className="text-vx-text font-bold text-base leading-tight">VEXORA</div>
              <div className="text-vx-muted text-[10px]">Detect. Analyze. Protect.</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-vx-border p-2">
          {!collapsed && user && (
            <div className="px-2 py-2 mb-1 rounded-lg bg-vx-secondary/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-vx-blue/20 border border-vx-blue/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-vx-blue text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-vx-text text-xs font-medium truncate">{user.name}</p>
                  <p className={`text-[10px] font-semibold ${roleColors[user.role] || 'text-vx-muted'}`}>{user.role}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowLogout(true)}
            className={`nav-item nav-item-inactive w-full text-vx-danger/80 hover:text-vx-danger hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          <button
            onClick={onToggle}
            className="nav-item nav-item-inactive w-full mt-1 justify-center"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={showLogout}
        title="Logout"
        message="Are you sure you want to logout from VEXORA?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}
