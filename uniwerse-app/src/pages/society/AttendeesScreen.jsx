import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

export default function AttendeesScreen() {
  const { token, pocOf } = useAuth();
  const showToast = useToast();
  const managedSociety = pocOf && pocOf[0];

  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [checkinEmail, setCheckinEmail] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Load this POC's events once
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
        setMyEvents(data);
        if (data.length > 0) setSelectedEventId(data[0]._id);
        else setIsLoading(false);
      } catch (err) {
        console.error('Failed to load events', err);
        setIsLoading(false);
      }
    }
    loadEvents();
  }, [managedSociety]);

  // Load attendees whenever the selected event changes
  useEffect(() => {
    async function loadAttendees() {
      if (!selectedEventId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${EVENTS_API}/${selectedEventId}/attendees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load attendees');
        setAttendees(data);
      } catch (err) {
        showToast(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadAttendees();
  }, [selectedEventId, token]);

  const filteredAttendees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter((a) =>
      a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [search, attendees]);

  const stats = useMemo(() => {
    const checkedIn = filteredAttendees.filter((a) => a.checkedIn).length;
    const pending = filteredAttendees.length - checkedIn;
    return { registered: filteredAttendees.length, checkedIn, pending };
  }, [filteredAttendees]);

  const selectedEvent = myEvents.find((e) => e._id === selectedEventId);

  async function handleCheckin() {
    const email = checkinEmail.trim();
    if (!email) { showToast('Enter a student email to check in'); return; }

    setIsCheckingIn(true);
    try {
      const res = await fetch(`${EVENTS_API}/${selectedEventId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check-in failed');

      showToast(data.message);
      setCheckinEmail('');
      setAttendees((prev) => prev.map((a) => (a.email.toLowerCase() === email.toLowerCase() ? { ...a, checkedIn: true } : a)));
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsCheckingIn(false);
    }
  }

  function handleExport() {
    const header = ['Name', 'Email', 'Status'];
    const rows = filteredAttendees.map((a) => [a.name, a.email, a.checkedIn ? 'Checked In' : 'Pending']);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendees-${(selectedEvent?.title || 'event').replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!managedSociety) {
    return <div className="page-pad"><p>You are not a POC for any society.</p></div>;
  }

  return (
    <div className="page-pad">
      <div className="page-head">
        <div>
          <label className="al-event-lbl" htmlFor="al-event-select">Viewing attendees for</label>
          <select
            id="al-event-select"
            className="al-event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {myEvents.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <button className="btn outline" onClick={handleExport}>↓ Export</button>
      </div>

      <div className="al-stats">
        <div className="al-stat"><b>{stats.registered}</b><span>Registered</span></div>
        <div className="al-stat"><b>{stats.checkedIn}</b><span>Checked In</span></div>
        <div className="al-stat"><b>{stats.pending}</b><span>Pending</span></div>
        <div className="al-search">
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Student email to check in"
          value={checkinEmail}
          onChange={(e) => setCheckinEmail(e.target.value)}
          style={{ flex: '1 1 240px', padding: '8px 12px', border: '1.5px solid var(--ink)', borderRadius: 8 }}
        />
        <button className="btn sm" disabled={isCheckingIn} onClick={handleCheckin}>
          {isCheckingIn ? 'Checking in…' : '✓ Check In'}
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <tbody>
            <tr><th>Name</th><th>Email</th><th>Status</th></tr>
            {isLoading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px 10px' }}>Loading…</td></tr>
            ) : filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 10px' }}>
                  No attendees match your search.
                </td>
              </tr>
            ) : (
              filteredAttendees.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="name-cell">
                      <div className="av">{a.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div><b>{a.name}</b></div>
                    </div>
                  </td>
                  <td>{a.email}</td>
                  <td><span className={`status-pill ${a.checkedIn ? 'in' : 'pending'}`}>{a.checkedIn ? 'Checked In' : 'Pending'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}