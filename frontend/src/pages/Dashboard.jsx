import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, AlertTriangle, FileText, TrendingUp,
  Activity, Clock, FolderOpen, ArrowRight, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { RiskBadge } from '../components/RiskBadge';
import { dashboardService } from '../services/dashboardService';
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';

// ── Design tokens ────────────────────────────────────────────
const RISK_COLORS = {
  LOW: '#22C55E', MEDIUM: '#EAB308', HIGH: '#EF4444', CRITICAL: '#A855F7',
};
const ACCENT   = '#FF4D1F';
const GRID_CLR = '#202024';
const TICK_CLR = '#666673';

// ── Fallback data ────────────────────────────────────────────
const FALLBACK_DATA = {
  stats: {
    totalProfiles: 0, totalDetections: 0, totalReports: 0,
    suspicious: 0, pendingCases: 0, underReviewCases: 0,
    riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    platformDistribution: {},
    reportStatusDistribution: {},
  },
  charts: {
    riskDistribution: [
      { name: 'Low Risk',      value: 0, color: RISK_COLORS.LOW },
      { name: 'Medium Risk',   value: 0, color: RISK_COLORS.MEDIUM },
      { name: 'High Risk',     value: 0, color: RISK_COLORS.HIGH },
      { name: 'Critical Risk', value: 0, color: RISK_COLORS.CRITICAL },
    ],
    platformDistribution: [],
    activityTrend: [],
  },
  recent: { detections: [], reports: [] },
};

// ── Styled tooltip ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-vx-elevated border border-vx-border rounded-lg px-3 py-2 shadow-card-lg text-xs">
      {label && <p className="text-vx-muted mb-1.5 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill || ACCENT }} className="font-semibold">
          {p.name}: <span className="font-mono">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Donut center label ────────────────────────────────────────
function DonutCenter({ total }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-0.4em" fontSize="22" fontWeight="700" fill="#F0F0F5" fontFamily="JetBrains Mono, monospace">
        {total}
      </tspan>
      <tspan x="50%" dy="1.4em" fontSize="10" fill="#6B6B80" fontFamily="Inter, sans-serif">
        ANALYZED
      </tspan>
    </text>
  );
}

// ── Animation variants ────────────────────────────────────────
const container = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
};

