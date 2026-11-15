import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, Eye, FileText, X, Loader2,
  Clock, CheckCircle2, AlertTriangle, TrendingUp, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../services/reportService';
import { profileService } from '../services/profileService';
import { detectionService } from '../services/detectionService';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const STATUSES = ['', 'PENDING', 'UNDER_REVIEW', 'VERIFIED_SUSPICIOUS', 'INSUFFICIENT_EVIDENCE', 'ESCALATED', 'CLOSED'];
const SEVERITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ── Stats summary strip ──────────────────────────────────────
function StatsBar({ stats, activeStatus, onFilterStatus }) {
  const items = [
    { label: 'Total Reports',     value: stats?.total ?? 0,                             color: 'text-vx-text',   bg: 'bg-vx-secondary',      key: '',             icon: FileText },
    { label: 'Pending',           value: stats?.byStatus?.PENDING ?? 0,                 color: 'text-amber-400', bg: 'bg-amber-500/10',      key: 'PENDING',      icon: Clock },
    { label: 'Under Review',      value: stats?.byStatus?.UNDER_REVIEW ?? 0,             color: 'text-sky-400',   bg: 'bg-sky-500/10',        key: 'UNDER_REVIEW', icon: TrendingUp },
    { label: 'Resolved / Closed', value: stats?.byStatus?.CLOSED ?? 0,                   color: 'text-green-400', bg: 'bg-green-500/10',      key: 'CLOSED',       icon: CheckCircle2 },
    { label: 'High / Critical',   value: (stats?.bySeverity?.HIGH ?? 0) + (stats?.bySeverity?.CRITICAL ?? 0), color: 'text-red-400', bg: 'bg-red-500/10', key: '_highcritical', icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeStatus === item.key || (item.key === '' && !activeStatus);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onFilterStatus(item.key === '_highcritical' ? '' : item.key)}
            className={`
              bg-vx-card border rounded-xl p-4 text-left transition-all duration-150 cursor-pointer
              hover:border-vx-border-s hover:bg-vx-secondary/30
              ${isActive
                ? 'border-vx-accent/40 bg-vx-accent-s shadow-[0_0_12px_rgba(255,77,31,0.12)]'
                : 'border-vx-border'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest truncate">
                {item.label}
              </span>
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono tracking-tight ${item.color}`}>{item.value}</p>
          </button>
        );
      })}
    </div>
  );
}

