import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
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
    <div className="min-h-screen bg-vx-bg flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-vx-blue/15 border border-vx-blue/30 items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-vx-blue" />
          </div>
          <h1 className="text-2xl font-bold text-vx-text">VEXORA</h1>
          <p className="text-vx-muted text-sm mt-1">Detect. Analyze. Protect.</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-vx-text font-semibold text-lg mb-1">Sign In</h2>
          <p className="text-vx-muted text-xs mb-6">Authorized personnel only</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="label">Email Address</label>
              <input
                type="email"
                className={`input ${fieldErrors.email ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
                placeholder="officer@itbp.gov.in"
                value={form.email}
                onChange={handleChange('email')}
                autoComplete="email"
                disabled={loading}
              />
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="mb-6">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${fieldErrors.password ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</>
              ) : (
                'Sign In to VEXORA'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <p className="text-vx-muted text-xs">
            VEXORA · Indo-Tibetan Border Police · Ministry of Home Affairs
          </p>
          <p className="text-vx-muted/60 text-[10px] mt-1">
            Restricted access. Unauthorized use is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
