import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

const FILTERS = ['All', 'Upcoming', 'Ongoing', 'Completed'];

function computeStatus(dateStr) {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (eventDay.getTime() === today.getTime()) return 'ongoing';
  if (eventDay > today) return 'upcoming';
  return 'completed';
}

export default function EventsScreen() {
  const { role, society } = useAuth();
  const [filter, setFilter] = useState('All');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const socRes = await fetch(SOCIETIES_API);
        const societies = await socRes.json();
        const mySociety = societies.find((s) => s.name === society);
        if (!mySociety) { setIsLoading(false); return; }

        const res = await fetch(`${EVENTS_API}?society=${mySociety._id}`);
        const data = await res.json();

        const mapped = data.map((ev) => ({
          id: ev._id,
          name: ev.title,
          date: ev.date
            ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
          venue: ev.venue,
          status: computeStatus(ev.date),
          registrations: ev.registeredStudents ? ev.registeredStudents.length : 0,
          capacity: ev.capacity,
          attendance: null, // real check-in data doesn't exist yet — wired up later
          feedback: null,
        }));

        setEvents(mapped);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, [society]);

  const visible = filter === 'All' ? events : events.filter((e) => e.status === filter.toLowerCase());

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">All Society Events</h1>
          <p className="shd-subtitle">View-only. Creating, editing, and running events stays with your Society POCs.</p>
        </div>
        <div className="range-toggle">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="shd-empty">Loading events…</div>
      ) : visible.length === 0 ? (
        <div className="shd-empty">No {filter.toLowerCase()} events yet.</div>
      ) : (
        <div className="event-grid">
          {visible.map((e) => (
            <div className="event-card" key={e.id}>
              <div className="event-banner">{e.name}</div>
              <div className="event-card-body">
                <span className={`status-pill ${e.status}`}>{e.status}</span>
                <span className="event-card-title">{e.name}</span>
                <span className="event-card-meta">{e.date} · {e.venue}</span>
                <div className="event-card-stats">
                  <span>Reg: {e.registrations}/{e.capacity || '—'}</span>
                  <span>{e.attendance != null ? `Attended: ${e.attendance}` : 'Not started'}</span>
                </div>
                {e.feedback && <span className="event-card-feedback">{e.feedback}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}