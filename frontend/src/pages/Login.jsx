import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm]               = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email)    errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message || 'Login failed');
    }
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [field]: '' }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-vx-bg flex items-center justify-center p-4 relative overflow-hidden drag-region">

      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,77,31,0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,77,31,0.25) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />
      {/* Radial glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-vx-accent/[0.04] blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-[360px] no-drag"
      >

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-vx-accent to-vx-accent-d shadow-accent items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-vx-invert" />
          </div>
          <h1 className="text-2xl font-bold text-vx-text tracking-tight">VEXORA</h1>
          <p className="text-vx-muted text-sm mt-1 tracking-widest uppercase text-[10px] font-semibold">
            Detect · Analyze · Protect
          </p>
        </div>

        {/* Login card */}
        <div className="bg-vx-card border border-vx-border rounded-2xl p-7 shadow-card-lg bg-[linear-gradient(135deg,rgba(255,255,255,0.025)_0%,transparent_60%)]">

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3.5 h-3.5 text-vx-muted" />
              <h2 className="text-vx-text font-semibold text-[15px]">Secure Sign In</h2>
            </div>
            <p className="text-vx-muted text-xs pl-5">Authorized personnel only</p>
          </div>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-3.5 py-3 mb-5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className={`input ${fieldErrors.email ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' : ''}`}
                placeholder="analyst@vexora.gov"
                value={form.email}
                onChange={handleChange('email')}
                autoComplete="email"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${fieldErrors.password ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vx-muted hover:text-vx-text transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                : 'Sign In to VEXORA'
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-vx-muted text-[11px] tracking-wide">
            VEXORA Intelligence Platform · Trust & Safety Division
          </p>
          <p className="text-vx-muted/50 text-[10px]">
            Restricted access. Unauthorized use is prohibited.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
