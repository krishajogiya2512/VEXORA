import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, History,
  FileText, FolderOpen, Briefcase, Settings,
  LogOut, ChevronLeft, ChevronRight, Shield,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

// ── Nav structure ───────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Analyze',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/analyzer',  icon: Search,          label: 'Profile Analyzer' },
      { to: '/history',   icon: History,         label: 'Detection History' },
    ],
  },
  {
    label: 'Investigate',
    items: [
      { to: '/reports',  icon: FileText,   label: 'Reports' },
      { to: '/cases',    icon: Briefcase,  label: 'Case Management' },
      { to: '/evidence', icon: FolderOpen, label: 'Evidence' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const ROLE_STYLES = {
  ADMIN:   'text-purple-400 bg-purple-500/10',
  ANALYST: 'text-vx-accent bg-vx-accent/10',
  VIEWER:  'text-green-400 bg-green-500/10',
};

// ── Component ───────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.charAt(0).toUpperCase() || 'U';
  const roleCls  = ROLE_STYLES[user?.role] || 'text-vx-muted bg-vx-secondary';

  return (
    <>
      <aside
        className={`
          relative bg-vx-sidebar border-r border-vx-border flex flex-col h-screen
          transition-[width] duration-250 ease-out flex-shrink-0
          ${collapsed ? 'w-[60px]' : 'w-[220px]'}
        `}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div
          className={`
            flex items-center gap-3 border-b border-vx-border drag-region
            ${collapsed ? 'justify-center px-0 py-5' : 'px-4 py-5'}
          `}
        >
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-vx-accent flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-vx-invert" />
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden no-drag"
              >
                <div className="text-vx-text font-bold text-sm leading-tight whitespace-nowrap tracking-wide">
                  VEXORA
                </div>
                <div className="text-vx-muted text-[9px] whitespace-nowrap tracking-widest uppercase">
                  Detect · Analyze · Protect
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4 no-drag">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              {/* Group label — hidden when collapsed */}
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[9px] font-semibold text-vx-muted uppercase tracking-widest px-2 mb-1"
                  >
                    {label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label: itemLabel }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? itemLabel : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
                       transition-all duration-150 cursor-pointer border
                       ${collapsed ? 'justify-center' : ''}
                       ${isActive
                         ? 'text-vx-accent bg-vx-accent-s border-vx-accent/30 shadow-[0_0_12px_rgba(255,77,31,0.12)]'
                         : 'text-vx-muted hover:text-vx-text hover:bg-vx-secondary/80 border-transparent'
                       }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator bar */}
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-vx-accent"
                            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                          />
                        )}
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.18 }}
                              className="truncate overflow-hidden whitespace-nowrap"
                            >
                              {itemLabel}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="border-t border-vx-border p-2 space-y-1 no-drag">
          {/* User card */}
          <AnimatePresence initial={false}>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-vx-secondary/60 mb-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${roleCls}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-vx-text text-xs font-medium truncate">{user.name}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${roleCls.split(' ')[0]}`}>
                      {user.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout */}
          <button
            onClick={() => setShowLogout(true)}
            title="Logout"
            className={`
              flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium
              text-vx-muted hover:text-vx-danger hover:bg-red-500/8 transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-full py-2 rounded-lg text-vx-muted hover:text-vx-text hover:bg-vx-secondary transition-colors duration-150"
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>
      </aside>

      {/* Logout confirmation */}
      <ConfirmationModal
        isOpen={showLogout}
        title="Sign out"
        message="Are you sure you want to sign out of VEXORA?"
        confirmLabel="Sign out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}
