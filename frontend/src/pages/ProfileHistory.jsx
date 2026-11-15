import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, RefreshCw, Eye } from 'lucide-react';
import { detectionService } from '../services/detectionService';
import DataTable from '../components/DataTable';
import { RiskBadge } from '../components/RiskBadge';

const RISK_LEVELS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ProfileHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters]     = useState({
    riskLevel: location.state?.riskLevel || '',
    search:    location.state?.search    || '',
    startDate: '',
    endDate:   '',
  });

  // Sync filters when navigated from Dashboard with state
  useEffect(() => {
    if (location.state?.riskLevel !== undefined || location.state?.search !== undefined) {
      setFilters(f => ({
        ...f,
        riskLevel: location.state?.riskLevel || '',
        search:    location.state?.search    || '',
      }));
    }
  }, [location.state]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      const res = await detectionService.getHistory(params);
      if (res.success) {
        setData(res.data);
        setTotalPages(res.pagination?.pages || 1);
      }
    } catch (_) {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Client-side search
  const filtered = filters.search
    ? data.filter(d =>
        d.profile?.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
        d.profile?.platform?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : data;

  const columns = [
    {
      key: 'profile', label: 'Profile',
      render: (_, row) => (
        <div>
          <p className="text-vx-text font-medium text-sm">@{row.profile?.username || '—'}</p>
          <p className="text-vx-muted text-xs capitalize mt-0.5">{row.profile?.platform}</p>
        </div>
      ),
    },
    {
      key: 'riskScore', label: 'Score',
      render: (v) => (
        <span className="font-mono text-sm font-bold text-vx-text">{v}<span className="text-vx-muted font-normal">/100</span></span>
      ),
    },
    {
      key: 'riskLevel', label: 'Risk Level',
      render: (v) => <RiskBadge level={v} />,
    },
    {
      key: 'detectionMethod', label: 'Method',
      render: (v) => (
        <span className="text-vx-muted text-xs capitalize font-mono">{v?.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'createdAt', label: 'Analyzed',
      render: (v) => (
        <span className="text-vx-muted text-xs font-mono">
          {new Date(v).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: '_id', label: '',
      render: (_, row) => (
        <button
          onClick={() => navigate(`/detection/${row._id}`)}
          className="flex items-center gap-1 text-vx-accent hover:text-vx-accent-d text-xs font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  const hasActiveFilters = filters.riskLevel || filters.startDate || filters.endDate || filters.search;

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-vx-card border border-vx-border rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vx-muted" />
          <input
            type="text"
            placeholder="Search username or platform…"
            className="input pl-9 text-sm py-2"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Risk level */}
        <select
          className="input w-38 text-sm py-2"
          value={filters.riskLevel}
          onChange={e => { setFilters(f => ({ ...f, riskLevel: e.target.value })); setPage(1); }}
        >
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Date range */}
        <input
          type="date"
          className="input w-36 text-sm py-2"
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
        />
        <span className="text-vx-muted text-xs">to</span>
        <input
          type="date"
          className="input w-36 text-sm py-2"
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
        />

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={() => { setFilters({ riskLevel: '', search: '', startDate: '', endDate: '' }); setPage(1); }}
            className="btn-ghost text-xs py-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No detection history"
        emptyDescription="Analyze a profile to see results here."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
