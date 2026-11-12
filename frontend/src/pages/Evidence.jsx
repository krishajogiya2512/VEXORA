import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Image, X, Loader2, AlertCircle, Check } from 'lucide-react';
import { evidenceService } from '../services/evidenceService';
import { profileService } from '../services/profileService';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

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
      <h3 className="text-vx-text font-semibold mb-5">Upload Evidence</h3>

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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging ? 'border-vx-blue bg-vx-blue/10' : file ? 'border-green-500/40 bg-green-500/5' : 'border-vx-border hover:border-vx-blue/50 hover:bg-vx-blue/5'
        }`}
      >
        <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            {file.type.startsWith('image/') ? <Image className="w-8 h-8 text-green-400" /> : <FileText className="w-8 h-8 text-blue-400" />}
            <div className="text-left">
              <p className="text-vx-text font-medium text-sm">{file.name}</p>
              <p className="text-vx-muted text-xs">{(file.size / 1024).toFixed(0)} KB · {file.type}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 text-vx-muted hover:text-vx-danger">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-vx-muted mx-auto mb-3" />
            <p className="text-vx-text text-sm font-medium">Drop file here or click to browse</p>
            <p className="text-vx-muted text-xs mt-1">JPEG, PNG, WebP, GIF, PDF · Max 5MB</p>
          </>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="label">Description * <span className="text-vx-muted">(min 10 characters)</span></label>
          <textarea className="input resize-none" rows={3} placeholder="Describe what this evidence shows..." value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Evidence</>}
        </button>
      </div>
    </div>
  );
}

export default function Evidence() {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const canUpload = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await evidenceService.getEvidence({ page, limit: 20 });
      if (res.success) { setEvidence(res.data); setTotalPages(res.pagination?.pages || 1); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchEvidence(); }, [page]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await evidenceService.deleteEvidence(toDelete._id);
      setToDelete(null);
      fetchEvidence();
    } catch {}
  };

  const columns = [
    { key: 'originalName', label: 'File', render: (v, row) => (
      <div className="flex items-center gap-2">
        {row.mimeType?.startsWith('image/') ? <Image className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />}
        <span className="text-vx-text text-sm truncate max-w-32">{v}</span>
      </div>
    )},
    { key: 'evidenceType', label: 'Type', render: (v) => <span className="badge bg-vx-secondary text-vx-muted capitalize">{v}</span> },
    { key: 'description', label: 'Description', render: (v) => <p className="text-vx-muted text-xs truncate max-w-40">{v}</p> },
    { key: 'fileSize', label: 'Size', render: (v) => <span className="text-vx-muted text-xs">{(v / 1024).toFixed(0)} KB</span> },
    { key: 'uploadedBy', label: 'Uploaded By', render: (v) => <span className="text-vx-muted text-xs">{v?.name || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => <span className="text-vx-muted text-xs">{new Date(v).toLocaleDateString()}</span> },
    { key: '_id', label: 'Actions', render: (_, row) => canUpload && (
      <button onClick={() => setToDelete(row)} className="text-vx-danger/80 hover:text-vx-danger transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      {canUpload && <UploadPanel onUploaded={fetchEvidence} />}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-vx-border">
          <h3 className="text-vx-text font-semibold">Evidence Library</h3>
          <p className="text-vx-muted text-xs mt-0.5">All uploaded evidence files. Access is restricted to authorized users.</p>
        </div>
        <DataTable
          columns={columns} data={evidence} loading={loading}
          emptyTitle="No evidence uploaded" emptyDescription="Upload screenshots or documents to support your investigations."
          page={page} totalPages={totalPages} onPageChange={setPage}
        />
      </div>
      <ConfirmationModal
        isOpen={!!toDelete}
        title="Delete Evidence"
        message={`Are you sure you want to delete "${toDelete?.originalName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
