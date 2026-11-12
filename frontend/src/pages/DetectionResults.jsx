import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, FileText, Upload, ExternalLink, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { detectionService } from '../services/detectionService';
import { RiskBadge } from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const riskGradient = {
  LOW:      { ring: '#22C55E', bg: 'from-green-500/10',  text: 'text-green-400' },
  MEDIUM:   { ring: '#F59E0B', bg: 'from-yellow-500/10', text: 'text-yellow-400' },
  HIGH:     { ring: '#EF4444', bg: 'from-red-500/10',    text: 'text-red-400' },
  CRITICAL: { ring: '#7C3AED', bg: 'from-purple-500/10', text: 'text-purple-400' },
};

function RiskMeter({ score, level }) {
  const cfg = riskGradient[level] || riskGradient.LOW;
  const circumference = 2 * Math.PI * 54;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1E3A5F" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={cfg.ring} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${cfg.text}`}>{score}</span>
          <span className="text-vx-muted text-xs">/100</span>
        </div>
      </div>
      <RiskBadge level={level} />
    </div>
  );
}

function IndicatorRow({ indicator }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-xl border p-4 transition-all ${indicator.detected ? 'border-red-500/20 bg-red-500/5' : 'border-vx-border bg-vx-secondary/30'}`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          {indicator.detected
            ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            : <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
          <div>
            <p className="text-vx-text text-sm font-medium">{indicator.name}</p>
            <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
              indicator.category === 'network' ? 'bg-blue-500/15 text-blue-400' :
              indicator.category === 'activity' ? 'bg-yellow-500/15 text-yellow-400' :
              indicator.category === 'content' ? 'bg-purple-500/15 text-purple-400' :
              indicator.category === 'metadata' ? 'bg-orange-500/15 text-orange-400' :
              'bg-vx-secondary text-vx-muted'
            }`}>{indicator.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {indicator.detected && <span className="text-sm font-bold text-red-400">+{indicator.score} pts</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-vx-muted" /> : <ChevronDown className="w-4 h-4 text-vx-muted" />}
        </div>
      </div>
      {expanded && (
        <p className="mt-3 text-vx-muted text-sm border-t border-vx-border pt-3">{indicator.reason}</p>
      )}
    </div>
  );
}

export default function DetectionResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" message="Loading analysis result..." /></div>;
  if (error) return (
    <div className="max-w-2xl mx-auto">
      <div className="card flex flex-col items-center py-12 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-vx-text font-semibold">Could not load detection result</p>
        <p className="text-vx-muted text-sm">{error}</p>
        <button onClick={() => navigate('/history')} className="btn-primary">View History</button>
      </div>
    </div>
  );

  const { riskScore, riskLevel, confidenceScore, indicators, suspiciousPatterns, recommendation, detectionMethod, mlPrediction, profile, analyzedBy, createdAt } = detection;
  const detectedCount = indicators?.filter(i => i.detected).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-vx-muted hover:text-vx-text text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Disclaimer */}
      <div className="flex gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-400 text-xs">
          <strong>Important:</strong> This analysis is based on automated indicator checks and must not be treated as proof that an account is fake or criminal.
          Human verification and official review are required before any action is taken.
        </p>
      </div>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <RiskMeter score={riskScore} level={riskLevel} />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="text-xl font-bold text-vx-text">@{profile?.username}</h2>
              <span className="badge bg-vx-secondary text-vx-muted capitalize">{profile?.platform}</span>
              {mlPrediction?.available && <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/20">ML Enhanced</span>}
            </div>
            {profile?.displayName && <p className="text-vx-muted text-sm mb-3">{profile.displayName}</p>}

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div><span className="text-vx-muted">Confidence:</span> <span className="text-vx-text font-semibold ml-1">{confidenceScore}%</span></div>
              <div><span className="text-vx-muted">Method:</span> <span className="text-vx-text font-semibold ml-1 capitalize">{detectionMethod?.replace('_', ' ')}</span></div>
              <div><span className="text-vx-muted">Flags found:</span> <span className="text-red-400 font-semibold ml-1">{detectedCount} of {indicators?.length}</span></div>
              <div><span className="text-vx-muted">Analyzed:</span> <span className="text-vx-text ml-1">{new Date(createdAt).toLocaleString()}</span></div>
            </div>

            <div className="bg-vx-secondary/60 border border-vx-border rounded-xl px-4 py-3">
              <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-vx-text text-sm">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
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
        <div className="card">
          <h3 className="text-vx-text font-semibold mb-4">Suspicious Patterns Detected</h3>
          <div className="space-y-2">
            {suspiciousPatterns.map((p, i) => (
              <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                p.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
                p.severity === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-vx-secondary border-vx-border'
              }`}>
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
      <div className="card">
        <h3 className="text-vx-text font-semibold mb-4">Analysis Breakdown <span className="text-vx-muted text-sm font-normal">({indicators?.length} indicators)</span></h3>
        <div className="space-y-3">
          {indicators?.map((ind, i) => <IndicatorRow key={i} indicator={ind} />)}
        </div>
      </div>
    </div>
  );
}
