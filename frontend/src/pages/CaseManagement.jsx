import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, Eye, ChevronDown, ChevronUp,
  Briefcase, Clock, User, AlertTriangle, X, Loader2,
  FileText, MessageSquare, CheckCircle
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { StatusBadge, RiskBadge } from '../components/RiskBadge';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const STATUSES = [
  'PENDING', 'UNDER_REVIEW', 'VERIFIED_SUSPICIOUS',
  'INSUFFICIENT_EVIDENCE', 'ESCALATED', 'CLOSED'
];

const STATUS_COLORS = {
  PENDING:               'text-gray-400 bg-gray-500/10 border-gray-500/20',
  UNDER_REVIEW:          'text-blue-400 bg-blue-500/10 border-blue-500/20',
  VERIFIED_SUSPICIOUS:   'text-red-400 bg-red-500/10 border-red-500/20',
  INSUFFICIENT_EVIDENCE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  ESCALATED:             'text-orange-400 bg-orange-500/10 border-orange-500/20',
  CLOSED:                'text-gray-500 bg-gray-700/30 border-gray-700/30',
};

/* ── Case Detail Drawer ─────────────────────────────────────────────────── */
function CaseDrawer({ caseId, onClose, onUpdated }) {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await reportService.getReport(caseId);
        if (res.success) {
          setReport(res.data.report);
          setNewStatus(res.data.report.status);
        }
      } catch (_) {}
      setLoading(false);
    };
    fetch();
  }, [caseId]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === report.status) return;
    setUpdating(true);
    try {
      const res = await reportService.updateReportStatus(report._id, newStatus, reason);
      if (res.success) {
        setReport(r => ({ ...r, status: newStatus }));
        setStatusMsg('Status updated');
        setReason('');
        onUpdated?.();
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (_) {}
    setUpdating(false);
  };

  const handleAddNote = async () => {
    if (!note.trim() || note.length < 5) return;
    setUpdating(true);
    try {
      const res = await reportService.addNote(report._id, note);
      if (res.success) {
        setReport(r => ({
          ...r,
          analystNotes: [...(r.analystNotes || []), { note, addedBy: { name: user?.name }, addedAt: new Date() }]
        }));
        setNote('');
        setNoteMsg('Note added');
        setTimeout(() => setNoteMsg(''), 3000);
      }
    } catch (_) {}
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative w-full max-w-xl bg-vx-card border-l border-vx-border flex flex-col h-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vx-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-vx-blue" />
              <h2 className="text-vx-text font-semibold text-base">
                {loading ? 'Loading…' : report?.caseId}
              </h2>
              {report && <StatusBadge status={report.status} />}
            </div>
            {report && <p className="text-vx-muted text-xs mt-0.5 ml-8">{report.title}</p>}
          </div>
          <button onClick={onClose} className="text-vx-muted hover:text-vx-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner message="Loading case details…" />
            </div>
          ) : !report ? (
            <EmptyState icon="error" title="Case not found" description="This case may have been removed." />
          ) : (
            <>
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Profile', value: `@${report.profile?.username || '—'}`, sub: report.profile?.platform },
                  { label: 'Severity', value: report.severity },
                  { label: 'Submitted By', value: report.submittedBy?.name || '—' },
                  { label: 'Assigned To', value: report.assignedTo?.name || 'Unassigned' },
                  { label: 'Created', value: new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  { label: 'Last Updated', value: new Date(report.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                ].map(item => (
                  <div key={item.label} className="bg-vx-secondary/50 rounded-xl px-4 py-3">
                    <p className="text-vx-muted text-xs mb-0.5">{item.label}</p>
                    <p className="text-vx-text text-sm font-medium capitalize">{item.value}</p>
                    {item.sub && <p className="text-vx-muted text-xs capitalize">{item.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider mb-2">Description</p>
                <p className="text-vx-text text-sm leading-relaxed">{report.description}</p>
              </div>

              {/* Detection summary */}
              {report.detection && (
                <div className="bg-vx-secondary/50 border border-vx-border rounded-xl px-4 py-3">
                  <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider mb-2">Detection Summary</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-vx-muted text-xs">Risk Score</p>
                      <p className="text-vx-text font-bold text-lg">{report.detection.riskScore}<span className="text-vx-muted text-xs font-normal">/100</span></p>
                    </div>
                    <RiskBadge level={report.detection.riskLevel} />
                    <p className="text-vx-muted text-xs capitalize ml-auto">{report.detection.detectionMethod?.replace('_', ' ')}</p>
                  </div>
                </div>
              )}

              {/* Status history */}
              {report.statusHistory?.length > 0 && (
                <div>
                  <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider mb-2">Status History</p>
                  <div className="space-y-2">
                    {[...report.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-vx-blue mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="text-vx-text font-medium">{h.status?.replace(/_/g, ' ')}</span>
                          {h.reason && <span className="text-vx-muted ml-2">— {h.reason}</span>}
                          <p className="text-vx-muted mt-0.5">{h.changedBy?.name || 'System'} · {new Date(h.changedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyst notes */}
              <div>
                <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider mb-2">
                  Investigation Notes ({report.analystNotes?.length || 0})
                </p>
                {(!report.analystNotes || report.analystNotes.length === 0) ? (
                  <p className="text-vx-muted text-xs">No notes yet.</p>
                ) : (
                  <div className="space-y-2">
                    {report.analystNotes.map((n, i) => (
                      <div key={i} className="bg-vx-secondary/50 border border-vx-border rounded-lg px-4 py-3">
                        <p className="text-vx-text text-sm">{n.note}</p>
                        <p className="text-vx-muted text-xs mt-1.5">
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
                      className="input text-sm flex-1"
                      placeholder="Add investigation note (min. 5 chars)…"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={updating || note.trim().length < 5}
                      className="btn-secondary text-sm py-2 px-3"
                    >
                      {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                {noteMsg && <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{noteMsg}</p>}
              </div>
            </>
          )}
        </div>

        {/* Footer — status update */}
        {canEdit && report && (
          <div className="px-6 py-4 border-t border-vx-border flex-shrink-0 bg-vx-sidebar space-y-3">
            <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider">Update Case Status</p>
            {statusMsg && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />{statusMsg}</p>}
            <div className="flex gap-2">
              <select
                className="input text-sm flex-1"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === report.status}
                className="btn-primary text-sm py-2 px-4"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </button>
            </div>
            <input
              type="text"
              className="input text-sm"
              placeholder="Reason for change (optional)"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat summary bar ───────────────────────────────────────────────────── */
function CaseStatBar({ counts }) {
  const items = [
    { label: 'Pending',        key: 'PENDING',               color: 'text-gray-400' },
    { label: 'Under Review',   key: 'UNDER_REVIEW',          color: 'text-blue-400' },
    { label: 'Verified',       key: 'VERIFIED_SUSPICIOUS',   color: 'text-red-400' },
    { label: 'Escalated',      key: 'ESCALATED',             color: 'text-orange-400' },
    { label: 'Closed',         key: 'CLOSED',                color: 'text-gray-500' },
  ];
  return (
    <div className="card flex flex-wrap gap-6">
      {items.map(item => (
        <div key={item.key} className="text-center">
          <p className={`text-2xl font-bold ${item.color}`}>{counts[item.key] ?? 0}</p>
          <p className="text-vx-muted text-xs mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function CaseManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts]       = useState({});
  const [filters, setFilters]     = useState({ status: '', severity: '', search: '' });
  const [openCase, setOpenCase]   = useState(null); // report _id

  const fetchCases = useCallback(async () => {
    setLoading(true);
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
      }
      if (statsRes.success) {
        setCounts(statsRes.data?.byStatus || {});
      }
    } catch (_) {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  /* Client-side text search */
  const filtered = filters.search
    ? data.filter(r =>
        r.caseId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.profile?.username?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : data;

  const columns = [
    {
      key: 'caseId', label: 'Case ID',
      render: v => <span className="font-mono text-vx-blue text-sm font-semibold">{v}</span>,
    },
    {
      key: 'profile', label: 'Profile',
      render: (_, row) => (
        <div>
          <p className="text-vx-text text-sm font-medium">@{row.profile?.username || '—'}</p>
          <p className="text-vx-muted text-xs capitalize">{row.profile?.platform}</p>
        </div>
      ),
    },
    {
      key: 'severity', label: 'Severity',
      render: v => (
        <span className={`badge ${
          v === 'CRITICAL' ? 'badge-critical' :
          v === 'HIGH'     ? 'badge-high'     :
          v === 'MEDIUM'   ? 'badge-medium'   : 'badge-low'
        }`}>{v}</span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: v => <StatusBadge status={v} />,
    },
    {
      key: 'submittedBy', label: 'Submitted By',
      render: v => (
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-vx-muted" />
          <span className="text-vx-muted text-xs">{v?.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt', label: 'Opened',
      render: v => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-vx-muted" />
          <span className="text-vx-muted text-xs">
            {new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      ),
    },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setOpenCase(row._id)}
          className="flex items-center gap-1 text-vx-blue hover:text-blue-400 text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Open
        </button>
      ),
    },
  ];

  const resetFilters = () => {
    setFilters({ status: '', severity: '', search: '' });
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <CaseStatBar counts={counts} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vx-muted" />
          <input
            type="text"
            placeholder="Search case ID, title, or profile…"
            className="input pl-9"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        <select
          className="input w-48"
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          className="input w-36"
          value={filters.severity}
          onChange={e => { setFilters(f => ({ ...f, severity: e.target.value })); setPage(1); }}
        >
          <option value="">All Severities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button onClick={resetFilters} className="btn-secondary text-sm py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No cases found"
        emptyDescription="Cases are created when analysts submit investigation reports."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Drawer */}
      {openCase && (
        <CaseDrawer
          caseId={openCase}
          onClose={() => setOpenCase(null)}
          onUpdated={fetchCases}
        />
      )}
    </div>
  );
}