// ── Create Report Modal ──────────────────────────────────────
function CreateReportModal({ onClose, onCreated }) {
  const [profiles, setProfiles]     = useState([]);
  const [form, setForm]             = useState({ profileId: '', detectionId: '', title: '', description: '', severity: 'MEDIUM' });
  const [detections, setDetections] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    profileService.getProfiles({ limit: 50, status: 'flagged,analyzed' })
      .then(r => { if (r.success) setProfiles(r.data); })
      .catch(() => {});
  }, []);

  const loadDetections = async (profileId) => {
    if (!profileId) return;
    try {
      const r = await detectionService.getDetections({ profileId, limit: 10 });
      if (r.success) setDetections(r.data || []);
    } catch {}
  };

  const handleProfileChange = (e) => {
    const pid = e.target.value;
    setForm(f => ({ ...f, profileId: pid, detectionId: '' }));
    loadDetections(pid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.profileId || !form.detectionId || !form.title || !form.description || !form.severity) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await reportService.createReport(form);
      if (res.success) {
        onCreated(res.data.report);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-drag">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative bg-vx-elevated border border-vx-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-card-lg"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-vx-border">
          <div>
            <span className="text-[10px] font-semibold text-vx-accent uppercase tracking-widest block mb-0.5">Investigation</span>
            <h3 className="text-vx-text font-semibold text-base">Submit New Report</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-vx-muted hover:text-vx-text hover:bg-vx-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-2.5 mb-5 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Target Profile *</label>
              <select className="input text-sm" value={form.profileId} onChange={handleProfileChange}>
                <option value="">Select a profile…</option>
                {profiles.map(p => (
                  <option key={p._id} value={p._id}>@{p.username} ({p.platform})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Detection Analysis *</label>
              <select
                className="input text-sm"
                value={form.detectionId}
                onChange={e => setForm(f => ({ ...f, detectionId: e.target.value }))}
                disabled={!form.profileId}
              >
                <option value="">Select detection analysis…</option>
                {detections.map(d => (
                  <option key={d._id} value={d._id}>
                    Score: {d.riskScore} ({d.riskLevel}) – {new Date(d.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {!form.profileId && <p className="text-vx-muted text-[11px] mt-1">Select a profile first</p>}
            </div>

            <div>
              <label className="label">Report Title *</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="Brief summary of the incident…"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={200}
              />
            </div>

            <div>
              <label className="label">Severity *</label>
              <select className="input text-sm" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                {SEVERITIES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Detailed Description *</label>
              <textarea
                className="input text-sm resize-none"
                rows={4}
                placeholder="Detailed evidence and rationale for suspicious activity…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                maxLength={2000}
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-vx-border">
              <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-4" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                ) : (
                  <><FileText className="w-3.5 h-3.5" /> Submit Report</>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Report Detail Modal ──────────────────────────────────────
function ReportDetailModal({ report, onClose, onStatusUpdate }) {
  const { user } = useAuth();
  const [note, setNote]       = useState('');
  const [status, setStatus]   = useState(report.status);
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const handleStatusUpdate = async () => {
    if (!status) return;
    setLoading(true);
    try {
      const res = await reportService.updateReportStatus(report._id, status, reason);
      if (res.success) onStatusUpdate(res.data.report);
    } catch {}
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!note.trim() || note.length < 5) return;
    setLoading(true);
    try {
      await reportService.addNote(report._id, note);
      setNote('');
    } catch {}
    setLoading(false);
  };

  const severityStyles = {
    CRITICAL: 'badge-critical',
    HIGH:     'badge-high',
    MEDIUM:   'badge-medium',
    LOW:      'badge-low',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-drag">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative bg-vx-elevated border border-vx-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-card-lg"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-vx-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-vx-accent text-sm font-semibold">{report.caseId}</span>
              <span className={`badge ${severityStyles[report.severity] || 'badge-pending'}`}>
                {report.severity}
              </span>
            </div>
            <h3 className="text-vx-text font-semibold text-base mt-1">{report.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-vx-muted hover:text-vx-text hover:bg-vx-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <StatusBadge status={report.status} />
            <span className="text-vx-muted ml-auto font-mono">
              Submitted by <strong className="text-vx-sub font-sans">{report.submittedBy?.name || 'Unknown'}</strong> on {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="bg-vx-secondary/40 border border-vx-border rounded-xl p-4">
            <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest block mb-1.5">
              Description
            </span>
            <p className="text-vx-text text-sm leading-relaxed">{report.description}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-vx-text uppercase tracking-wider">
                Investigation Notes
              </h4>
              <span className="font-mono text-2xs text-vx-muted">{report.analystNotes?.length || 0} total</span>
            </div>

            {report.analystNotes?.length === 0 ? (
              <p className="text-vx-muted text-xs py-2">No investigation notes recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {report.analystNotes?.map((n, i) => (
                  <div key={i} className="bg-vx-secondary/50 border border-vx-border rounded-lg px-3.5 py-2.5 text-xs">
                    <p className="text-vx-text leading-relaxed">{n.note}</p>
                    <p className="text-vx-muted text-[10px] mt-1 font-mono">
                      {n.addedBy?.name || 'Analyst'} · {new Date(n.addedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  className="input text-xs flex-1 py-2"
                  placeholder="Add note (minimum 5 characters)…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button
                  onClick={handleAddNote}
                  className="btn-secondary text-xs py-2 px-3.5 shrink-0"
                  disabled={loading || note.trim().length < 5}
                >
                  Add Note
                </button>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="border-t border-vx-border pt-4">
              <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest block mb-2">
                Update Status
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select className="input text-xs sm:w-48 py-2" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <input
                  type="text"
                  className="input text-xs flex-1 py-2"
                  placeholder="Reason for change (optional)…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
                <button
                  onClick={handleStatusUpdate}
                  className="btn-primary text-xs py-2 px-4 shrink-0"
                  disabled={loading}
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Reports Page ────────────────────────────────────────
export default function Reports() {
  const { user }       = useAuth();
  const location       = useLocation();
  const [data, setData]               = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [filters, setFilters]         = useState({
    status:   location.state?.filterStatus || '',
    severity: '',
    search:   '',
  });
  const [showCreate, setShowCreate]   = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (filters.status)   params.status   = filters.status;
      if (filters.severity) params.severity = filters.severity;
      const [listRes, statsRes] = await Promise.all([
        reportService.getReports(params),
        reportService.getStatistics(),
      ]);
      if (listRes.success) {
        setData(listRes.data);
        setTotalPages(listRes.pagination?.pages || 1);
      } else {
        setError(listRes.message || 'Failed to load reports');
      }
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to reports service');
    } finally {
      setLoading(false);
    }
  }, [page, filters.status, filters.severity]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = filters.search
    ? data.filter(r =>
        r.caseId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.title?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : data;

  const severityStyles = {
    CRITICAL: 'badge-critical',
    HIGH:     'badge-high',
    MEDIUM:   'badge-medium',
    LOW:      'badge-low',
  };

  const columns = [
    {
      key: 'caseId',
      label: 'Case ID',
      render: (v) => <span className="font-mono text-vx-accent text-sm font-semibold">{v}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      render: (v) => <p className="text-vx-text text-sm truncate max-w-xs font-medium">{v}</p>,
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (v) => <span className={`badge ${severityStyles[v] || 'badge-pending'}`}>{v}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      render: (v) => <span className="text-vx-muted text-xs">{v?.name || '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (v) => <span className="text-vx-muted text-xs font-mono">{new Date(v).toLocaleDateString()}</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setSelectedReport(row)}
          className="flex items-center gap-1 text-vx-accent hover:text-vx-accent-d text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  const hasActiveFilters = filters.status || filters.severity || filters.search;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* ── Stats Summary Strip ──────────────────────────────── */}
      <StatsBar
        stats={stats}
        activeStatus={filters.status}
        onFilterStatus={(s) => { setFilters(f => ({ ...f, status: f.status === s ? '' : s })); setPage(1); }}
      />

      {/* ── Error Banner ──────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchReports} className="btn-ghost text-xs py-1 px-2.5">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="bg-vx-card border border-vx-border rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vx-muted" />
          <input
            type="text"
            placeholder="Search case ID or title…"
            className="input pl-9 text-xs py-2"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Status filter */}
        <select
          className="input w-40 text-xs py-2"
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Severity filter */}
        <select
          className="input w-36 text-xs py-2"
          value={filters.severity}
          onChange={e => { setFilters(f => ({ ...f, severity: e.target.value })); setPage(1); }}
        >
          <option value="">All Severities</option>
          {SEVERITIES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={() => { setFilters({ status: '', severity: '', search: '' }); setPage(1); }}
            className="btn-ghost text-xs py-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        )}

        {/* Total count badge */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-semibold font-mono bg-vx-secondary border border-vx-border text-vx-muted">
          {filtered.length} {filtered.length === 1 ? 'report' : 'reports'}
        </span>

        {/* New Report CTA */}
        {(user?.role === 'ADMIN' || user?.role === 'ANALYST') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-2 ml-auto">
            <Plus className="w-3.5 h-3.5" /> New Report
          </button>
        )}
      </div>

      {/* ── Content: Loading Skeleton / Empty State / Table ──── */}
      {loading && !data.length ? (
        <div className="bg-vx-card border border-vx-border rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="space-y-2 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-vx-secondary/60 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : !loading && filtered.length === 0 ? (
        <div className="bg-vx-card border border-vx-border rounded-xl p-8 shadow-card">
          <EmptyState
            icon={FileText}
            title={hasActiveFilters ? "No matching reports" : "No reports filed yet"}
            description={
              hasActiveFilters
                ? "No reports match your current filter parameters. Try clearing your filters."
                : "Submit a new incident report when suspicious profiles or fake accounts are identified."
            }
            action={
              hasActiveFilters ? (
                <button
                  onClick={() => { setFilters({ status: '', severity: '', search: '' }); setPage(1); }}
                  className="btn-secondary text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
                </button>
              ) : (user?.role === 'ADMIN' || user?.role === 'ANALYST') ? (
                <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
                  <Plus className="w-3.5 h-3.5" /> File First Report
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyTitle="No reports found"
          emptyDescription="Submit a report when you encounter suspicious profiles."
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreateReportModal
            onClose={() => setShowCreate(false)}
            onCreated={() => fetchReports()}
          />
        )}
        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onStatusUpdate={() => {
              setSelectedReport(null);
              fetchReports();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
