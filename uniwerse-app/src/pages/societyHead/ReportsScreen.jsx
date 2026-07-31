import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const REPORTS_API = `${import.meta.env.VITE_API_URL}/api/reports`;

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReportsScreen() {
  const showToast = useToast();
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  async function loadReports() {
    try {
      const res = await fetch(REPORTS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load reports');
      setReports(data);
    } catch (err) {
      showToast(err.message || 'Failed to load reports archive');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleAddReportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same filename later
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('File is too large — max size is 20MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch(REPORTS_API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setReports((prev) => [data, ...prev]);
      showToast('File added: ' + data.fileName);
    } catch (err) {
      showToast(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(report) {
    try {
      const res = await fetch(`${REPORTS_API}/${report._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Failed to download file');
    }
  }

  async function handleDelete(report) {
    if (!window.confirm(`Delete "${report.fileName}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${REPORTS_API}/${report._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');

      setReports((prev) => prev.filter((r) => r._id !== report._id));
      showToast('File deleted: ' + report.fileName);
    } catch (err) {
      showToast(err.message || 'Failed to delete file');
    }
  }

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Society Reports Archive</h1>
          <p className="shd-subtitle">
            Store and manage your society's reports, documents, and files in one place.
          </p>
        </div>
        <button
          type="button"
          className="add-report-btn"
          onClick={handleAddReportClick}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading…' : '+ Add Report'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="add-report-input-hidden"
          onChange={handleFileSelected}
        />
      </div>

      <section className="shd-card">
        {isLoading ? (
          <p style={{ opacity: 0.7 }}>Loading archive…</p>
        ) : reports.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No files in the archive yet. Click "+ Add Report" to upload one.</p>
        ) : (
          <div className="report-list">
            {reports.map((r) => (
              <div className="report-row" key={r._id}>
                <div className="report-info">
                  <span className="report-name">{r.fileName}</span>
                  <span className="report-meta">
                    {formatDate(r.createdAt)} · {formatSize(r.size)}
                    {r.uploadedByName ? ` · Uploaded by ${r.uploadedByName}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="shd-btn small" onClick={() => handleDownload(r)}>
                    ⬇ Download
                  </button>
                  <button
                    className="shd-btn small"
                    style={{ color: '#c0392b', borderColor: '#c0392b' }}
                    onClick={() => handleDelete(r)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}