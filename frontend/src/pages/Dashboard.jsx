import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, AlertTriangle, FileText, TrendingUp, Activity, Clock, FolderOpen } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { RiskBadge } from '../components/RiskBadge';
import { dashboardService } from '../services/dashboardService';

const COLORS = { LOW: '#22C55E', MEDIUM: '#F59E0B', HIGH: '#EF4444', CRITICAL: '#7C3AED' };

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
      { name: 'Low Risk', value: 0, color: '#22C55E' },
      { name: 'Medium Risk', value: 0, color: '#F59E0B' },
      { name: 'High Risk', value: 0, color: '#EF4444' },
      { name: 'Critical Risk', value: 0, color: '#7C3AED' },
    ],
    platformDistribution: [],
    activityTrend: [],
  },
  recent: { detections: [], reports: [] },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-vx-card border border-vx-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-vx-muted mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getOverview();
      if (res.success) {
        setData(res.data);
        setUsingFallback(false);
        setError(null);
      }
    } catch (err) {
      setError('Could not connect to backend. Showing empty state.');
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const { stats, charts, recent } = data;

  const platformChartData = Object.entries(stats?.platformDistribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {usingFallback && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-400 text-sm">
            <strong>Backend Offline.</strong> {error} Start the backend server to see real data.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" message="Loading dashboard..." />
        </div>
      ) : (
        <>
          {/* Stat cards row 1 — risk & profile overview */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            <motion.div variants={itemVariants}>
              <StatCard
                title="Total Profiles"
                value={stats.totalProfiles}
                icon={Users}
                color="blue"
                onClick={() => navigate('/history')}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Suspicious"
                value={stats.suspicious}
                icon={AlertTriangle}
                color="red"
                onClick={() => navigate('/history')}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Low Risk"
                value={stats.riskDistribution?.LOW}
                icon={Shield}
                color="green"
                onClick={() => navigate('/history', { state: { riskLevel: 'LOW' } })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Medium Risk"
                value={stats.riskDistribution?.MEDIUM}
                icon={Shield}
                color="yellow"
                onClick={() => navigate('/history', { state: { riskLevel: 'MEDIUM' } })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="High Risk"
                value={stats.riskDistribution?.HIGH}
                icon={Shield}
                color="red"
                onClick={() => navigate('/history', { state: { riskLevel: 'HIGH' } })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Critical Risk"
                value={stats.riskDistribution?.CRITICAL}
                icon={Shield}
                color="purple"
                onClick={() => navigate('/history', { state: { riskLevel: 'CRITICAL' } })}
              />
            </motion.div>
          </motion.div>

          {/* Stat cards row 2 — operational investigation modules */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <motion.div variants={itemVariants}>
              <StatCard
                title="Total Analyses"
                value={stats.totalDetections}
                icon={Activity}
                color="blue"
                onClick={() => navigate('/history')}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Reports Filed"
                value={stats.totalReports}
                icon={FileText}
                color="purple"
                onClick={() => navigate('/reports')}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Pending Cases"
                value={stats.pendingCases}
                icon={Clock}
                color="yellow"
                onClick={() => navigate('/cases', { state: { filterStatus: 'PENDING' } })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Under Review"
                value={stats.underReviewCases}
                icon={TrendingUp}
                color="blue"
                onClick={() => navigate('/cases', { state: { filterStatus: 'UNDER_REVIEW' } })}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Evidence Vault"
                value="Manage"
                subtitle="Stored artifacts"
                icon={FolderOpen}
                color="green"
                onClick={() => navigate('/evidence')}
              />
            </motion.div>
          </motion.div>

          {/* Interactive Charts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Risk distribution pie */}
            <ChartCard title="Risk Distribution" subtitle="Click segment to filter history">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={charts.riskDistribution.filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-vx-muted text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              {charts.riskDistribution.every(d => d.value === 0) && (
                <p className="text-center text-vx-muted text-xs mt-2">No analyses recorded yet.</p>
              )}
            </ChartCard>

            {/* Platform distribution */}
            <ChartCard title="Platform Distribution" subtitle="Click bar to filter by platform">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={platformChartData.length ? platformChartData : [{ name: 'No data', value: 0 }]}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Profiles"
                    className="cursor-pointer"
                    onClick={(entry) => {
                      if (entry.name && entry.name !== 'No data') {
                        navigate('/history', { state: { search: entry.name.toLowerCase() } });
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Activity trend */}
            <ChartCard title="30-Day Activity" subtitle="Detection analyses over time">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={charts.activityTrend.length ? charts.activityTrend : []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="_id" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || v} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="detections" stroke="#3B82F6" strokeWidth={2} dot={false} name="Detections" />
                </LineChart>
              </ResponsiveContainer>
              {!charts.activityTrend.length && (
                <p className="text-center text-vx-muted text-xs mt-2">No activity in last 30 days</p>
              )}
            </ChartCard>
          </motion.div>

          {/* Recent items grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Recent detections */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-vx-text font-semibold">Recent Analyses</h3>
                <button onClick={() => navigate('/history')} className="text-vx-blue text-xs hover:underline">View all →</button>
              </div>
              {recent.detections.length === 0 ? (
                <p className="text-vx-muted text-sm text-center py-6">No analyses yet. Start by analyzing a profile.</p>
              ) : (
                <div className="space-y-2">
                  {recent.detections.map((d) => (
                    <motion.div
                      key={d._id}
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => navigate(`/detection/${d._id}`)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-vx-secondary/60 cursor-pointer transition-colors border border-transparent hover:border-vx-border"
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

            {/* Recent reports */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-vx-text font-semibold">Recent Reports & Cases</h3>
                <button onClick={() => navigate('/cases')} className="text-vx-blue text-xs hover:underline">View all →</button>
              </div>
              {recent.reports.length === 0 ? (
                <p className="text-vx-muted text-sm text-center py-6">No reports submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {recent.reports.map((r) => (
                    <motion.div
                      key={r._id}
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => navigate('/cases')}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-vx-secondary/60 cursor-pointer transition-colors border border-transparent hover:border-vx-border"
                    >
                      <div>
                        <p className="text-vx-text text-sm font-mono font-medium text-vx-blue">{r.caseId || 'Case'}</p>
                        <p className="text-vx-muted text-xs truncate max-w-xs">{r.title}</p>
                      </div>
                      <span className={`badge ${r.severity === 'CRITICAL' ? 'badge-critical' : r.severity === 'HIGH' ? 'badge-high' : r.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                        {r.severity}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
