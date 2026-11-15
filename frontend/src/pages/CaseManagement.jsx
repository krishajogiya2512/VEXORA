import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, RefreshCw, Eye, ChevronDown, ChevronUp,
  Briefcase, Clock, User, AlertTriangle, X, Loader2,
  FileText, MessageSquare, CheckCircle, Shield, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../services/reportService';
import { StatusBadge, RiskBadge } from '../components/RiskBadge';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';

const STATUSES = [
  'PENDING', 'UNDER_REVIEW', 'VERIFIED_SUSPICIOUS',
  'INSUFFICIENT_EVIDENCE', 'ESCALATED', 'CLOSED'
];

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

  const fetchCaseDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getReport(caseId);
      if (res.success && res.data?.report) {
        setReport(res.data.report);
        setNewStatus(res.data.report.status);
      }
    } catch (_) {}
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === report?.status) return;
    setUpdating(true);
    setStatusMsg('');
    try {
      const res = await reportService.updateReportStatus(report._id, newStatus, reason);
      if (res.success) {
        setReport(r => ({ ...r, status: newStatus }));
        setStatusMsg('Status updated successfully');
        setReason('');
        onUpdated?.();
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (_) {}
    setUpdating(false);
  };

  const handleAddNote = async () => {
    if (!note.trim() || note.trim().length < 5) return;
    setUpdating(true);
    setNoteMsg('');
    try {
      const res = await reportService.addNote(report._id, note.trim());
      if (res.success) {
        setReport(r => ({
          ...r,
          analystNotes: [
            ...(r.analystNotes || []),
            { note: note.trim(), addedBy: { name: user?.name || 'Analyst' }, addedAt: new Date() }
          ]
        }));
        setNote('');
        setNoteMsg('Investigation note logged');
        onUpdated?.();
        setTimeout(() => setNoteMsg(''), 3000);
      }
    } catch (_) {}
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-xl bg-vx-elevated border-l border-vx-border flex flex-col h-full overflow-hidden shadow-2xl z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vx-border shrink-0 bg-vx-sidebar">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-vx-accent-s flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5 text-vx-accent" />
              </div>
              <h2 className="text-vx-text font-semibold text-sm font-mono tracking-tight">
                {loading ? 'Loading Case…' : (report?.caseId || 'CASE RECORD')}
              </h2>
              {report && <StatusBadge status={report.status} />}
            </div>
            {report && <p className="text-vx-muted text-xs mt-1 ml-9 truncate max-w-md">{report.title}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-vx-muted hover:text-vx-text transition-colors p-1.5 rounded-lg hover:bg-vx-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner message="Retrieving case ledger from database…" />
            </div>
          ) : !report ? (
            <div className="py-12">
              <EmptyState title="Case not found" description="This case record may have been archived or removed from MongoDB." />
            </div>
          ) : (
            <>
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Target Profile',
                    value: `@${typeof report.profile === 'object' ? report.profile?.username : (report.profile || 'Unknown')}`,
                    sub: report.profile?.platform,
                    highlight: true
                  },
                  { label: 'Case Severity', value: report.severity || 'MEDIUM' },
                  { label: 'Investigator', value: report.submittedBy?.name || report.submittedBy?.email || 'System' },
                  { label: 'Assigned To', value: report.assignedTo?.name || 'Unassigned' },
                  { label: 'Date Opened', value: report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                  { label: 'Last Updated', value: report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-vx-card rounded-xl px-4 py-3 border border-vx-border">
                    <p className="text-vx-muted text-[10px] uppercase font-semibold tracking-wider mb-0.5">{item.label}</p>
                    <p className={`text-xs font-medium truncate ${item.highlight ? 'text-vx-accent font-mono' : 'text-vx-text capitalize'}`}>
                      {item.value}
                    </p>
                    {item.sub && <p className="text-vx-muted text-[10px] capitalize font-mono mt-0.5">{item.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-vx-card rounded-xl p-4 border border-vx-border">
                <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider mb-1.5">Case Narrative & Findings</p>
                <p className="text-vx-text text-xs leading-relaxed">{report.description || 'No description recorded.'}</p>
              </div>

              {/* Detection summary */}
              {report.detection && (
                <div className="bg-vx-card border border-vx-border rounded-xl px-4 py-3">
                  <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Algorithmic Detection Intelligence</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-vx-muted text-2xs uppercase">Risk Score</p>
                      <p className="text-vx-text font-bold font-mono text-base">
                        {report.detection.riskScore ?? 0}<span className="text-vx-muted text-xs font-normal">/100</span>
                      </p>
                    </div>
                    <RiskBadge level={report.detection.riskLevel} />
                    <p className="text-vx-muted text-xs capitalize ml-auto font-mono">
                      {report.detection.detectionMethod?.replace(/_/g, ' ') || 'Multi-Factor Analysis'}
                    </p>
                  </div>
                </div>
              )}

              {/* Status history */}
              {report.statusHistory?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider">Audit Timeline</p>
                  <div className="space-y-3 border-l-2 border-vx-border ml-2 pl-3 py-1">
                    {[...report.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="text-xs relative">
                        <div className="w-2 h-2 rounded-full bg-vx-accent absolute -left-[17px] top-1 shadow-[0_0_8px_rgba(255,77,31,0.5)]" />
                        <div>
                          <span className="text-vx-text font-medium">{h.status?.replace(/_/g, ' ')}</span>
                          {h.reason && <span className="text-vx-sub ml-1.5">— {h.reason}</span>}
                          <p className="text-vx-muted text-[10px] font-mono mt-0.5">
                            {h.changedBy?.name || 'System Analyst'} · {new Date(h.changedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyst notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider">
                    Investigation Log ({report.analystNotes?.length || 0})
                  </p>
                </div>
                {(!report.analystNotes || report.analystNotes.length === 0) ? (
                  <p className="text-vx-muted text-xs bg-vx-card/50 rounded-lg p-3 border border-vx-border">No notes added to this case yet.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {report.analystNotes.map((n, i) => (
                      <div key={i} className="bg-vx-card border border-vx-border rounded-lg px-3.5 py-2.5">
                        <p className="text-vx-text text-xs leading-relaxed">{n.note}</p>
                        <p className="text-vx-muted text-[10px] font-mono mt-1.5">
                          {n.addedBy?.name || 'Authorized Investigator'} · {new Date(n.addedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {canEdit && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="w-full bg-vx-card border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text placeholder-vx-muted focus:outline-none focus:border-vx-accent focus:ring-1 focus:ring-vx-accent/30 transition-colors"
                      placeholder="Add investigation note (min. 5 chars)…"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={updating || note.trim().length < 5}
                      className="px-3.5 py-2 rounded-lg bg-vx-secondary border border-vx-border text-vx-text hover:border-vx-border-s text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                {noteMsg && (
                  <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />{noteMsg}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer — status update */}
        {canEdit && report && (
          <div className="px-6 py-4 border-t border-vx-border shrink-0 bg-vx-sidebar space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider">Update Case Status</p>
              {statusMsg && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />{statusMsg}</p>}
            </div>
            <div className="flex gap-2">
              <select
                className="bg-vx-card border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text focus:outline-none focus:border-vx-accent focus:ring-1 focus:ring-vx-accent/30 flex-1 transition-colors"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === report.status}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-vx-accent to-vx-accent-d text-white font-medium text-xs shadow-[0_2px_10px_rgba(255,77,31,0.25)] hover:brightness-110 active:brightness-95 transition-all disabled:opacity-40 cursor-pointer"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Status'}
              </button>
            </div>
            <input
              type="text"
              className="w-full bg-vx-card border border-vx-border rounded-lg px-3 py-1.5 text-xs text-vx-text placeholder-vx-muted focus:outline-none focus:border-vx-accent transition-colors"
              placeholder="Reason for status modification (recorded in audit log)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Stat summary bar ───────────────────────────────────────────────────── */
function CaseStatBar({ counts, activeStatus, onSelectStatus }) {
  const items = [
    { label: 'All Cases',      key: '',                      color: 'text-vx-text',      bg: 'bg-vx-secondary' },
    { label: 'Pending',        key: 'PENDING',               color: 'text-amber-400',    bg: 'bg-amber-500/10' },
    { label: 'Under Review',   key: 'UNDER_REVIEW',          color: 'text-sky-400',      bg: 'bg-sky-500/10' },
    { label: 'Verified',       key: 'VERIFIED_SUSPICIOUS',   color: 'text-red-400',      bg: 'bg-red-500/10' },
    { label: 'Escalated',      key: 'ESCALATED',             color: 'text-orange-400',   bg: 'bg-orange-500/10' },
    { label: 'Closed',         key: 'CLOSED',                color: 'text-gray-400',     bg: 'bg-gray-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(item => {
        const count = item.key === ''
          ? Object.values(counts).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
          : (counts[item.key] ?? 0);
        const isActive = activeStatus === item.key;
        return (
          <motion.button
            key={item.key}
            type="button"
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectStatus(item.key)}
            className={`bg-vx-card border rounded-xl p-3.5 text-left transition-all duration-150 cursor-pointer hover:border-vx-border-s hover:bg-vx-secondary/30 ${
              isActive
                ? 'border-vx-accent/50 bg-vx-accent-s shadow-[0_0_12px_rgba(255,77,31,0.12)]'
                : 'border-vx-border'
            }`}
          >
            <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-xl font-bold font-mono tracking-tight ${item.color}`}>{count}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function CaseManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts]         = useState({});
  const [filters, setFilters]       = useState({
    status: location.state?.filterStatus || location.state?.status || '',
    severity: '',
    search: '',
  });
  const [openCase, setOpenCase]     = useState(null); // report _id

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
        setData(listRes.data || []);
        setTotalPages(listRes.pagination?.pages || 1);
      }
      if (statsRes.success) {
        setCounts(statsRes.data?.byStatus || {});
      }
    } catch (_) {}
    setLoading(false);
  }, [page, filters.status, filters.severity]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  /* Client-side text search */
  const filtered = filters.search
    ? data.filter(r => {
        const term = filters.search.toLowerCase();
        return (
          r.caseId?.toLowerCase().includes(term) ||
          r.title?.toLowerCase().includes(term) ||
          r.profile?.username?.toLowerCase().includes(term) ||
          r.submittedBy?.name?.toLowerCase().includes(term)
        );
      })
    : data;

  const columns = [
    {
      key: 'caseId',
      label: 'Case ID',
      render: v => <span className="font-mono text-vx-accent text-xs font-semibold">{v}</span>,
    },
    {
      key: 'profile',
      label: 'Target Profile',
      render: (_, row) => (
        <div>
          <p className="text-vx-text text-xs font-medium">@{row.profile?.username || '—'}</p>
          <p className="text-vx-muted text-[10px] capitalize font-mono">{row.profile?.platform || 'General'}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: v => (
        <span className={`badge ${
          v === 'CRITICAL' ? 'badge-critical' :
          v === 'HIGH'     ? 'badge-high'     :
          v === 'MEDIUM'   ? 'badge-medium'   : 'badge-low'
        }`}>{v}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <StatusBadge status={v} />,
    },
    {
      key: 'submittedBy',
      label: 'Investigator',
      render: v => (
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-vx-muted" />
          <span className="text-vx-sub text-xs">{v?.name || v?.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Opened',
      render: v => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-vx-muted" />
          <span className="text-vx-muted text-xs font-mono">
            {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </span>
        </div>
      ),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setOpenCase(row._id)}
          className="flex items-center gap-1 text-vx-accent hover:text-vx-accent-d text-xs font-medium transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Open Case
        </button>
      ),
    },
  ];

  const resetFilters = () => {
    setFilters({ status: '', severity: '', search: '' });
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Summary bar */}
      <CaseStatBar
        counts={counts}
        activeStatus={filters.status}
        onSelectStatus={(status) => {
          setFilters(f => ({ ...f, status: f.status === status ? '' : status }));
          setPage(1);
        }}
      />

      {/* Toolbar */}
      <div className="bg-vx-card border border-vx-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vx-muted" />
          <input
            type="text"
            placeholder="Search case ID, title, target, or investigator…"
            className="w-full bg-vx-secondary/60 border border-vx-border rounded-lg pl-8 pr-7 py-2 text-xs text-vx-text placeholder-vx-muted focus:outline-none focus:border-vx-accent transition-colors"
            value={filters.search}
            onChange={e => {
              setFilters(f => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters(f => ({ ...f, search: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-vx-muted hover:text-vx-text"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          className="bg-vx-secondary/60 border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text focus:outline-none focus:border-vx-accent transition-colors min-w-40"
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          className="bg-vx-secondary/60 border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text focus:outline-none focus:border-vx-accent transition-colors min-w-36"
          value={filters.severity}
          onChange={e => { setFilters(f => ({ ...f, severity: e.target.value })); setPage(1); }}
        >
          <option value="">All Severities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="px-3 py-2 rounded-lg bg-vx-secondary border border-vx-border hover:border-vx-border-s text-xs font-medium text-vx-text flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-vx-card border border-vx-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-vx-border">
          <div className="flex items-center gap-2">
            <h3 className="text-vx-text font-semibold text-sm">Active Case Records</h3>
            <span className="px-2 py-0.5 text-2xs font-mono font-medium rounded-full bg-vx-accent-s text-vx-accent border border-vx-accent/25">
              {filtered.length} total
            </span>
          </div>
          <button
            onClick={fetchCases}
            className="p-1.5 text-vx-muted hover:text-vx-text rounded-lg bg-vx-secondary border border-vx-border hover:border-vx-border-s transition-colors cursor-pointer"
            title="Refresh cases"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyTitle="No cases found"
          emptyDescription="Cases are logged when security analysts escalate detection reports or open inquiries."
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {openCase && (
          <CaseDrawer
            caseId={openCase}
            onClose={() => setOpenCase(null)}
            onUpdated={fetchCases}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}