import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Eye, FileText, ChevronDown, X, Loader2 } from 'lucide-react';
import { reportService } from '../services/reportService';
import { profileService } from '../services/profileService';
import { detectionService } from '../services/detectionService';
import DataTable from '../components/DataTable';
import { RiskBadge, StatusBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'PENDING', 'UNDER_REVIEW', 'VERIFIED_SUSPICIOUS', 'INSUFFICIENT_EVIDENCE', 'ESCALATED', 'CLOSED'];
const SEVERITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" className="btn-primary text-sm" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><FileText className="w-4 h-4" /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-vx-text font-semibold text-lg">{report.caseId}</h3>
            <p className="text-vx-muted text-xs">{report.title}</p>
          </div>
          <button onClick={onClose} className="text-vx-muted hover:text-vx-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={report.status} />
            <span className={`badge ${report.severity === 'CRITICAL' ? 'badge-critical' : report.severity === 'HIGH' ? 'badge-high' : report.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
              {report.severity}
            </span>
            <span className="text-vx-muted text-xs">By {report.submittedBy?.name}</span>
          </div>

          <p className="text-vx-text text-sm">{report.description}</p>

          {/* Analyst notes */}
          <div>
            <h4 className="text-vx-text font-medium text-sm mb-3">Investigation Notes ({report.analystNotes?.length || 0})</h4>
            {report.analystNotes?.length === 0 && <p className="text-vx-muted text-xs">No notes yet.</p>}
            {report.analystNotes?.map((n, i) => (
              <div key={i} className="bg-vx-secondary/50 border border-vx-border rounded-lg px-3 py-2 mb-2">
                <p className="text-vx-text text-xs">{n.note}</p>
                <p className="text-vx-muted text-xs mt-1">{n.addedBy?.name} · {new Date(n.addedAt).toLocaleString()}</p>
              </div>
            ))}
            {canEdit && (
              <div className="mt-3 flex gap-2">
                <input type="text" className="input text-sm flex-1" placeholder="Add investigation note..." value={note} onChange={e => setNote(e.target.value)} />
                <button onClick={handleAddNote} className="btn-secondary text-sm py-2 px-3" disabled={loading || note.length < 5}>Add</button>
              </div>
            )}
          </div>

          {/* Status update */}
          {canEdit && (
            <div className="border-t border-vx-border pt-4">
              <h4 className="text-vx-text font-medium text-sm mb-3">Update Status</h4>
              <div className="flex gap-2">
                <select className="input text-sm flex-1" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <input type="text" className="input text-sm flex-1" placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
                <button onClick={handleStatusUpdate} className="btn-primary text-sm py-2 px-3" disabled={loading}>Update</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', severity: '', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const { user } = useAuth();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      const res = await reportService.getReports(params);
      if (res.success) {
        setData(res.data);
        setTotalPages(res.pagination?.pages || 1);
      }
    } catch {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = filters.search
    ? data.filter(r => r.caseId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.title?.toLowerCase().includes(filters.search.toLowerCase()))
    : data;

  const columns = [
    { key: 'caseId', label: 'Case ID', render: (v) => <span className="font-mono text-vx-blue text-sm">{v}</span> },
    { key: 'title', label: 'Title', render: (v) => <p className="text-vx-text text-sm truncate max-w-48">{v}</p> },
    { key: 'severity', label: 'Severity', render: (v) => (
      <span className={`badge ${v === 'CRITICAL' ? 'badge-critical' : v === 'HIGH' ? 'badge-high' : v === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>{v}</span>
    )},
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'submittedBy', label: 'Submitted By', render: (v) => <span className="text-vx-muted text-xs">{v?.name || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => <span className="text-vx-muted text-xs">{new Date(v).toLocaleDateString()}</span> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <button onClick={() => setSelectedReport(row)} className="flex items-center gap-1 text-vx-blue hover:text-blue-400 text-xs font-medium">
        <Eye className="w-3.5 h-3.5" /> View
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
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
          <RefreshCw className="w-3.5 h-3.5" />
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

      {showCreate && <CreateReportModal onClose={() => setShowCreate(false)} onCreated={() => fetchReports()} />}
      {selectedReport && <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} onStatusUpdate={() => { setSelectedReport(null); fetchReports(); }} />}
    </div>
  );
}
