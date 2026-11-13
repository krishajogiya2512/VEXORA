import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Monitor, Wifi, WifiOff, LogOut,
  Save, Eye, EyeOff, AlertCircle, CheckCircle,
  Loader2, Shield, Bell, Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import api from '../services/api';

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-vx-border">
        <div className="w-9 h-9 rounded-xl bg-vx-blue/15 border border-vx-blue/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-vx-blue" />
        </div>
        <div>
          <h2 className="text-vx-text font-semibold text-base">{title}</h2>
          {subtitle && <p className="text-vx-muted text-xs">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Inline alert ────────────────────────────────────────────────────────── */
function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error:   'bg-red-500/10   border-red-500/20   text-red-400',
  };
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {message}
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
          className="input pr-10"
          value={form[field]}
          onChange={set(field)}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => toggle(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-vx-muted hover:text-vx-text transition-colors"
          tabIndex={-1}
        >
          {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert type={alert?.type} message={alert?.message} />
      <PasswordInput label="Current Password" field="current" />
      <PasswordInput label="New Password" field="newPw" />
      <PasswordInput label="Confirm New Password" field="confirm" />

      {/* Password strength hint */}
      {form.newPw.length > 0 && (
        <div className="text-xs text-vx-muted space-y-0.5 pl-1">
          {[
            [form.newPw.length >= 8,          'At least 8 characters'],
            [/[A-Z]/.test(form.newPw),        'Contains uppercase letter'],
            [/[0-9]/.test(form.newPw),        'Contains a number'],
          ].map(([ok, label]) => (
            <div key={label} className={`flex items-center gap-1.5 ${ok ? 'text-green-400' : 'text-vx-muted'}`}>
              {ok ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-vx-border" />}
              {label}
            </div>
          ))}
        </div>
      )}

      <button type="submit" className="btn-primary text-sm" disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : <><Save className="w-4 h-4" /> Update Password</>}
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
        <div className="flex items-center gap-2">
          {status === 'online'  && <Wifi    className="w-4 h-4 text-green-400" />}
          {status === 'offline' && <WifiOff className="w-4 h-4 text-red-400" />}
          {!status              && <Wifi    className="w-4 h-4 text-vx-muted" />}
          <span className="text-vx-text text-sm">
            {status === 'online'  ? 'Backend is reachable' :
             status === 'offline' ? 'Backend is unreachable' :
             'Status unknown'}
          </span>
          {status === 'online'  && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
          {status === 'offline' && <span className="w-2 h-2 rounded-full bg-red-400" />}
        </div>
        <button onClick={check} disabled={checking} className="btn-secondary text-sm py-1.5 px-3">
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Test Connection'}
        </button>
      </div>

      {info && (
        <div className="bg-vx-secondary/60 border border-vx-border rounded-xl px-4 py-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-vx-muted">Status</span><span className="text-green-400 font-medium">{info.status}</span></div>
          <div className="flex justify-between"><span className="text-vx-muted">Environment</span><span className="text-vx-text">{info.environment || '—'}</span></div>
          <div className="flex justify-between"><span className="text-vx-muted">API Base</span><span className="text-vx-text font-mono">{import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</span></div>
          {info.timestamp && <div className="flex justify-between"><span className="text-vx-muted">Server Time</span><span className="text-vx-text">{new Date(info.timestamp).toLocaleString()}</span></div>}
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
      <div className="bg-vx-secondary/50 border border-vx-border rounded-xl px-5 py-4 space-y-2 text-sm">
        {[
          ['Application',  'VEXORA'],
          ['Version',      '1.0.0'],
          ['Platform',     isElectron ? 'Desktop (Electron)' : 'Web Browser'],
          ['Purpose',      'AI-powered Fake Social Media Account Detection'],
          ['Authority',    'Indo-Tibetan Border Police (ITBP), Ministry of Home Affairs'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-vx-muted">{k}</span>
            <span className="text-vx-text font-medium text-right max-w-xs">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 bg-vx-blue/10 border border-vx-blue/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-vx-blue flex-shrink-0 mt-0.5" />
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

  const roleColors = {
    ADMIN:   'text-purple-400 bg-purple-500/15 border-purple-500/20',
    ANALYST: 'text-blue-400   bg-blue-500/15   border-blue-500/20',
    VIEWER:  'text-green-400  bg-green-500/15  border-green-500/20',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account profile card */}
      <Section title="Account Profile" subtitle="Your VEXORA account details" icon={User}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-vx-blue/20 border border-vx-blue/30 flex items-center justify-center flex-shrink-0">
            <span className="text-vx-blue text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-vx-text font-semibold text-lg">{user?.name || '—'}</h3>
            <p className="text-vx-muted text-sm">{user?.email || '—'}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={`badge border ${roleColors[user?.role] || 'text-vx-muted'}`}>
                <Shield className="w-3 h-3 mr-1" />
                {user?.role}
              </span>
              <span className="badge bg-green-500/15 text-green-400 border border-green-500/20">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-vx-secondary/50 rounded-xl px-4 py-3">
            <p className="text-vx-muted text-xs">Last Login</p>
            <p className="text-vx-text text-sm mt-0.5">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div className="bg-vx-secondary/50 rounded-xl px-4 py-3">
            <p className="text-vx-muted text-xs">Account Created</p>
            <p className="text-vx-text text-sm mt-0.5">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </Section>

      {/* Change password */}
      <Section title="Change Password" subtitle="Update your account password" icon={Lock}>
        <PasswordForm />
      </Section>

      {/* Backend connection */}
      <Section title="Backend Connection" subtitle="Verify connectivity to the VEXORA API server" icon={Wifi}>
        <ConnectionStatus />
      </Section>

      {/* About */}
      <Section title="About VEXORA" subtitle="Application information and legal notice" icon={Info}>
        <AboutPanel />
      </Section>

      {/* Logout */}
      <div className="card border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-vx-text font-semibold">Sign Out</h3>
            <p className="text-vx-muted text-xs mt-0.5">End your current session and return to the login screen.</p>
          </div>
          <button onClick={handleLogout} className="btn-danger text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
