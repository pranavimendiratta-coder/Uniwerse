import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ANALYTICS_API = `${import.meta.env.VITE_API_URL}/api/analytics/society`;

export default function AnalyticsScreen() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(ANALYTICS_API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok) setData(result);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [token]);

  if (isLoading) {
    return <div className="shd-page"><p>Loading analytics…</p></div>;
  }

  if (!data) {
    return <div className="shd-page"><p>Could not load analytics.</p></div>;
  }

  const { totalEventsConducted, eventPerformance, attendanceTrends, mostSuccessfulEvent, averageAttendance, totalParticipantsThisSemester, monthlyBreakdown } = data;

  const maxRegistered = Math.max(1, ...eventPerformance.map((r) => r.registered));
  const maxMonthlyEvents = Math.max(1, ...monthlyBreakdown.map((d) => d.events));
  const maxMonthlyReg = Math.max(1, ...monthlyBreakdown.map((d) => d.registrations));

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Society Performance</h1>
          <p className="shd-subtitle">Engagement, attendance, and growth — based on your real events.</p>
        </div>
      </div>

      <div className="shd-grid" style={{ marginBottom: 18 }}>
        <div className="insight-card">
          <span className="insight-label">Most Successful Event</span>
          <span className="insight-value">{mostSuccessfulEvent}</span>
        </div>
        <div className="insight-card">
          <span className="insight-label">Average Attendance</span>
          <span className="insight-value">{averageAttendance}</span>
        </div>
        <div className="insight-card">
          <span className="insight-label">Participants This Semester</span>
          <span className="insight-value">{totalParticipantsThisSemester}</span>
        </div>
        <div className="insight-card">
          <span className="insight-label">Total Events Conducted</span>
          <span className="insight-value">{totalEventsConducted}</span>
        </div>
      </div>

      {eventPerformance.length === 0 ? (
        <div className="shd-empty">No events yet — analytics will populate once you publish some.</div>
      ) : (
        <div className="shd-grid">
          <section className="shd-card span-4">
            <div className="shd-card-head">
              <h2 className="shd-card-title">Registrations by Month</h2>
            </div>
            <div className="bar-chart">
              {monthlyBreakdown.map((d) => (
                <div className="bar-col" key={d.month}>
                  <span className="bar-value">{d.registrations}</span>
                  <div className="bar-track">
                    <div className="bar-fill c-blue" style={{ height: `${(d.registrations / maxMonthlyReg) * 100}%` }} />
                  </div>
                  <span className="bar-label">{d.month}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="shd-card span-2">
            <h2 className="shd-card-title">Monthly Events Conducted</h2>
            <div className="bar-chart" style={{ height: 130 }}>
              {monthlyBreakdown.map((d) => (
                <div className="bar-col" key={d.month}>
                  <span className="bar-value">{d.events}</span>
                  <div className="bar-track">
                    <div className="bar-fill c-purple" style={{ height: `${(d.events / maxMonthlyEvents) * 100}%` }} />
                  </div>
                  <span className="bar-label">{d.month}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="shd-card span-3">
            <h2 className="shd-card-title">Event-wise Performance</h2>
            <div className="reg-list">
              {eventPerformance.map((r) => (
                <div className="reg-row" key={r.event}>
                  <span className="reg-name">{r.event}</span>
                  <div className="reg-track">
                    <div className="reg-fill c-pink" style={{ width: `${(r.registered / maxRegistered) * 100}%` }} />
                    {r.attended > 0 && (
                      <div className="reg-fill-inner c-green" style={{ width: `${(r.attended / maxRegistered) * 100}%` }} />
                    )}
                  </div>
                  <span className="reg-count">{r.registered}</span>
                </div>
              ))}
            </div>
            <div className="legend-row">
              <span className="legend-dot c-pink" /> Registered
              <span className="legend-dot c-green" /> Attended
            </div>
          </section>

          <section className="shd-card span-3">
            <h2 className="shd-card-title">Attendance Trends</h2>
            {attendanceTrends.length === 0 ? (
              <p style={{ color: 'var(--muted)', padding: '10px 0' }}>No check-ins recorded yet.</p>
            ) : (
              <div className="reg-list">
                {attendanceTrends.map((r) => (
                  <div className="reg-row" key={r.event}>
                    <span className="reg-name">{r.event}</span>
                    <div className="reg-track">
                      <div className="reg-fill c-blue" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="reg-count">{r.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}