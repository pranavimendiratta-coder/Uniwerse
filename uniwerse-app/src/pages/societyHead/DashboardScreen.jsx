import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;
const ANALYTICS_API = `${import.meta.env.VITE_API_URL}/api/analytics/society`;
const SOCIETY_CHAT_API = `${import.meta.env.VITE_API_URL}/api/society-chat`;
const HEALTH_API = `${import.meta.env.VITE_API_URL}/api/analytics/health-score`;

function colorForScore(score) {
  if (score >= 75) return 'green';
  if (score >= 45) return 'amber';
  return 'red';
}
export default function DashboardScreen() {
  const { token, society: societyName, email } = useAuth();

  const [society, setSociety] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [socRes, analyticsRes, threadsRes, healthRes] = await Promise.all([
          fetch(`${SOCIETIES_API}/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(ANALYTICS_API, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${SOCIETY_CHAT_API}/threads`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(HEALTH_API, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const socData = await socRes.json();
        const analyticsData = await analyticsRes.json();
        const threadsData = await threadsRes.json();
        const healthData = await healthRes.json();
if (healthRes.ok) setHealth(healthData);

        if (socRes.ok) setSociety(socData);
        if (analyticsRes.ok) setAnalytics(analyticsData);
        if (threadsRes.ok) {
          const withMessages = threadsData
            .filter((t) => t.lastMessage)
            .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
            .slice(0, 4);
          setRecentUpdates(withMessages);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [token]);

  if (isLoading) {
    return <div className="shd-page"><p>Loading dashboard…</p></div>;
  }

  if (!society || !analytics) {
    return <div className="shd-page"><p>Could not load dashboard.</p></div>;
  }

  const { eventPerformance, totalEventsConducted, averageAttendance } = analytics;
  const activeRegistrations = eventPerformance.reduce((sum, e) => sum + e.registered, 0);

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="shd-page">
      <section className="shd-card shd-welcome" style={{ marginBottom: 18 }}>
        <div className="shd-welcome-logo">{society.logoInitials}</div>
        <div className="shd-welcome-text">
          <h1>Welcome back 👋</h1>
          <p>Society Head · {society.name}</p>
        </div>
      </section>

      <div className="shd-grid">
        <section className="shd-stat-card">
          <span className="shd-stat-label">Total Members</span>
          <span className="shd-stat-value">{society.membersCount}</span>
        </section>
        <section className="shd-stat-card">
          <span className="shd-stat-label">Total Events Conducted</span>
          <span className="shd-stat-value">{totalEventsConducted}</span>
        </section>
        <section className="shd-stat-card">
          <span className="shd-stat-label">Active Registrations</span>
          <span className="shd-stat-value">{activeRegistrations}</span>
          <span className="shd-stat-delta">across {totalEventsConducted} events</span>
        </section>
        <section className="shd-stat-card">
          <span className="shd-stat-label">Average Attendance</span>
          <span className="shd-stat-value">{averageAttendance}</span>
        </section>
        {health && (
  <section className="shd-card health-card span-2">
    <h2 className="shd-card-title">Society Health Score</h2>
    <p className="shd-hint">AI-generated from your real event, attendance, and participation data.</p>
    <div className="health-ring-wrap">
      <svg viewBox="0 0 120 120" className="health-ring">
        <circle cx="60" cy="60" r="54" className="ring-track" />
        <circle
          cx="60" cy="60" r="54"
          className={`ring-fill c-${colorForScore(health.score)}`}
          strokeDasharray={`${(health.score / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" className="ring-score">{health.score}</text>
        <text x="60" y="74" textAnchor="middle" className="ring-max">/ 100</text>
      </svg>
      <span className={`health-pill c-${colorForScore(health.score)}`}>{health.label}</span>
    </div>
    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>{health.summary}</p>
  </section>
)}

        <section className="shd-card span-2">
          <h2 className="shd-card-title">Event Performance</h2>
          <p className="shd-hint">Read-only — event management stays with your POCs.</p>
          {eventPerformance.length === 0 ? (
            <p style={{ color: 'var(--muted)', padding: '10px 0' }}>No events yet.</p>
          ) : (
            <div className="event-list">
              {eventPerformance.map((e) => (
                <div className="event-row" key={e.event}>
                  <div className="event-info">
                    <span className="event-name">{e.event}</span>
                    <span className="event-date">{e.attended} checked in</span>
                  </div>
                  <div className="event-fill-track">
                    <div className="event-fill" style={{ width: `${e.registered > 0 ? Math.min(100, (e.attended / e.registered) * 100) : 0}%` }} />
                  </div>
                  <span className="event-count">{e.registered} registered</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="shd-card span-2">
          <h2 className="shd-card-title">Recent Updates from Society POCs</h2>
          {recentUpdates.length === 0 ? (
            <p style={{ color: 'var(--muted)', padding: '10px 0' }}>No messages yet — updates from your POCs will appear here.</p>
          ) : (
            <div className="update-list">
              {recentUpdates.map((u) => (
                <div className="update-row" key={u.pocId}>
                  <div className="update-avatar">
                    {u.pocName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="update-body">
                    <span className="update-text"><b>{u.pocName}</b> — {u.lastMessage}</span>
                    <span className="update-time">{timeAgo(u.lastAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}