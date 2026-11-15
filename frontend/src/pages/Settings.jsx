import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Wifi, WifiOff, LogOut,
  Save, Eye, EyeOff, AlertCircle, CheckCircle,
  Loader2, Shield, Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import api from '../services/api';

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ tag, title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-vx-card border border-vx-border rounded-xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-vx-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-vx-secondary border border-vx-border flex items-center justify-center text-vx-accent">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            {tag && (
              <span className="block text-[10px] font-semibold text-vx-muted uppercase tracking-widest mb-0.5">
                {tag}
              </span>
            )}
            <h2 className="text-vx-text font-semibold text-sm">{title}</h2>
            {subtitle && <p className="text-vx-muted text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

/* ── Inline alert ────────────────────────────────────────────────────────── */
function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    success: 'bg-green-500/10 border-green-500/25 text-green-400',
    error:   'bg-red-500/10   border-red-500/25   text-red-400',
  };
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-center gap-2.5 border rounded-lg px-3.5 py-2.5 text-xs ${styles[type]}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ── Password change form ─────────────────────────────────────────────────── */
function PasswordForm() {
  const [form, setForm]         = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow]         = useState({ current: false, newPw: false, confirm: false });
  const [loading, setLoading]   = useState(false);
  const [alert, setAlert]       = useState(null);

  const toggle = key => setShow(s => ({ ...s, [key]: !s[key] }));
  const set    = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (!form.current)         return 'Current password is required';
    if (form.newPw.length < 8) return 'New password must be at least 8 characters';
    if (form.newPw !== form.confirm) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) { setAlert({ type: 'error', message: err }); return; }
    setLoading(true);
    setAlert(null);
    try {
      const res = await authService.updatePassword(form.current, form.newPw);
      if (res.success) {
        setAlert({ type: 'success', message: 'Password updated successfully.' });
        setForm({ current: '', newPw: '', confirm: '' });
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, field }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          className="input pr-10 text-sm"
          value={form[field]}
          onChange={set(field)}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => toggle(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-vx-muted hover:text-vx-text transition-colors"
          tabIndex={-1}
          aria-label={show[field] ? 'Hide password' : 'Show password'}
        >
          {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Alert type={alert?.type} message={alert?.message} />
      <PasswordInput label="Current Password" field="current" />
      <PasswordInput label="New Password" field="newPw" />
      <PasswordInput label="Confirm New Password" field="confirm" />

      {/* Password strength hint */}
      {form.newPw.length > 0 && (
        <div className="text-xs text-vx-muted space-y-1 pl-0.5">
          {[
            [form.newPw.length >= 8,   'At least 8 characters'],
            [/[A-Z]/.test(form.newPw), 'Contains uppercase letter'],
            [/[0-9]/.test(form.newPw), 'Contains a number'],
          ].map(([ok, label]) => (
            <div key={label} className={`flex items-center gap-1.5 ${ok ? 'text-green-400' : 'text-vx-muted'}`}>
              {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-vx-border" />}
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      <button type="submit" className="btn-primary text-sm mt-2" disabled={loading}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
        ) : (
          <><Save className="w-4 h-4" /> Update Password</>
        )}
      </button>
    </form>
  );
}

/* ── Backend connection check ─────────────────────────────────────────────── */
function ConnectionStatus() {
  const [status, setStatus]   = useState(null); // null | 'online' | 'offline'
  const [checking, setChecking] = useState(false);
  const [info, setInfo]       = useState(null);

  const check = async () => {
    setChecking(true);
    setStatus(null);
    setInfo(null);
    try {
      const { data } = await api.get('/health');
      setStatus('online');
      setInfo(data);
    } catch {
      setStatus('offline');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {status === 'online'  && <Wifi    className="w-4 h-4 text-green-400" />}
          {status === 'offline' && <WifiOff className="w-4 h-4 text-red-400" />}
          {!status              && <Wifi    className="w-4 h-4 text-vx-muted" />}
          <span className="text-vx-text text-sm font-medium">
            {status === 'online'  ? 'Backend is reachable' :
             status === 'offline' ? 'Backend is unreachable' :
             'Status unknown'}
          </span>
          {status === 'online'  && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
          {status === 'offline' && <span className="w-2 h-2 rounded-full bg-red-400" />}
        </div>
        <button onClick={check} disabled={checking} className="btn-secondary text-xs py-1.5 px-3">
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Test Connection'}
        </button>
      </div>

      {info && (
        <div className="bg-vx-secondary/50 border border-vx-border rounded-lg p-3 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between"><span className="text-vx-muted font-sans">Status</span><span className="text-green-400 font-semibold">{info.status}</span></div>
          <div className="flex justify-between"><span className="text-vx-muted font-sans">Environment</span><span className="text-vx-text">{info.environment || '—'}</span></div>
          <div className="flex justify-between"><span className="text-vx-muted font-sans">API Base</span><span className="text-vx-text">{import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</span></div>
          {info.timestamp && <div className="flex justify-between"><span className="text-vx-muted font-sans">Server Time</span><span className="text-vx-text">{new Date(info.timestamp).toLocaleString()}</span></div>}
        </div>
      )}

      {status === 'offline' && (
        <Alert type="error" message="Cannot connect to the VEXORA backend. Make sure the server is running on port 5000." />
      )}
    </div>
  );
}

/* ── About panel ─────────────────────────────────────────────────────────── */
function AboutPanel() {
  const isElectron = !!window.electronAPI?.isElectron;
  return (
    <div className="space-y-4">
      <div className="bg-vx-secondary/40 border border-vx-border rounded-lg divide-y divide-vx-border text-xs">
        {[
          ['Application',  'VEXORA'],
          ['Version',      '1.0.0'],
          ['Platform',     isElectron ? 'Desktop (Electron)' : 'Web Browser'],
          ['Purpose',      'AI-powered Fake Social Media Account Detection'],
          ['Authority',    'Indo-Tibetan Border Police (ITBP), Ministry of Home Affairs'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2.5">
            <span className="text-vx-muted font-medium">{k}</span>
            <span className="text-vx-text font-medium text-right max-w-xs">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2.5 bg-vx-secondary/30 border border-vx-border rounded-lg px-4 py-3">
        <Info className="w-4 h-4 text-vx-accent flex-shrink-0 mt-0.5" />
        <p className="text-vx-muted text-xs leading-relaxed">
          VEXORA is an authorized investigative tool. All analysis results are based on publicly
          available metadata and automated indicators. Human review is required before any official
          action is taken. Unauthorized use is strictly prohibited.
        </p>
      </div>
    </div>
  );
}

/* ── Main Settings page ───────────────────────────────────────────────────── */
export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleStyles = {
    ADMIN:   'text-purple-400 bg-purple-500/12 ring-purple-500/25',
    ANALYST: 'text-vx-accent bg-vx-accent/12 ring-vx-accent/25',
    VIEWER:  'text-green-400 bg-green-500/12 ring-green-500/25',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Account profile card */}
      <Section tag="Account" title="User Profile" subtitle="Your active analyst credentials" icon={User}>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-vx-accent to-vx-accent-d shadow-accent flex items-center justify-center flex-shrink-0">
            <span className="text-vx-invert text-xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-vx-text font-semibold text-base">{user?.name || '—'}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold ring-1 uppercase ${roleStyles[user?.role] || 'text-vx-muted bg-vx-secondary ring-vx-border'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {user?.role}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-green-500/12 text-green-400 ring-1 ring-green-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Active
              </span>
            </div>
            <p className="text-vx-muted text-xs mt-1 font-mono">{user?.email || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bg-vx-secondary/50 border border-vx-border rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-wider block">Last Login</span>
            <p className="text-vx-text text-xs mt-1 font-mono">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div className="bg-vx-secondary/50 border border-vx-border rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-wider block">Account Created</span>
            <p className="text-vx-text text-xs mt-1 font-mono">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </Section>

      {/* Change password */}
      <Section tag="Security" title="Change Password" subtitle="Update your account credentials" icon={Lock}>
        <PasswordForm />
      </Section>

      {/* Backend connection */}
      <Section tag="System" title="Backend Connection" subtitle="Verify live connectivity to the API service" icon={Wifi}>
        <ConnectionStatus />
      </Section>

      {/* About */}
      <Section tag="About" title="System Information" subtitle="Platform metadata and compliance disclaimer" icon={Info}>
        <AboutPanel />
      </Section>

      {/* Sign Out */}
      <div className="bg-vx-card border border-red-500/20 rounded-xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-red-400/80 uppercase tracking-widest block mb-0.5">Session</span>
            <h3 className="text-vx-text font-semibold text-sm">Sign Out</h3>
            <p className="text-vx-muted text-xs mt-0.5">End your current session and return to the login screen.</p>
          </div>
          <button onClick={handleLogout} className="btn-danger text-xs py-2 px-4">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
}
