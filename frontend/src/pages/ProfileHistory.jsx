import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Eye } from 'lucide-react';
import { detectionService } from '../services/detectionService';
import DataTable from '../components/DataTable';
import { RiskBadge } from '../components/RiskBadge';

const PLATFORMS = ['', 'instagram', 'facebook', 'twitter', 'other'];
const RISK_LEVELS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ProfileHistory() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ riskLevel: '', search: '', startDate: '', endDate: '' });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await detectionService.getHistory(params);
      if (res.success) {
        setData(res.data);
        setTotalPages(res.pagination?.pages || 1);
      }
    } catch (_) {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Client-side search filter
  const filtered = filters.search
    ? data.filter(d => d.profile?.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
        d.profile?.platform?.toLowerCase().includes(filters.search.toLowerCase()))
    : data;

  const columns = [
    { key: 'profile', label: 'Profile', render: (_, row) => (
      <div>
        <p className="text-vx-text font-medium">@{row.profile?.username || '—'}</p>
        <p className="text-vx-muted text-xs capitalize">{row.profile?.platform}</p>
      </div>
    )},
    { key: 'riskScore', label: 'Risk Score', render: (v) => (
      <span className="font-mono font-bold text-vx-text">{v}/100</span>
    )},
    { key: 'riskLevel', label: 'Risk Level', render: (v) => <RiskBadge level={v} /> },
    { key: 'detectionMethod', label: 'Method', render: (v) => (
      <span className="text-vx-muted text-xs capitalize">{v?.replace('_', ' ')}</span>
    )},
    { key: 'createdAt', label: 'Analyzed At', render: (v) => (
      <span className="text-vx-muted text-xs">{new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    )},
    { key: '_id', label: 'Actions', render: (_, row) => (
      <button onClick={() => navigate(`/detection/${row._id}`)} className="flex items-center gap-1 text-vx-blue hover:text-blue-400 text-xs font-medium transition-colors">
        <Eye className="w-3.5 h-3.5" /> View
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vx-muted" />
          <input
            type="text" placeholder="Search username, platform..."
            className="input pl-9"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select className="input w-40" value={filters.riskLevel} onChange={e => { setFilters(f => ({ ...f, riskLevel: e.target.value })); setPage(1); }}>
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="date" className="input w-40" placeholder="From date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
        <input type="date" className="input w-40" placeholder="To date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        <button onClick={() => { setFilters({ riskLevel: '', search: '', startDate: '', endDate: '' }); setPage(1); }} className="btn-secondary text-sm py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
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
