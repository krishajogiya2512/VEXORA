import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, RefreshCw, Eye, FileText, X, Loader2, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../services/reportService';
import { profileService } from '../services/profileService';
import { detectionService } from '../services/detectionService';
import DataTable from '../components/DataTable';
import { RiskBadge, StatusBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'PENDING', 'UNDER_REVIEW', 'VERIFIED_SUSPICIOUS', 'INSUFFICIENT_EVIDENCE', 'ESCALATED', 'CLOSED'];
const SEVERITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function StatsBar({ stats, activeStatus, onFilterStatus }) {
  const items = [
    { label: 'Total Reports', value: stats?.total ?? 0, color: 'text-vx-text', bg: 'bg-vx-secondary/60', key: '', icon: FileText },
    { label: 'Pending', value: stats?.byStatus?.PENDING ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10', key: 'PENDING', icon: Clock },
    { label: 'Under Review', value: stats?.byStatus?.UNDER_REVIEW ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10', key: 'UNDER_REVIEW', icon: TrendingUp },
    { label: 'Resolved / Closed', value: stats?.byStatus?.CLOSED ?? 0, color: 'text-green-400', bg: 'bg-green-500/10', key: 'CLOSED', icon: CheckCircle },
    { label: 'High / Critical', value: (stats?.bySeverity?.HIGH ?? 0) + (stats?.bySeverity?.CRITICAL ?? 0), color: 'text-red-400', bg: 'bg-red-500/10', key: '_highcritical', icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeStatus === item.key || (item.key === '' && !activeStatus);
        return (
          <motion.button
            key={item.key}
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterStatus(item.key === '_highcritical' ? '' : item.key)}
            className={`card text-left p-4 cursor-pointer transition-all border ${
              isActive ? 'border-vx-blue ring-1 ring-vx-blue/50' : 'border-vx-border hover:border-vx-border/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-vx-muted text-xs font-medium">{item.label}</span>
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

function CreateReportModal({ onClose, onCreated }) {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ profileId: '', detectionId: '', title: '', description: '', severity: 'MEDIUM' });
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError('All fields are required'); return;
    }
    setLoading(true);
    try {
      const res = await reportService.createReport(form);
      if (res.success) { onCreated(res.data.report); onClose(); }
      else setError(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-vx-text font-semibold text-lg">Submit New Report</h3>
          <button onClick={onClose} className="text-vx-muted hover:text-vx-text"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Profile *</label>
            <select className="input" value={form.profileId} onChange={handleProfileChange}>
              <option value="">Select a profile</option>
              {profiles.map(p => <option key={p._id} value={p._id}>@{p.username} ({p.platform})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Detection Result *</label>
            <select className="input" value={form.detectionId} onChange={e => setForm(f => ({ ...f, detectionId: e.target.value }))}>
              <option value="">Select detection analysis</option>
              {detections.map(d => <option key={d._id} value={d._id}>Risk Score: {d.riskScore} ({d.riskLevel}) – {new Date(d.createdAt).toLocaleDateString()}</option>)}
            </select>
            {!form.profileId && <p className="text-vx-muted text-xs mt-1">Select a profile first</p>}
          </div>
          <div>
            <label className="label">Report Title *</label>
            <input type="text" className="input" placeholder="Brief description of the incident" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} />
          </div>
          <div>
            <label className="label">Severity *</label>
            <select className="input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              {SEVERITIES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={4} placeholder="Detailed description of suspicious activity..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={2000} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" className="btn-primary text-sm" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><FileText className="w-4 h-4" /> Submit Report</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ReportDetailModal({ report, onClose, onStatusUpdate }) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(report.status);
  const [reason, setReason] = useState('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-vx-text font-semibold text-lg">{report.caseId}</h3>
            <p className="text-vx-muted text-xs mt-0.5">{report.title}</p>
          </div>
          <button onClick={onClose} className="text-vx-muted hover:text-vx-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge status={report.status} />
            <span className={`badge ${report.severity === 'CRITICAL' ? 'badge-critical' : report.severity === 'HIGH' ? 'badge-high' : report.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
              {report.severity}
            </span>
            <span className="text-vx-muted text-xs ml-auto">Submitted by {report.submittedBy?.name || 'Unknown'}</span>
          </div>

          <div className="bg-vx-secondary/40 border border-vx-border/60 rounded-xl p-4">
            <h4 className="text-vx-muted text-xs uppercase tracking-wider font-semibold mb-2">Description</h4>
            <p className="text-vx-text text-sm leading-relaxed">{report.description}</p>
          </div>

          <div>
            <h4 className="text-vx-text font-medium text-sm mb-3">Investigation Notes ({report.analystNotes?.length || 0})</h4>
            {report.analystNotes?.length === 0 ? (
              <p className="text-vx-muted text-xs">No investigation notes recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {report.analystNotes?.map((n, i) => (
                  <div key={i} className="bg-vx-secondary/50 border border-vx-border rounded-lg px-3 py-2">
                    <p className="text-vx-text text-xs leading-relaxed">{n.note}</p>
                    <p className="text-vx-muted text-[10px] mt-1.5">{n.addedBy?.name || 'Analyst'} · {new Date(n.addedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            {canEdit && (
              <div className="mt-3 flex gap-2">
                <input type="text" className="input text-sm flex-1" placeholder="Add investigation note (min 5 chars)..." value={note} onChange={e => setNote(e.target.value)} />
                <button onClick={handleAddNote} className="btn-secondary text-sm py-2 px-3" disabled={loading || note.trim().length < 5}>Add</button>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="border-t border-vx-border pt-4">
              <h4 className="text-vx-text font-medium text-sm mb-3">Update Status</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <select className="input text-sm sm:w-48" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="text" className="input text-sm flex-1" placeholder="Reason for change (optional)" value={reason} onChange={e => setReason(e.target.value)} />
                <button onClick={handleStatusUpdate} className="btn-primary text-sm py-2 px-4" disabled={loading}>Update</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: location.state?.filterStatus || '',
    severity: '',
    search: '',
  });
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      const [listRes, statsRes] = await Promise.all([
        reportService.getReports(params),
        reportService.getStatistics(),
      ]);
      if (listRes.success) {
        setData(listRes.data);
        setTotalPages(listRes.pagination?.pages || 1);
      }
      if (statsRes.success) setStats(statsRes.data);
    } catch {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = filters.search
    ? data.filter(r => r.caseId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.title?.toLowerCase().includes(filters.search.toLowerCase()))
    : data;

  const columns = [
    { key: 'caseId', label: 'Case ID', render: (v) => <span className="font-mono text-vx-blue text-sm font-semibold">{v}</span> },
    { key: 'title', label: 'Title', render: (v) => <p className="text-vx-text text-sm truncate max-w-48 font-medium">{v}</p> },
    { key: 'severity', label: 'Severity', render: (v) => (
      <span className={`badge ${v === 'CRITICAL' ? 'badge-critical' : v === 'HIGH' ? 'badge-high' : v === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>{v}</span>
    )},
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'submittedBy', label: 'Submitted By', render: (v) => <span className="text-vx-muted text-xs">{v?.name || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => <span className="text-vx-muted text-xs">{new Date(v).toLocaleDateString()}</span> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <button onClick={() => setSelectedReport(row)} className="flex items-center gap-1 text-vx-blue hover:text-blue-400 text-xs font-medium transition-colors">
        <Eye className="w-3.5 h-3.5" /> View
      </button>
    )},
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Stats bar */}
      <StatsBar
        stats={stats}
        activeStatus={filters.status}
        onFilterStatus={(s) => { setFilters(f => ({ ...f, status: f.status === s ? '' : s })); setPage(1); }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vx-muted" />
          <input type="text" placeholder="Search case ID or title..." className="input pl-9" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="input w-44" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input w-36" value={filters.severity} onChange={e => { setFilters(f => ({ ...f, severity: e.target.value })); setPage(1); }}>
          <option value="">All Severities</option>
          {SEVERITIES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => { setFilters({ status: '', severity: '', search: '' }); setPage(1); }} className="btn-secondary text-sm py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
        {(user?.role === 'ADMIN' || user?.role === 'ANALYST') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Report
          </button>
        )}
      </div>

      <DataTable
        columns={columns} data={filtered} loading={loading}
        emptyTitle="No reports found" emptyDescription="Submit a report when you encounter suspicious profiles."
        page={page} totalPages={totalPages} onPageChange={setPage}
      />

      <AnimatePresence>
        {showCreate && <CreateReportModal onClose={() => setShowCreate(false)} onCreated={() => fetchReports()} />}
        {selectedReport && <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} onStatusUpdate={() => { setSelectedReport(null); fetchReports(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}
