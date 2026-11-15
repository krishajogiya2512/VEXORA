import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, AlertCircle, Info, ScanLine, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileService } from '../services/profileService';
import { detectionService } from '../services/detectionService';

// ── Static data ──────────────────────────────────────────────
const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'twitter',   label: 'X (Twitter)' },
  { value: 'other',     label: 'Other' },
];
const POSTING_FREQ = [
  { value: '', label: 'Unknown' },
  { value: 'none', label: 'None' },
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
];
const INITIAL_FORM = {
  platform: '', username: '', displayName: '', profileUrl: '',
  accountCreationDate: '', followersCount: '', followingCount: '',
  postsCount: '', bio: '', hasProfilePicture: '', isVerified: '',
  postingFrequency: '', lastPostDate: '',
};

// ── Helpers ───────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-red-400 text-xs mt-1">{msg}</p>;
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-vx-card border border-vx-border rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-vx-border">
        <h3 className="text-sm font-semibold text-vx-text">{title}</h3>
        {description && <p className="text-xs text-vx-muted mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────
export default function ProfileAnalyzer() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [errors, setErrors]   = useState({});
  const [step, setStep]       = useState('form'); // form | submitting | analyzing | done
  const [statusMsg, setStatusMsg] = useState('');
  const [apiError, setApiError]   = useState('');

  const setField = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.platform) errs.platform = 'Platform is required';
    if (!form.username || form.username.trim().length < 2) errs.username = 'Username must be at least 2 characters';
    if (form.profileUrl && !/^https?:\/\/.+/.test(form.profileUrl)) errs.profileUrl = 'Must be a valid URL (https://...)';
    if (form.followersCount && (isNaN(form.followersCount) || Number(form.followersCount) < 0)) errs.followersCount = 'Must be a non-negative number';
    if (form.followingCount && (isNaN(form.followingCount) || Number(form.followingCount) < 0)) errs.followingCount = 'Must be a non-negative number';
    if (form.postsCount     && (isNaN(form.postsCount)     || Number(form.postsCount)     < 0)) errs.postsCount     = 'Must be a non-negative number';
    return errs;
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      platform: form.platform,
      username: form.username.trim(),
      displayName: form.displayName || undefined,
      profileUrl: form.profileUrl || undefined,
      accountCreationDate: form.accountCreationDate || undefined,
      followersCount: form.followersCount !== '' ? Number(form.followersCount) : undefined,
      followingCount: form.followingCount !== '' ? Number(form.followingCount) : undefined,
      postsCount: form.postsCount !== '' ? Number(form.postsCount) : undefined,
      bio: form.bio || undefined,
      hasProfilePicture: form.hasProfilePicture === '' ? undefined : form.hasProfilePicture === 'true',
      isVerified: form.isVerified === '' ? undefined : form.isVerified === 'true',
      accountActivity: {
        postingFrequency: form.postingFrequency || undefined,
        lastPostDate: form.lastPostDate || undefined,
      },
    };

    try {
      setStep('submitting');
      setStatusMsg('Submitting profile information...');
      const profileRes = await profileService.createProfile(payload);

      if (!profileRes.success) {
        if (profileRes.errors?.[0]?.existingProfileId) {
          setStep('analyzing');
          setStatusMsg('Profile already exists. Running analysis...');
          const detRes = await detectionService.analyzeProfile(profileRes.errors[0].existingProfileId);
          if (detRes.success) { navigate(`/detection/${detRes.data.detectionId}`); return; }
        }
        throw new Error(profileRes.message || 'Failed to submit profile');
      }

      const profileId = profileRes.data.profile._id;
      setStep('analyzing');
      setStatusMsg('Running hybrid detection analysis...');

      const detRes = await detectionService.analyzeProfile(profileId);
      if (!detRes.success) throw new Error(detRes.message || 'Analysis failed');

      setStep('done');
      navigate(`/detection/${detRes.data.detectionId}`);
    } catch (err) {
      setStep('form');
      setApiError(err.response?.data?.message || err.message || 'An error occurred. Please try again.');
    }
  };

  const handleClear = () => { setForm(INITIAL_FORM); setErrors({}); setApiError(''); };

  const isLoading = step === 'submitting' || step === 'analyzing';

  // ── Loading state ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-vx-card border border-vx-border rounded-2xl p-12 flex flex-col items-center gap-6 text-center shadow-card-lg">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-vx-accent/15" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-vx-accent animate-spin" />
            <ScanLine className="absolute inset-0 m-auto w-6 h-6 text-vx-accent" />
          </div>
          <div>
            <p className="text-vx-text font-semibold text-[15px]">{statusMsg}</p>
            <p className="text-vx-muted text-sm mt-1">Please wait while VEXORA processes the profile</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {['Submitting profile metadata', 'Running behavioral analysis', 'Scoring risk indicators'].map((s, i) => {
              const done = (step === 'analyzing' && i === 0) || (step === 'done');
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-vx-muted">
                  {done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-vx-accent flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border border-vx-border-s flex-shrink-0" />
                  }
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Info banner */}
      <div className="flex gap-3 bg-vx-accent/[0.06] border border-vx-accent/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-vx-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-vx-accent text-sm font-medium mb-0.5">Manual Profile Entry</p>
          <p className="text-vx-muted text-xs leading-relaxed">
            Enter publicly available profile metadata. VEXORA does not access private accounts or scrape platforms without authorization.
            Analysis is based on supplied metadata only.
          </p>
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{apiError}</p>
        </motion.div>
      )}

      <form onSubmit={handleAnalyze} className="space-y-5" noValidate>

        {/* Section 1 — Platform & Identity */}
        <SectionCard title="Platform & Identity" description="Core account identifiers">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Platform *</label>
              <select
                value={form.platform} onChange={setField('platform')}
                className={`input ${errors.platform ? 'border-red-500/50' : ''}`}
              >
                <option value="">Select platform…</option>
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <FieldError msg={errors.platform} />
            </div>
            <div>
              <label className="label">Username *</label>
              <input
                type="text"
                className={`input ${errors.username ? 'border-red-500/50' : ''}`}
                placeholder="e.g., john_doe_123"
                value={form.username} onChange={setField('username')}
              />
              <FieldError msg={errors.username} />
            </div>
            <div>
              <label className="label">Display Name</label>
              <input type="text" className="input" placeholder="e.g., John Doe" value={form.displayName} onChange={setField('displayName')} />
            </div>
            <div>
              <label className="label">Profile URL</label>
              <input
                type="url"
                className={`input ${errors.profileUrl ? 'border-red-500/50' : ''}`}
                placeholder="https://…"
                value={form.profileUrl} onChange={setField('profileUrl')}
              />
              <FieldError msg={errors.profileUrl} />
            </div>
          </div>
        </SectionCard>

        {/* Section 2 — Account Metrics */}
        <SectionCard title="Account Metrics" description="Quantitative profile signals">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Followers</label>
              <input type="number" min="0" className={`input ${errors.followersCount ? 'border-red-500/50' : ''}`} placeholder="0" value={form.followersCount} onChange={setField('followersCount')} />
              <FieldError msg={errors.followersCount} />
            </div>
            <div>
              <label className="label">Following</label>
              <input type="number" min="0" className={`input ${errors.followingCount ? 'border-red-500/50' : ''}`} placeholder="0" value={form.followingCount} onChange={setField('followingCount')} />
            </div>
            <div>
              <label className="label">Posts</label>
              <input type="number" min="0" className={`input ${errors.postsCount ? 'border-red-500/50' : ''}`} placeholder="0" value={form.postsCount} onChange={setField('postsCount')} />
            </div>
            <div>
              <label className="label">Account Creation Date</label>
              <input type="date" className="input" max={new Date().toISOString().split('T')[0]} value={form.accountCreationDate} onChange={setField('accountCreationDate')} />
            </div>
            <div>
              <label className="label">Profile Picture</label>
              <select className="input" value={form.hasProfilePicture} onChange={setField('hasProfilePicture')}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="label">Verified</label>
              <select className="input" value={form.isVerified} onChange={setField('isVerified')}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Section 3 — Bio & Activity */}
        <SectionCard title="Bio & Activity" description="Behavioral and content signals">
          <div className="space-y-4">
            <div>
              <label className="label">Bio / Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Profile bio or description…" value={form.bio} onChange={setField('bio')} maxLength={500} />
              <p className="text-vx-muted text-[11px] mt-1 text-right font-mono">{form.bio.length}/500</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Posting Frequency</label>
                <select className="input" value={form.postingFrequency} onChange={setField('postingFrequency')}>
                  {POSTING_FREQ.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Last Post Date</label>
                <input type="date" className="input" max={new Date().toISOString().split('T')[0]} value={form.lastPostDate} onChange={setField('lastPostDate')} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={handleClear} className="btn-secondary">
            <X className="w-4 h-4" /> Clear Form
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            <Search className="w-4 h-4" /> Analyze Profile
          </button>
        </div>
      </form>
    </div>
  );
}
