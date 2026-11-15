import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Trash2, FileText, Image, X, Loader2, AlertCircle, Check,
  Search, RefreshCw, Eye, HardDrive, Shield, Filter, ExternalLink, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evidenceService } from '../services/evidenceService';
import { profileService } from '../services/profileService';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

function EvidenceStatsBar({ stats, activeType, onSelectType }) {
  const items = [
    { label: 'Total Artifacts',   value: stats?.total ?? 0,                 color: 'text-vx-text',   bg: 'bg-vx-secondary', key: '',           icon: HardDrive },
    { label: 'Images',            value: stats?.images ?? 0,                color: 'text-sky-400',   bg: 'bg-sky-500/10',   key: 'image',        icon: Image },
    { label: 'Documents / PDFs',  value: stats?.documents ?? 0,             color: 'text-violet-400',bg: 'bg-violet-500/10',key: 'document',     icon: FileText },
    { label: 'Screenshots',       value: stats?.byType?.screenshot ?? 0,    color: 'text-amber-400', bg: 'bg-amber-500/10', key: 'screenshot',   icon: Eye },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeType === item.key;
        return (
          <motion.button
            key={item.key}
            type="button"
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectType(item.key)}
            className={`bg-vx-card border rounded-xl p-4 text-left transition-all duration-150 cursor-pointer hover:border-vx-border-s hover:bg-vx-secondary/30 ${
              isActive
                ? 'border-vx-accent/50 bg-vx-accent-s shadow-[0_0_12px_rgba(255,77,31,0.12)]'
                : 'border-vx-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-vx-muted uppercase tracking-wider">{item.label}</span>
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono tracking-tight ${item.color}`}>{item.value}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

function EvidenceDetailModal({ evidence, onClose }) {
  if (!evidence) return null;
  const isImage = evidence.mimeType?.startsWith('image/');
  const isPdf = evidence.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-vx-elevated border border-vx-border-s rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-vx-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImage ? (
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                <Image className="w-4 h-4 text-sky-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-violet-400" />
              </div>
            )}
            <div className="truncate">
              <h3 className="text-vx-text font-semibold text-base truncate">{evidence.originalName}</h3>
              <p className="text-vx-muted text-xs font-mono">{evidence._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-vx-muted hover:text-vx-text p-1.5 rounded-lg hover:bg-vx-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider rounded-md bg-vx-secondary text-vx-text border border-vx-border">
              {evidence.evidenceType || 'Artifact'}
            </span>
            <span className="px-2.5 py-1 text-2xs font-mono rounded-md bg-vx-accent-s text-vx-accent border border-vx-accent/30">
              {evidence.mimeType || 'unknown'}
            </span>
            <span className="px-2.5 py-1 text-2xs font-mono rounded-md bg-vx-secondary text-vx-sub border border-vx-border">
              {evidence.fileSize ? `${(evidence.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
            </span>
          </div>

          {/* Description */}
          <div className="bg-vx-card rounded-xl p-4 border border-vx-border">
            <p className="text-vx-muted text-[10px] font-semibold uppercase tracking-wider mb-1.5">Forensic Note / Description</p>
            <p className="text-vx-text text-sm leading-relaxed">{evidence.description || 'No description recorded.'}</p>
          </div>

          {/* Detail specs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-vx-card rounded-lg p-3 border border-vx-border">
              <span className="text-vx-muted text-[10px] uppercase font-semibold block mb-0.5">Uploaded By</span>
              <span className="text-vx-text font-medium">{evidence.uploadedBy?.name || evidence.uploadedBy?.email || 'Authorized Analyst'}</span>
            </div>
            <div className="bg-vx-card rounded-lg p-3 border border-vx-border">
              <span className="text-vx-muted text-[10px] uppercase font-semibold block mb-0.5">Upload Date</span>
              <span className="text-vx-text font-medium">{evidence.createdAt ? new Date(evidence.createdAt).toLocaleString() : '—'}</span>
            </div>
            {evidence.profile && (
              <div className="bg-vx-card rounded-lg p-3 border border-vx-border col-span-2">
                <span className="text-vx-muted text-[10px] uppercase font-semibold block mb-0.5">Linked Target Profile</span>
                <span className="text-vx-accent font-mono font-medium">
                  @{typeof evidence.profile === 'object' ? evidence.profile.username : evidence.profile}
                  {evidence.profile?.platform ? ` (${evidence.profile.platform})` : ''}
                </span>
              </div>
            )}
            {evidence.report && (
              <div className="bg-vx-card rounded-lg p-3 border border-vx-border col-span-2">
                <span className="text-vx-muted text-[10px] uppercase font-semibold block mb-0.5">Associated Case / Report</span>
                <span className="text-sky-400 font-mono font-medium">
                  {typeof evidence.report === 'object' ? (evidence.report.caseId || evidence.report.title || 'Linked Report') : evidence.report}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-vx-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-vx-secondary border border-vx-border hover:border-vx-border-s text-vx-text transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UploadPanel({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [profileId, setProfileId] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [evidenceType, setEvidenceType] = useState('screenshot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    profileService.getProfiles({ limit: 50 })
      .then(r => { if (r.success) setProfiles(r.data || []); })
      .catch(() => {});
  }, []);

  const handleFile = (f) => {
    setError('');
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('File type not allowed. Supported formats: JPEG, PNG, WebP, GIF, or PDF.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(`File exceeds limit. Maximum 5MB allowed. Selected file: ${(f.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!description || description.trim().length < 10) {
      setError('Description must be at least 10 characters detailing forensic context');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('description', description.trim());
      fd.append('evidenceType', evidenceType);
      if (profileId) fd.append('profileId', profileId);

      const res = await evidenceService.uploadEvidence(fd);
      if (res.success) {
        setSuccess('Forensic evidence uploaded and indexed successfully.');
        setFile(null);
        setDescription('');
        setProfileId('');
        onUploaded();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.message || 'Upload was rejected by server');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.userMessage || 'Upload failed. Please verify network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-vx-card border border-vx-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-vx-border">
        <div>
          <span className="text-[10px] font-semibold text-vx-accent uppercase tracking-wider block">Artifact Ingestion</span>
          <h3 className="text-vx-text font-semibold text-sm">Upload Forensic Evidence</h3>
        </div>
        <span className="text-xs text-vx-muted font-mono">Max 5MB · Cryptographically Logged</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-green-400 text-xs">{success}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-vx-accent bg-vx-accent-s/20 scale-[0.99]'
            : file
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-vx-border hover:border-vx-border-s hover:bg-vx-secondary/30'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
          onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            {file.type.startsWith('image/') ? (
              <Image className="w-7 h-7 text-green-400" />
            ) : (
              <FileText className="w-7 h-7 text-violet-400" />
            )}
            <div className="text-left">
              <p className="text-vx-text font-medium text-xs truncate max-w-sm">{file.name}</p>
              <p className="text-vx-muted text-[11px] font-mono">{(file.size / 1024).toFixed(0)} KB · {file.type}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="ml-2 text-vx-muted hover:text-red-400 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-vx-muted mx-auto mb-2 opacity-80" />
            <p className="text-vx-text text-xs font-medium">Drag & drop forensic artifact here or click to browse</p>
            <p className="text-vx-muted text-[11px] mt-1 font-mono">JPEG, PNG, WebP, GIF, PDF up to 5MB</p>
          </>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <div>
          <label className="text-[10px] font-semibold text-vx-muted uppercase tracking-wider block mb-1">
            Forensic Description * <span className="font-normal text-vx-muted lowercase">(min 10 characters)</span>
          </label>
          <textarea
            className="w-full bg-vx-secondary/60 border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text placeholder-vx-muted focus:outline-none focus:border-vx-accent focus:ring-1 focus:ring-vx-accent/30 resize-none transition-colors"
            rows={2}
            placeholder="Document what this evidence demonstrates (e.g. matching bot-cluster profile banners, automated tweet frequency)..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-vx-muted uppercase tracking-wider block mb-1">Evidence Type</label>
            <select
              className="w-full bg-vx-secondary/60 border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text focus:outline-none focus:border-vx-accent focus:ring-1 focus:ring-vx-accent/30 transition-colors"
              value={evidenceType}
              onChange={e => setEvidenceType(e.target.value)}
            >
              <option value="screenshot">Screenshot</option>
              <option value="document">Document</option>
              <option value="report">Report</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-vx-muted uppercase tracking-wider block mb-1">Associated Profile</label>
            <select
              className="w-full bg-vx-secondary/60 border border-vx-border rounded-lg px-3 py-2 text-xs text-vx-text focus:outline-none focus:border-vx-accent focus:ring-1 focus:ring-vx-accent/30 transition-colors"
              value={profileId}
              onChange={e => setProfileId(e.target.value)}
            >
              <option value="">None (Unassigned)</option>
              {profiles.map(p => (
                <option key={p._id} value={p._id}>@{p.username} ({p.platform || 'General'})</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-vx-accent to-vx-accent-d text-white font-medium text-xs shadow-[0_2px_10px_rgba(255,77,31,0.25)] hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting Artifact…</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Upload to Evidence Vault</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Evidence() {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '' });

  const canUpload = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        evidenceService.getEvidence({ page, limit: 20 }),
        evidenceService.getStatistics(),
      ]);
      if (listRes?.success) {
        setEvidence(listRes.data || []);
        setTotalPages(listRes.pagination?.pages || 1);
      }
      if (statsRes?.success) {
        setStats(statsRes.data);
      }
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await evidenceService.deleteEvidence(toDelete._id);
      setToDelete(null);
      fetchData();
    } catch {}
  };

  // Client-side search and type filter
  const filtered = evidence.filter(item => {
    const searchTarget = `${item.originalName || ''} ${item.description || ''} ${item.evidenceType || ''} ${item.profile?.username || ''} ${item.uploadedBy?.name || ''}`.toLowerCase();
    const matchSearch = filters.search
      ? searchTarget.includes(filters.search.toLowerCase())
      : true;

    const matchType = filters.type
      ? filters.type === 'image'
        ? item.mimeType?.startsWith('image/')
        : filters.type === 'document'
        ? item.mimeType === 'application/pdf'
        : item.evidenceType === filters.type
      : true;

    return matchSearch && matchType;
  });

  const columns = [
    {
      key: 'originalName',
      label: 'Artifact / File Name',
      render: (v, row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-vx-secondary flex items-center justify-center shrink-0 border border-vx-border">
            {row.mimeType?.startsWith('image/') ? (
              <Image className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            )}
          </div>
          <div className="min-w-0 truncate">
            <span className="text-vx-text text-xs font-medium truncate block max-w-xs">{v}</span>
            {row.profile && (
              <span className="text-vx-accent text-[10px] font-mono block truncate">
                @{typeof row.profile === 'object' ? row.profile.username : row.profile}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'evidenceType',
      label: 'Type',
      render: (v) => (
        <span className="px-2 py-0.5 text-2xs font-mono font-medium rounded-md bg-vx-secondary text-vx-sub border border-vx-border uppercase">
          {v || 'Artifact'}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Forensic Description',
      render: (v) => <p className="text-vx-muted text-xs truncate max-w-sm">{v || '—'}</p>,
    },
    {
      key: 'fileSize',
      label: 'Size',
      render: (v) => (
        <span className="text-vx-muted text-xs font-mono">
          {v ? `${(v / 1024).toFixed(0)} KB` : '—'}
        </span>
      ),
    },
    {
      key: 'uploadedBy',
      label: 'Investigator',
      render: (v) => <span className="text-vx-sub text-xs">{v?.name || v?.email || '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date Logged',
      render: (v) => (
        <span className="text-vx-muted text-xs font-mono">
          {v ? new Date(v).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedItem(row)}
            className="flex items-center gap-1 text-vx-accent hover:text-vx-accent-d text-xs font-medium transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          {canUpload && (
            <button
              onClick={() => setToDelete(row)}
              className="text-vx-muted hover:text-red-400 transition-colors p-1 rounded cursor-pointer"
              title="Delete evidence"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Stats bar */}
      <EvidenceStatsBar
        stats={stats}
        activeType={filters.type}
        onSelectType={(type) => setFilters(f => ({ ...f, type: f.type === type ? '' : type }))}
      />

      {/* Upload Panel */}
      {canUpload && <UploadPanel onUploaded={fetchData} />}

      {/* Vault Table Card */}
      <div className="bg-vx-card border border-vx-border rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-vx-border">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-vx-text font-semibold text-sm">Evidence Vault</h3>
                <span className="px-2 py-0.5 text-2xs font-mono font-medium rounded-full bg-vx-accent-s text-vx-accent border border-vx-accent/25">
                  {filtered.length} total
                </span>
              </div>
              <p className="text-vx-muted text-xs mt-0.5">Cryptographically logged evidence items and forensic captures.</p>
            </div>
          </div>

          {/* Search toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vx-muted" />
              <input
                type="text"
                placeholder="Search evidence or target…"
                className="w-full bg-vx-secondary/60 border border-vx-border rounded-lg pl-8 pr-7 py-1.5 text-xs text-vx-text placeholder-vx-muted focus:outline-none focus:border-vx-accent transition-colors"
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
            {filters.type && (
              <button
                onClick={() => setFilters(f => ({ ...f, type: '' }))}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-vx-secondary border border-vx-border text-vx-accent hover:border-vx-accent/30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Clear filter <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={fetchData}
              className="p-1.5 text-vx-muted hover:text-vx-text rounded-lg bg-vx-secondary border border-vx-border hover:border-vx-border-s transition-colors cursor-pointer"
              title="Refresh evidence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyTitle="No evidence records found"
          emptyDescription="Upload screenshots or documents to support your profile investigation."
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <EvidenceDetailModal
            evidence={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!toDelete}
        title="Delete Evidence"
        message={`Are you sure you want to delete "${toDelete?.originalName}"? This forensic artifact will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </motion.div>
  );
}