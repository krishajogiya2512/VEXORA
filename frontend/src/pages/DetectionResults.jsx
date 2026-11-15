import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, XCircle, FileText, Upload,
  ExternalLink, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import { detectionService } from '../services/detectionService';
import { RiskBadge } from '../components/RiskBadge';
import { SkeletonCard } from '../components/ui/Skeleton';

// ── Risk config ───────────────────────────────────────────────
const RISK_CFG = {
  LOW:      { ring: '#22C55E', text: 'text-green-400' },
  MEDIUM:   { ring: '#EAB308', text: 'text-amber-400' },
  HIGH:     { ring: '#EF4444', text: 'text-red-400' },
  CRITICAL: { ring: '#A855F7', text: 'text-purple-400' },
};

const CAT_STYLE = {
  network:  'bg-sky-500/10 text-sky-400',
  activity: 'bg-amber-500/10 text-amber-400',
  content:  'bg-purple-500/10 text-purple-400',
  metadata: 'bg-vx-accent-s text-vx-accent',
};

// ── Risk gauge ────────────────────────────────────────────────
function RiskGauge({ score, level }) {
  const cfg = RISK_CFG[level] || RISK_CFG.LOW;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#202024" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={cfg.ring} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={circ - dash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-3xl font-bold ${cfg.text}`}>{score}</span>
          <span className="text-vx-muted text-[10px] font-mono">/100</span>
        </div>
      </div>
      <RiskBadge level={level} />
    </div>
  );
}

// ── Expandable indicator row ──────────────────────────────────
function IndicatorRow({ indicator }) {
  const [expanded, setExpanded] = useState(false);
  const catCls = CAT_STYLE[indicator.category] || 'bg-vx-secondary text-vx-muted';

  return (
    <div
      className={`rounded-lg border transition-colors ${
        indicator.detected
          ? 'border-red-500/20 bg-red-500/[0.04]'
          : 'border-vx-border/50 bg-vx-secondary/20'
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {indicator.detected
            ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          }
          <div className="min-w-0">
            <p className="text-vx-text text-sm font-medium truncate">{indicator.name}</p>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${catCls}`}>
              {indicator.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {indicator.detected && (
            <span className="font-mono text-xs font-bold text-red-400">+{indicator.score}</span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-vx-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-vx-muted" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t border-vx-border/50">
          <p className="text-vx-muted text-sm mt-2.5 leading-relaxed">{indicator.reason}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function DetectionResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detection, setDetection] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await detectionService.getDetection(id);
        if (res.success) setDetection(res.data.detection);
        else setError(res.message);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load detection result');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-5 w-16 bg-vx-secondary rounded" />
        <div className="grid grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-48" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-vx-card border border-vx-border rounded-2xl p-12 flex flex-col items-center gap-4 text-center shadow-card-lg">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-vx-text font-semibold">Could not load detection result</p>
          <p className="text-vx-muted text-sm">{error}</p>
          <button onClick={() => navigate('/history')} className="btn-primary">View History</button>
        </div>
      </div>
    );
  }

  const {
    riskScore, riskLevel, confidenceScore, indicators, suspiciousPatterns,
    recommendation, detectionMethod, mlPrediction, profile, createdAt,
  } = detection;
  const detectedCount = indicators?.filter(i => i.detected).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-vx-muted hover:text-vx-text text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Disclaimer */}
      <div className="flex gap-3 bg-yellow-500/[0.07] border border-yellow-500/20 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-300 text-xs leading-relaxed">
          <strong className="font-semibold">Important:</strong> This analysis is based on automated indicator checks and must not be treated as proof that an account is fake or criminal.
          Human verification and official review are required before any action is taken.
        </p>
      </div>

      {/* Header card */}
      <div className="bg-vx-card border border-vx-border rounded-2xl p-6 shadow-card-lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">
          <RiskGauge score={riskScore} level={riskLevel} />

          <div className="flex-1 w-full">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-vx-text">@{profile?.username}</h2>
              <span className="badge badge-pending capitalize">{profile?.platform}</span>
              {mlPrediction?.available && (
                <span className="badge bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">ML Enhanced</span>
              )}
            </div>
            {profile?.displayName && (
              <p className="text-vx-muted text-sm mb-4">{profile.displayName}</p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Confidence', value: `${confidenceScore}%`, mono: true },
                { label: 'Method', value: detectionMethod?.replace('_', ' '), mono: false },
                { label: 'Flags', value: `${detectedCount} / ${indicators?.length}`, mono: true, red: detectedCount > 0 },
                { label: 'Analyzed', value: new Date(createdAt).toLocaleDateString(), mono: false },
              ].map(({ label, value, mono, red }) => (
                <div key={label} className="bg-vx-secondary rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest mb-1">{label}</p>
                  <p className={`text-sm font-semibold capitalize ${mono ? 'font-mono' : ''} ${red ? 'text-red-400' : 'text-vx-text'}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className="bg-vx-secondary/60 border border-vx-border rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest mb-1.5">Recommendation</p>
              <p className="text-vx-text text-sm leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/reports')} className="btn-primary text-sm">
          <FileText className="w-4 h-4" /> Submit Report
        </button>
        <button onClick={() => navigate('/evidence')} className="btn-secondary text-sm">
          <Upload className="w-4 h-4" /> Add Evidence
        </button>
        {profile?.profileUrl && (
          <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            <ExternalLink className="w-4 h-4" /> View Profile
          </a>
        )}
      </div>

      {/* Suspicious patterns */}
      {suspiciousPatterns?.length > 0 && (
        <div className="bg-vx-card border border-vx-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-vx-border">
            <h3 className="text-sm font-semibold text-vx-text">Suspicious Patterns Detected</h3>
          </div>
          <div className="p-5 space-y-2">
            {suspiciousPatterns.map((p, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                  p.severity === 'high'   ? 'bg-red-500/5 border-red-500/20' :
                  p.severity === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  'bg-vx-secondary border-vx-border/50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  p.severity === 'high' ? 'text-red-400' : p.severity === 'medium' ? 'text-yellow-400' : 'text-vx-muted'
                }`} />
                <div>
                  <p className="text-vx-text text-sm font-medium">{p.pattern}</p>
                  <p className="text-vx-muted text-xs mt-0.5">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicators breakdown */}
      <div className="bg-vx-card border border-vx-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-vx-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-vx-text">Analysis Breakdown</h3>
          <span className="font-mono text-xs text-vx-muted">{indicators?.length} indicators</span>
        </div>
        <div className="p-5 space-y-2">
          {indicators?.map((ind, i) => <IndicatorRow key={i} indicator={ind} />)}
        </div>
      </div>
    </div>
  );
}
