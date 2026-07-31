import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audiencePill } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

export default function DashboardScreen() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { token, pocOf } = useAuth();
  const managedSociety = pocOf && pocOf[0];

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeEvent, setActiveEvent] = useState(null);
  const [mode, setMode] = useState('view');
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      if (!managedSociety) { setIsLoading(false); return; }
      try {
        const socRes = await fetch(SOCIETIES_API);
        const societies = await socRes.json();
        const society = societies.find((s) => s.name === managedSociety);
        if (!society) { setIsLoading(false); return; }

        const res = await fetch(`${EVENTS_API}?society=${society._id}`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, [managedSociety]);

  function openView(ev) {
    setActiveEvent(ev);
    setMode('view');
  }

  function openEdit(ev) {
    setActiveEvent(ev);
    setMode('edit');
    setFormData({
      title: ev.title || '',
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 10) : '',
      registrationDeadline: ev.registrationDeadline ? new Date(ev.registrationDeadline).toISOString().slice(0, 10) : '',
      about: ev.about || '',
      category: ev.category || '',
      audience: ev.audience || 'igdtuw',
      venue: ev.venue || '',
    });
  }

  function closeModal() {
    setActiveEvent(null);
    setFormData(null);
  }

  function handleFormChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEdit() {
    setIsSaving(true);
    try {
      const res = await fetch(`${EVENTS_API}/${activeEvent._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Failed to update event');

      setEvents((prev) => prev.map((ev) => (ev._id === updated._id ? updated : ev)));
      showToast('Event updated!');
      closeModal();
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(eventId) {
    if (!window.confirm('Delete this event permanently? This cannot be undone.')) return;
    try {
      const res = await fetch(`${EVENTS_API}/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete event');

      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
      showToast('Event deleted');
      closeModal();
    } catch (err) {
      showToast(err.message);
    }
  }

  const liveEventsCount = events.length;
  const totalRegistered = events.reduce((sum, ev) => sum + (ev.registeredStudents?.length || 0), 0);
  const totalCheckedIn = events.reduce((sum, ev) => sum + (ev.checkedInStudents?.length || 0), 0);
  const attendanceRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  // real mini chart: registrations per event, in creation order
  const chartPoints = events.map((ev) => ev.registeredStudents?.length || 0);
  const maxChartVal = Math.max(1, ...chartPoints);
  const chartWidth = 260;
  const chartHeight = 130;
  const stepX = chartPoints.length > 1 ? chartWidth / (chartPoints.length - 1) : 0;
  const polylinePoints = chartPoints
    .map((v, i) => `${i * stepX},${chartHeight - (v / maxChartVal) * (chartHeight - 15)}`)
    .join(' ');

  return (
    <div className="page-pad">
      <div className="page-head">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        <div className="card stat-tile"><div className="num">{liveEventsCount}</div><div className="lbl">Live Events</div></div>
        <div className="card stat-tile"><div className="num">{totalRegistered}</div><div className="lbl">Registered</div></div>
        <div className="card stat-tile"><div className="num">{totalCheckedIn}</div><div className="lbl">Checked In</div></div>
        <div className="card stat-tile"><div className="num">{attendanceRate}%</div><div className="lbl">Attendance</div></div>
      </div>

      <div className="dash-cols">
        <div className="card dash-main">
          <div className="section-head"><h3>Society Events</h3><a>View all →</a></div>
          {isLoading ? (
            <p style={{ padding: 16 }}>Loading events…</p>
          ) : events.length === 0 ? (
            <p style={{ padding: 16, color: 'var(--muted)' }}>No events yet — create your first one!</p>
          ) : (
            <table>
              <tbody>
                <tr><th>Event</th><th>Date</th><th>Reg.</th><th>Audience</th><th>Actions</th></tr>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td className="ev-name">{ev.title}</td>
                    <td>{ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</td>
                    <td>{ev.registeredStudents?.length || 0}</td>
                    <td><span className={audiencePill[ev.audience].className}>{audiencePill[ev.audience].label}</span></td>
                    <td className="row-actions">
                      <button className="btn outline sm" onClick={() => openEdit(ev)}>Edit</button>
                      <button className="btn outline sm" onClick={() => openView(ev)}>View</button>
                      <button className="btn outline sm" onClick={() => handleDelete(ev._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-side">
          <div className="card chart-card">
            <h4>Registrations by Event</h4>
            {chartPoints.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>No events yet.</p>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="130">
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C74E63" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#C74E63" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartPoints.length > 1 ? (
                  <>
                    <polyline points={polylinePoints} fill="none" stroke="#C74E63" strokeWidth="2.5" />
                    <polygon points={`0,${chartHeight} ${polylinePoints} ${chartWidth},${chartHeight}`} fill="url(#areaFill)" />
                  </>
                ) : (
                  <circle cx={chartWidth / 2} cy={chartHeight - (chartPoints[0] / maxChartVal) * (chartHeight - 15)} r="4" fill="#C74E63" />
                )}
              </svg>
            )}
          </div>
          <div className="card chart-card quick-actions">
            <h4>Quick Actions</h4>
            <button className="btn block" onClick={() => navigate('/society/create')}>+ Create New Event</button>
            <button className="btn outline block" onClick={() => navigate('/society/qr')}>Generate QR Code</button>
            <button className="btn outline block" onClick={() => navigate('/society/tasks')}>Open Task Board</button>
          </div>
        </div>
      </div>

      {activeEvent && (
        <div className="ev-modal-overlay" onClick={closeModal}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ev-modal-head">
              <h3>{mode === 'edit' ? 'Edit Event' : activeEvent.title}</h3>
              <button className="ev-modal-close" onClick={closeModal}>✕</button>
            </div>

            {mode === 'view' ? (
              <div className="ev-modal-body">
                <div className="ev-field">
                  <span className="ev-field-lbl">Date</span>
                  <span className="ev-field-val">{activeEvent.date ? new Date(activeEvent.date).toLocaleDateString() : '—'}</span>
                </div>
                <div className="ev-field">
                  <span className="ev-field-lbl">Registration Deadline</span>
                  <span className="ev-field-val">{activeEvent.registrationDeadline ? new Date(activeEvent.registrationDeadline).toLocaleDateString() : '—'}</span>
                </div>
                <div className="ev-field">
                  <span className="ev-field-lbl">Category</span>
                  <span className="ev-field-val">{activeEvent.category || 'Not specified'}</span>
                </div>
                <div className="ev-field">
                  <span className="ev-field-lbl">Audience</span>
                  <span className={audiencePill[activeEvent.audience]?.className}>
                    {audiencePill[activeEvent.audience]?.label || activeEvent.audience}
                  </span>
                </div>
                <div className="ev-field">
                  <span className="ev-field-lbl">Venue</span>
                  <span className="ev-field-val">{activeEvent.venue || 'TBD'}</span>
                </div>
                <div className="ev-field">
                  <span className="ev-field-lbl">Registered</span>
                  <span className="ev-field-val">{activeEvent.registeredStudents?.length ?? 0}</span>
                </div>
                <div className="ev-field">
                  <span className="ev-field-lbl">Checked In</span>
                  <span className="ev-field-val">{activeEvent.checkedInStudents?.length ?? 0}</span>
                </div>
                <div className="ev-field ev-field-block">
                  <span className="ev-field-lbl">Description</span>
                  <p className="ev-field-desc">
                    {activeEvent.about || 'No description added yet for this event.'}
                  </p>
                </div>

                <div className="ev-modal-actions">
                  <button className="btn outline sm" onClick={() => handleDelete(activeEvent._id)}>Delete Event</button>
                  <button className="btn outline sm" onClick={() => setMode('edit')}>Edit Event</button>
                  <button className="btn sm" onClick={closeModal}>Close</button>
                </div>
              </div>
            ) : (
              <div className="ev-modal-body">
                <label className="ev-input-lbl">
                  Title
                  <input
                    className="ev-input"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                  />
                </label>

                <label className="ev-input-lbl">
                  Date
                  <input
                    className="ev-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </label>

                <label className="ev-input-lbl">
                  Registration Deadline
                  <input
                    className="ev-input"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => handleFormChange('registrationDeadline', e.target.value)}
                  />
                </label>

                <label className="ev-input-lbl">
                  Category
                  <input
                    className="ev-input"
                    placeholder="e.g. Workshop, Hackathon, Talk"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  />
                </label>

                <label className="ev-input-lbl">
                  Venue
                  <input
                    className="ev-input"
                    placeholder="e.g. Seminar Hall 2"
                    value={formData.venue}
                    onChange={(e) => handleFormChange('venue', e.target.value)}
                  />
                </label>

                <label className="ev-input-lbl">
                  Audience
                  <select
                    className="ev-input"
                    value={formData.audience}
                    onChange={(e) => handleFormChange('audience', e.target.value)}
                  >
                    {Object.keys(audiencePill).map((key) => (
                      <option key={key} value={key}>{audiencePill[key].label}</option>
                    ))}
                  </select>
                </label>

                <label className="ev-input-lbl">
                  Description
                  <textarea
                    className="ev-input ev-textarea"
                    rows={4}
                    placeholder="What is this event about?"
                    value={formData.about}
                    onChange={(e) => handleFormChange('about', e.target.value)}
                  />
                </label>

                <div className="ev-modal-actions">
                  <button className="btn outline sm" onClick={closeModal}>Cancel</button>
                  <button className="btn sm" disabled={isSaving} onClick={saveEdit}>
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}