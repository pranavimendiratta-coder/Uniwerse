import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const APPLICATIONS_API = `${import.meta.env.VITE_API_URL}/api/applications`;

const STAGES = ['Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected'];

function downloadReport(applications, society) {
  const rows = [
    ['Name', 'Email', 'Role Interest', 'Stage', 'Applied On'],
    ...applications.map((a) => [a.applicantName, a.applicantEmail, a.roleInterest, a.stage, new Date(a.createdAt).toLocaleDateString()]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `recruitment-report-${society}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RecruitmentScreen() {
  const { token, society } = useAuth();
  const showToast = useToast();

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      if (!society) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${APPLICATIONS_API}?society=${encodeURIComponent(society)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setApplications(data);
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadApplications();
  }, [society, token]);

  async function updateStage(id, stage) {
    try {
      const res = await fetch(`${APPLICATIONS_API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');

      setApplications((prev) => prev.map((a) => (a._id === id ? data : a)));
      showToast(`Marked as ${stage}`);
    } catch (err) {
      showToast(err.message);
    }
  }

  const counts = {
    applied: applications.length,
    shortlisted: applications.filter((a) => ['Shortlisted', 'Interviewed', 'Selected'].includes(a.stage)).length,
    interviewed: applications.filter((a) => ['Interviewed', 'Selected'].includes(a.stage)).length,
    selected: applications.filter((a) => a.stage === 'Selected').length,
  };

  const funnelSteps = [
    { label: 'Applications Received', value: counts.applied },
    { label: 'Shortlisted', value: counts.shortlisted },
    { label: 'Interviews Completed', value: counts.interviewed },
    { label: 'Selected Members', value: counts.selected },
  ];

  if (isLoading) {
    return <div className="shd-page"><p>Loading recruitment data…</p></div>;
  }

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Recruitment Dashboard</h1>
          <p className="shd-subtitle">Review and move applicants through your recruitment pipeline.</p>
        </div>
        <button type="button" className="shd-btn primary" onClick={() => downloadReport(applications, society)}>
          Download Report
        </button>
      </div>

      <div className="shd-grid" style={{ marginBottom: 18 }}>
        <div className="shd-stat-card">
          <span className="shd-stat-label">Applications</span>
          <span className="shd-stat-value">{counts.applied}</span>
        </div>
        <div className="shd-stat-card">
          <span className="shd-stat-label">Shortlisted</span>
          <span className="shd-stat-value">{counts.shortlisted}</span>
        </div>
        <div className="shd-stat-card">
          <span className="shd-stat-label">Interviewed</span>
          <span className="shd-stat-value">{counts.interviewed}</span>
        </div>
        <div className="shd-stat-card">
          <span className="shd-stat-label">Selected</span>
          <span className="shd-stat-value">{counts.selected}</span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="shd-empty">No applications yet.</div>
      ) : (
        <>
          <div className="shd-grid" style={{ marginBottom: 18 }}>
            <section className="shd-card span-4">
              <h2 className="shd-card-title">Recruitment Funnel</h2>
              <div className="funnel">
                {funnelSteps.map((s) => (
                  <div className="funnel-row" key={s.label}>
                    <span className="funnel-label">{s.label}</span>
                    <div className="funnel-track">
                      <div
                        className="funnel-fill c-purple"
                        style={{ width: `${counts.applied > 0 ? (s.value / counts.applied) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="funnel-value">{s.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="shd-card">
            <h2 className="shd-card-title">Applicants</h2>
            <table>
              <tbody>
                <tr><th>Name</th><th>Email</th><th>Role Interest</th><th>Message</th><th>Stage</th></tr>
                {applications.map((a) => (
                  <tr key={a._id}>
                    <td className="ev-name">{a.applicantName}</td>
                    <td>{a.applicantEmail}</td>
                    <td>{a.roleInterest || '—'}</td>
                    <td style={{ maxWidth: 220 }}>{a.message || '—'}</td>
                    <td>
                      <select
                        className="ev-input"
                        style={{ padding: '4px 8px', fontSize: 12.5 }}
                        value={a.stage}
                        onChange={(e) => updateStage(a._id, e.target.value)}
                      >
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}