// ── KPI Tile ──────────────────────────────────────────────────
function KpiTile({ label, value, icon: Icon, iconCls, onClick, mono = true }) {
  return (
    <motion.div
      variants={item}
      onClick={onClick}
      className={`
        bg-vx-card border border-vx-border rounded-xl p-5 shadow-card
        bg-[linear-gradient(135deg,rgba(255,255,255,0.025)_0%,transparent_60%)]
        hover:border-vx-border-s hover:shadow-card-lg
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest">{label}</span>
        {Icon && (
          <span className={`p-1.5 rounded-lg bg-vx-secondary ${iconCls}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold text-vx-text tracking-tight ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </motion.div>
  );
}

// ── Risk breakdown strip ──────────────────────────────────────
function RiskStrip({ distribution, onClick }) {
  const levels = [
    { key: 'LOW',      label: 'Low',      color: 'text-green-400',  bar: 'bg-green-500'  },
    { key: 'MEDIUM',   label: 'Medium',   color: 'text-amber-400',  bar: 'bg-amber-500' },
    { key: 'HIGH',     label: 'High',     color: 'text-red-400',    bar: 'bg-red-500'    },
    { key: 'CRITICAL', label: 'Critical', color: 'text-purple-400', bar: 'bg-purple-500' },
  ];
  const total = Object.values(distribution).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="bg-vx-card border border-vx-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest">Risk Breakdown</span>
        <span className="font-mono text-xs text-vx-muted">{total} total</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-4">
        {levels.map(({ key, bar }) => {
          const pct = ((distribution[key] || 0) / total) * 100;
          return pct > 0 ? (
            <div
              key={key}
              title={`${key}: ${distribution[key]}`}
              style={{ width: `${pct}%` }}
              className={`${bar} first:rounded-l-full last:rounded-r-full`}
            />
          ) : null;
        })}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-4 gap-2">
        {levels.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => onClick?.(key)}
            className="flex flex-col items-center gap-1 group"
          >
            <span className={`font-mono text-lg font-bold ${color}`}>
              {distribution[key] || 0}
            </span>
            <span className="text-[9px] font-semibold text-vx-muted uppercase tracking-widest group-hover:text-vx-sub transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData]           = useState(FALLBACK_DATA);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await dashboardService.getOverview();
      if (res.success) {
        setData(res.data);
        setUsingFallback(false);
        setError(null);
      }
    } catch (err) {
      setError('Could not connect to backend. Start the backend server to see real data.');
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const { stats, charts, recent } = data;

  const platformChartData = Object.entries(stats?.platformDistribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
  }));

  const totalAnalyzed = charts.riskDistribution.reduce((s, d) => s + d.value, 0);

  // ── Skeleton loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-vx-card border border-vx-border rounded-xl p-5 h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Offline banner ──────────────────────────────────── */}
      {usingFallback && (
        <div className="flex items-center gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm flex-1">
            <strong className="font-semibold">Backend offline.</strong> {error}
          </p>
          <button
            onClick={() => fetchDashboard(true)}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            aria-label="Retry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* ── KPI row ─────────────────────────────────────────── */}
      <motion.div
        variants={container} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiTile
          label="Total Profiles"
          value={stats.totalProfiles}
          icon={Users}
          iconCls="text-vx-accent"
          onClick={() => navigate('/history')}
        />
        <KpiTile
          label="Total Analyses"
          value={stats.totalDetections}
          icon={Activity}
          iconCls="text-vx-accent"
          onClick={() => navigate('/history')}
        />
        <KpiTile
          label="Reports Filed"
          value={stats.totalReports}
          icon={FileText}
          iconCls="text-purple-400"
          onClick={() => navigate('/reports')}
        />
        <KpiTile
          label="Suspicious Profiles"
          value={stats.suspicious}
          icon={AlertTriangle}
          iconCls="text-red-400"
          onClick={() => navigate('/history')}
        />
      </motion.div>

      {/* ── Risk strip + case group ──────────────────────────── */}
      <motion.div
        variants={container} initial="hidden" animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Risk breakdown — spans 2 cols on large */}
        <motion.div variants={item} className="lg:col-span-2">
          <RiskStrip
            distribution={stats.riskDistribution || {}}
            onClick={(level) => navigate('/history', { state: { riskLevel: level } })}
          />
        </motion.div>

        {/* Case status compact group */}
        <motion.div variants={item}>
          <div className="bg-vx-card border border-vx-border rounded-xl p-5 shadow-card h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-widest">Cases</span>
              <button
                onClick={() => navigate('/cases')}
                className="text-vx-accent hover:text-vx-accent-d transition-colors"
                aria-label="View all cases"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/cases', { state: { filterStatus: 'PENDING' } })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-vx-secondary hover:bg-vx-elevated transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-medium text-vx-sub">Pending</span>
                </div>
                <span className="font-mono text-sm font-bold text-vx-text">{stats.pendingCases}</span>
              </button>
              <button
                onClick={() => navigate('/cases', { state: { filterStatus: 'UNDER_REVIEW' } })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-vx-secondary hover:bg-vx-elevated transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-medium text-vx-sub">Under Review</span>
                </div>
                <span className="font-mono text-sm font-bold text-vx-text">{stats.underReviewCases}</span>
              </button>
              <button
                onClick={() => navigate('/evidence')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-vx-secondary hover:bg-vx-elevated transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-vx-accent" />
                  <span className="text-xs font-medium text-vx-sub">Evidence Vault</span>
                </div>
                <ArrowRight className="w-3 h-3 text-vx-muted" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Donut — risk distribution */}
        <div className="bg-vx-card border border-vx-border rounded-xl p-5 shadow-card">
          <p className="text-sm font-semibold text-vx-text mb-0.5">Risk Distribution</p>
          <p className="text-xs text-vx-muted mb-4">Click a segment to filter</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={charts.riskDistribution.filter(d => d.value > 0)}
                cx="50%" cy="50%" innerRadius={58} outerRadius={82}
                paddingAngle={2} dataKey="value" strokeWidth={0}
                onClick={(entry) => {
                  const level = entry.name?.split(' ')[0].toUpperCase();
                  navigate('/history', { state: { riskLevel: level } });
                }}
                className="cursor-pointer"
              >
                {charts.riskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle" iconSize={7}
                formatter={(v) => <span className="text-vx-muted text-[11px]">{v}</span>}
              />
              {totalAnalyzed > 0 && <DonutCenter total={totalAnalyzed} />}
            </PieChart>
          </ResponsiveContainer>
          {totalAnalyzed === 0 && (
            <p className="text-center text-vx-muted text-xs mt-1">No analyses recorded yet.</p>
          )}
        </div>

        {/* Bar — platform distribution */}
        <div className="bg-vx-card border border-vx-border rounded-xl p-5 shadow-card">
          <p className="text-sm font-semibold text-vx-text mb-0.5">Platform Distribution</p>
          <p className="text-xs text-vx-muted mb-4">Click a bar to filter by platform</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={platformChartData.length ? platformChartData : [{ name: 'No data', value: 0 }]}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_CLR} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: TICK_CLR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TICK_CLR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                dataKey="value" fill={ACCENT}
                radius={[6, 6, 0, 0]} name="Profiles"
                className="cursor-pointer"
                onClick={(entry) => {
                  if (entry.name && entry.name !== 'No data') {
                    navigate('/history', { state: { search: entry.name.toLowerCase() } });
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line — activity trend */}
        <div className="bg-vx-card border border-vx-border rounded-xl p-5 shadow-card">
          <p className="text-sm font-semibold text-vx-text mb-0.5">30-Day Activity</p>
          <p className="text-xs text-vx-muted mb-4">Detection analyses over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={charts.activityTrend.length ? charts.activityTrend : []}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_CLR} vertical={false} />
              <XAxis
                dataKey="_id" tick={{ fill: TICK_CLR, fontSize: 10 }}
                tickFormatter={(v) => v?.slice(5) || v}
                axisLine={false} tickLine={false}
              />
              <YAxis tick={{ fill: TICK_CLR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone" dataKey="detections"
                stroke={ACCENT} strokeWidth={2} dot={false} name="Detections"
              />
            </LineChart>
          </ResponsiveContainer>
          {!charts.activityTrend.length && (
            <p className="text-center text-vx-muted text-xs mt-1">No activity in last 30 days</p>
          )}
        </div>
      </motion.div>

      {/* ── Recent items ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent analyses */}
        <div className="bg-vx-card border border-vx-border rounded-xl shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-vx-border">
            <h3 className="text-sm font-semibold text-vx-text">Recent Analyses</h3>
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1 text-vx-accent hover:text-vx-accent-d text-xs font-medium transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recent.detections.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-vx-muted text-sm">No analyses yet.</p>
              <button
                onClick={() => navigate('/analyzer')}
                className="mt-2 text-vx-accent text-xs hover:underline"
              >
                Analyze a profile →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-vx-border/50">
              {recent.detections.map((d) => (
                <motion.div
                  key={d._id}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  onClick={() => navigate(`/detection/${d._id}`)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-vx-secondary/40 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-vx-text text-sm font-medium">@{d.profile?.username || 'Unknown'}</p>
                    <p className="text-vx-muted text-xs capitalize">{d.profile?.platform}</p>
                  </div>
                  <RiskBadge level={d.riskLevel} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reports & cases */}
        <div className="bg-vx-card border border-vx-border rounded-xl shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-vx-border">
            <h3 className="text-sm font-semibold text-vx-text">Recent Reports & Cases</h3>
            <button
              onClick={() => navigate('/cases')}
              className="flex items-center gap-1 text-vx-accent hover:text-vx-accent-d text-xs font-medium transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recent.reports.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-vx-muted text-sm">No reports submitted yet.</p>
              <button
                onClick={() => navigate('/reports')}
                className="mt-2 text-vx-accent text-xs hover:underline"
              >
                File a report →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-vx-border/50">
              {recent.reports.map((r) => (
                <motion.div
                  key={r._id}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  onClick={() => navigate('/cases')}
                  className="flex items-center justify-between px-5 py-3 hover:bg-vx-secondary/40 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-mono text-vx-accent text-sm font-semibold">{r.caseId || 'Case'}</p>
                    <p className="text-vx-muted text-xs truncate max-w-xs">{r.title}</p>
                  </div>
                  <span
                    className={`badge ${
                      r.severity === 'CRITICAL' ? 'badge-critical'
                      : r.severity === 'HIGH'   ? 'badge-high'
                      : r.severity === 'MEDIUM' ? 'badge-medium'
                      : 'badge-low'
                    }`}
                  >
                    {r.severity}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
