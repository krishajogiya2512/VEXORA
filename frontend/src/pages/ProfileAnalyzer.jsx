import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, Loader2, AlertCircle, Info } from 'lucide-react';
import { profileService } from '../services/profileService';
import { detectionService } from '../services/detectionService';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'other', label: 'Other' },
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

export default function ProfileAnalyzer() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('form'); // form | submitting | analyzing | done
  const [statusMsg, setStatusMsg] = useState('');
  const [apiError, setApiError] = useState('');

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
    if (form.postsCount && (isNaN(form.postsCount) || Number(form.postsCount) < 0)) errs.postsCount = 'Must be a non-negative number';
    return errs;
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Build profile payload
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
        // Profile might already exist
        if (profileRes.errors?.[0]?.existingProfileId) {
          setStep('analyzing');
          setStatusMsg('Profile already exists. Running analysis...');
          const detRes = await detectionService.analyzeProfile(profileRes.errors[0].existingProfileId);
          if (detRes.success) {
            navigate(`/detection/${detRes.data.detectionId}`);
            return;
          }
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

  const handleClear = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setApiError('');
  };

  const isLoading = step === 'submitting' || step === 'analyzing';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Info banner */}
      <div className="flex gap-3 bg-vx-blue/10 border border-vx-blue/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-vx-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-vx-blue font-medium mb-0.5">Manual Profile Entry</p>
          <p className="text-vx-muted text-xs">
            Enter publicly available profile metadata. VEXORA does not access private accounts or scrape platforms without authorization.
            Analysis is based on supplied metadata only.
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="card flex flex-col items-center py-12 gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-vx-blue/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-vx-blue animate-spin" />
            <Search className="absolute inset-0 m-auto w-6 h-6 text-vx-blue" />
          </div>
          <div className="text-center">
            <p className="text-vx-text font-semibold">{statusMsg}</p>
            <p className="text-vx-muted text-sm mt-1">Please wait while VEXORA processes the profile</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleAnalyze} className="space-y-5" noValidate>
          {apiError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* Platform + Username */}
          <div className="card">
            <h3 className="text-vx-text font-semibold mb-4">Platform & Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Platform *</label>
                <select value={form.platform} onChange={setField('platform')} className={`input ${errors.platform ? 'border-red-500/50' : ''}`}>
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {errors.platform && <p className="text-red-400 text-xs mt-1">{errors.platform}</p>}
              </div>
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  className={`input ${errors.username ? 'border-red-500/50' : ''}`}
                  placeholder="e.g., john_doe_123"
                  value={form.username}
                  onChange={setField('username')}
                />
                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="label">Display Name</label>
                <input type="text" className="input" placeholder="e.g., John Doe" value={form.displayName} onChange={setField('displayName')} />
              </div>
              <div>
                <label className="label">Profile URL</label>
                <input type="url" className={`input ${errors.profileUrl ? 'border-red-500/50' : ''}`} placeholder="https://..." value={form.profileUrl} onChange={setField('profileUrl')} />
                {errors.profileUrl && <p className="text-red-400 text-xs mt-1">{errors.profileUrl}</p>}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="card">
            <h3 className="text-vx-text font-semibold mb-4">Account Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Followers</label>
                <input type="number" min="0" className={`input ${errors.followersCount ? 'border-red-500/50' : ''}`} placeholder="0" value={form.followersCount} onChange={setField('followersCount')} />
                {errors.followersCount && <p className="text-red-400 text-xs mt-1">{errors.followersCount}</p>}
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
          </div>

          {/* Bio + Activity */}
          <div className="card">
            <h3 className="text-vx-text font-semibold mb-4">Bio & Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Bio / Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Profile bio..." value={form.bio} onChange={setField('bio')} maxLength={500} />
                <p className="text-vx-muted text-xs mt-1 text-right">{form.bio.length}/500</p>
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
          </div>

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
      )}
    </div>
  );
}
