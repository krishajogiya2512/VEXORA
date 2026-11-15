import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Trash2, FileText, Image, X, Loader2, AlertCircle, Check,
  Search, RefreshCw, Eye, Download, HardDrive, Shield, Filter, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evidenceService } from '../services/evidenceService';
import { profileService } from '../services/profileService';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

function EvidenceStatsBar({ stats, activeType, onSelectType }) {
  const items = [
    { label: 'Total Files', value: stats?.total ?? 0, color: 'text-vx-text', bg: 'bg-vx-secondary/60', key: '', icon: HardDrive },
    { label: 'Images', value: stats?.images ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10', key: 'image', icon: Image },
    { label: 'Documents / PDFs', value: stats?.documents ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10', key: 'document', icon: FileText },
    { label: 'Screenshots', value: stats?.byType?.screenshot ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10', key: 'screenshot', icon: Eye },
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
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectType(item.key)}
            className={`card text-left p-4 cursor-pointer transition-all border ${
              isActive ? 'border-vx-blue ring-1 ring-vx-blue/50' : 'border-vx-border hover:border-vx-border/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-vx-muted text-xs font-medium">{item.label}</span>
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative card w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 border-b border-vx-border pb-3">
          <div className="flex items-center gap-2">
            {isImage ? <Image className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-purple-400" />}
            <h3 className="text-vx-text font-semibold text-base truncate max-w-sm">{evidence.originalName}</h3>
          </div>
          <button onClick={onClose} className="text-vx-muted hover:text-vx-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-vx-secondary text-vx-text font-mono uppercase">{evidence.evidenceType}</span>
            <span className="badge bg-vx-blue/15 text-vx-blue border border-vx-blue/30">{evidence.mimeType}</span>
            <span className="badge bg-vx-secondary text-vx-muted">{(evidence.fileSize / 1024).toFixed(1)} KB</span>
          </div>

          {/* Description */}
          <div className="bg-vx-secondary/40 rounded-xl p-4 border border-vx-border/50">
            <p className="text-vx-muted text-xs font-semibold uppercase tracking-wider mb-1">Description</p>
            <p className="text-vx-text text-sm leading-relaxed">{evidence.description}</p>
          </div>

          {/* Detail specs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-vx-secondary/30 rounded-lg p-3">
              <span className="text-vx-muted block mb-0.5">Uploaded By</span>
              <span className="text-vx-text font-medium">{evidence.uploadedBy?.name || 'Authorized Analyst'}</span>
            </div>
            <div className="bg-vx-secondary/30 rounded-lg p-3">
              <span className="text-vx-muted block mb-0.5">Upload Date</span>
              <span className="text-vx-text font-medium">{new Date(evidence.createdAt).toLocaleString()}</span>
            </div>
            {evidence.profile && (
              <div className="bg-vx-secondary/30 rounded-lg p-3 col-span-2">
                <span className="text-vx-muted block mb-0.5">Linked Target Profile</span>
                <span className="text-vx-blue font-mono font-medium">@{evidence.profile.username || evidence.profile}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="btn-secondary text-sm">Close</button>
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
    profileService.getProfiles({ limit: 50 }).then(r => { if (r.success) setProfiles(r.data); }).catch(() => {});
  }, []);

  const handleFile = (f) => {
    setError('');
    if (!ALLOWED_TYPES.includes(f.type)) { setError('File type not allowed. Use JPEG, PNG, WebP, GIF, or PDF.'); return; }
    if (f.size > MAX_SIZE) { setError(`File too large. Maximum 5MB allowed. Your file: ${(f.size / 1024 / 1024).toFixed(1)}MB`); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    if (!description || description.length < 10) { setError('Description must be at least 10 characters'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('description', description);
      fd.append('evidenceType', evidenceType);
      if (profileId) fd.append('profileId', profileId);
      const res = await evidenceService.uploadEvidence(fd);
      if (res.success) {
        setSuccess('Evidence uploaded successfully');
        setFile(null); setDescription(''); setProfileId('');
        onUploaded();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-vx-text font-semibold mb-4">Upload Forensic Evidence</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5 mb-4">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
          dragging ? 'border-vx-blue bg-vx-blue/10' : file ? 'border-green-500/40 bg-green-500/5' : 'border-vx-border hover:border-vx-blue/50 hover:bg-vx-blue/5'
        }`}
      >
        <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            {file.type.startsWith('image/') ? <Image className="w-8 h-8 text-green-400" /> : <FileText className="w-8 h-8 text-purple-400" />}
            <div className="text-left">
              <p className="text-vx-text font-medium text-sm">{file.name}</p>
              <p className="text-vx-muted text-xs">{(file.size / 1024).toFixed(0)} KB · {file.type}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 text-vx-muted hover:text-vx-danger p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-9 h-9 text-vx-muted mx-auto mb-2" />
            <p className="text-vx-text text-sm font-medium">Drag and drop file here or click to browse</p>
            <p className="text-vx-muted text-xs mt-1">JPEG, PNG, WebP, GIF, PDF · Maximum size 5MB</p>
          </>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="label">Evidence Description * <span className="text-vx-muted font-normal">(min 10 characters)</span></label>
          <textarea className="input resize-none" rows={3} placeholder="Describe what this evidence shows..." value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Evidence Type</label>
            <select className="input" value={evidenceType} onChange={e => setEvidenceType(e.target.value)}>
              <option value="screenshot">Screenshot</option>
              <option value="document">Document</option>
              <option value="report">Report</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Associated Profile</label>
            <select className="input" value={profileId} onChange={e => setProfileId(e.target.value)}>
              <option value="">None</option>
              {profiles.map(p => <option key={p._id} value={p._id}>@{p.username} ({p.platform})</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleUpload} className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Evidence</>}
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
      if (listRes.success) {
        setEvidence(listRes.data);
        setTotalPages(listRes.pagination?.pages || 1);
      }
      if (statsRes?.success) {
        setStats(statsRes.data);
      }
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    const matchSearch = filters.search
      ? item.originalName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.evidenceType?.toLowerCase().includes(filters.search.toLowerCase())
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
      key: 'originalName', label: 'File Name',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {row.mimeType?.startsWith('image/') ? (
            <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
          )}
          <span className="text-vx-text text-sm font-medium truncate max-w-xs">{v}</span>
        </div>
      ),
    },
    {
      key: 'evidenceType', label: 'Type',
      render: (v) => <span className="badge bg-vx-secondary text-vx-muted font-mono uppercase">{v}</span>,
    },
    {
      key: 'description', label: 'Description',
      render: (v) => <p className="text-vx-muted text-xs truncate max-w-sm">{v}</p>,
    },
    {
      key: 'fileSize', label: 'Size',
      render: (v) => <span className="text-vx-muted text-xs font-mono">{(v / 1024).toFixed(0)} KB</span>,
    },
    {
      key: 'uploadedBy', label: 'Investigator',
      render: (v) => <span className="text-vx-muted text-xs">{v?.name || '—'}</span>,
    },
    {
      key: 'createdAt', label: 'Date',
      render: (v) => <span className="text-vx-muted text-xs">{new Date(v).toLocaleDateString()}</span>,
    },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedItem(row)}
            className="flex items-center gap-1 text-vx-blue hover:text-blue-400 text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          {canUpload && (
            <button
              onClick={() => setToDelete(row)}
              className="text-vx-danger/70 hover:text-vx-danger transition-colors p-1"
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
      transition={{ duration: 0.3 }}
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

      {/* Library */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-vx-border">
          <div>
            <h3 className="text-vx-text font-semibold">Evidence Vault</h3>
            <p className="text-vx-muted text-xs mt-0.5">Cryptographically logged evidence items and forensic captures.</p>
          </div>

          {/* Search toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vx-muted" />
              <input
                type="text"
                placeholder="Search evidence…"
                className="input pl-8 py-1.5 text-xs"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            {filters.type && (
              <button
                onClick={() => setFilters(f => ({ ...f, type: '' }))}
                className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-vx-blue"
              >
                Clear filter <X className="w-3 h-3" />
              </button>
            )}
            <button onClick={fetchData} className="btn-secondary text-xs py-1.5 px-2.5">
              <RefreshCw className="w-3 h-3" />
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
