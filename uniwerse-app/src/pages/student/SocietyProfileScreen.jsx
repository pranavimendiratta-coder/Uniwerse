import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;
const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const APPLICATIONS_API = `${import.meta.env.VITE_API_URL}/api/applications`;

const GRADIENTS = ['grad-pink', 'grad-blue', 'grad-green', 'grad-navy'];
function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <div className="team-avatar">{initials}</div>;
}

export default function SocietyProfileScreen() {
  const { id } = useParams();
  const [society, setSociety] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const { token, role } = useAuth();
const showToast = useToast();
const [applyOpen, setApplyOpen] = useState(false);
const [roleInterest, setRoleInterest] = useState('');
const [message, setMessage] = useState('');
const [isApplying, setIsApplying] = useState(false);
const [hasApplied, setHasApplied] = useState(false);

async function submitApplication(e) {
  e.preventDefault();
  setIsApplying(true);
  try {
    const res = await fetch(APPLICATIONS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ society: society.name, roleInterest, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to apply');

    showToast('Application submitted!');
    setHasApplied(true);
    setApplyOpen(false);
  } catch (err) {
    showToast(err.message);
  } finally {
    setIsApplying(false);
  }
}

  useEffect(() => {
    async function loadSociety() {
      setIsLoading(true);
      try {
        const res = await fetch(`${SOCIETIES_API}/${id}`);
        const data = await res.json();
        if (!res.ok) { setNotFound(true); return; }

        setSociety({ ...data, gradient: gradientFor(data.name) });
        if (role === 'Student' && token) {
  try {
    const appRes = await fetch(`${APPLICATIONS_API}/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const appData = await appRes.json();
    if (appRes.ok) {
      const alreadyApplied = appData.some((a) => a.society === data.name && a.stage !== 'Rejected');
      setHasApplied(alreadyApplied);
    }
  } catch (err) {
    console.error('Failed to check application status', err);
  }
}

        const evRes = await fetch(`${EVENTS_API}?society=${id}`);
        const evData = await evRes.json();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const upcoming = evData
          .filter((ev) => !ev.date || new Date(ev.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        const past = evData
          .filter((ev) => ev.date && new Date(ev.date) < today)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadSociety();
  }, [id, role, token]);

  if (notFound) return <Navigate to="/student/societies" replace />;
  if (isLoading || !society) return <div className="content-scroll" style={{ maxWidth: 1120, margin: '0 auto' }}><p>Loading…</p></div>;

  return (
    <div className="content-scroll" style={{ maxWidth: 1120, margin: '0 auto' }}>
      <div className="breadcrumb">
        <Link to="/student">Home</Link> / <Link to="/student/societies">Societies</Link> / <b>{society.name}</b>
      </div>

      <div className={`society-cover ${society.gradient}`}>
        <div className="hero-dots" />
      </div>

      <div className="society-header">
        <div className="society-logo-lg">{society.logoInitials}</div>
        <div className="society-header-info">
          <div className="society-name-row">
            <h1>{society.name}</h1>
            {society.verified && <span className="verified-badge" title="Verified Society">✓</span>}
            <span className="tag">{society.category}</span>
          </div>
          <p className="society-tagline">{society.tagline}</p>
        </div>
        <button className={`btn ${following ? 'outline' : ''}`} onClick={() => setFollowing((f) => !f)}>
          {following ? '✓ Following' : '+ Follow Society'}
        </button>
        {role === 'Student' && (
  <button
    className="btn outline"
    disabled={hasApplied}
    onClick={() => setApplyOpen(true)}
  >
    {hasApplied ? '✓ Applied' : 'Apply to Join'}
  </button>
)}
      </div>

      <div className="society-stat-row">
        <div className="society-stat"><b>{society.membersCount || 0}</b><span>Members</span></div>
        <div className="society-stat"><b>{society.eventsOrganised || 0}</b><span>Events Conducted</span></div>
        <div className="society-stat"><b>{society.stats?.workshops || 0}</b><span>Workshops</span></div>
        <div className="society-stat"><b>{society.stats?.hackathons || 0}</b><span>Hackathons</span></div>
        <div className="society-stat"><b>{society.stats?.competitions || 0}</b><span>Competitions</span></div>
        <div className="society-stat"><b>{society.activeSince || '—'}</b><span>Active Since</span></div>
      </div>

      <div className="society-body-grid">
        <div className="society-main-col">
          <div className="about-block">
            <h3>About</h3>
            <p>{society.description}</p>
          </div>

          <div className="about-subgrid">
            <div className="about-subcard">
              <h4>Mission</h4>
              <p>{society.mission || '—'}</p>
            </div>
            <div className="about-subcard">
              <h4>Vision</h4>
              <p>{society.vision || '—'}</p>
            </div>
          </div>

          {society.objectives && society.objectives.length > 0 && (
            <div className="about-block">
              <h3>Objectives</h3>
              <ul className="objectives-list">
                {society.objectives.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}

          <div className="rr-title">Team</div>
          <div className="card team-card">
            <div className="team-row">
              <Avatar name={society.team?.president} />
              <div><b>{society.team?.president || '—'}</b><span>President</span></div>
            </div>
            <div className="team-row">
              <Avatar name={society.team?.vicePresident} />
              <div><b>{society.team?.vicePresident || '—'}</b><span>Vice President</span></div>
            </div>
            <div className="team-row">
              <Avatar name={society.team?.generalSecretary} />
              <div><b>{society.team?.generalSecretary || '—'}</b><span>General Secretary</span></div>
            </div>
            <div className="team-row">
              <Avatar name={society.facultyCoordinator} />
              <div><b>{society.facultyCoordinator || '—'}</b><span>Faculty Coordinator</span></div>
            </div>
          </div>

          {society.execTeam?.length > 0 && (
  <>
    <div className="rr-title" style={{ marginTop: 20 }}>Executive Team</div>
    <div className="team-grid">
      {society.execTeam.map((m, i) => (
        <div className="team-grid-item card" key={i}>
          <Avatar name={m.name} />
          <b>{m.name}</b>
          <span>{m.role}</span>
        </div>
      ))}
    </div>
  </>
)}

          <div className="rr-title" style={{ marginTop: 24 }}>Upcoming Events</div>
          <div className="card society-event-list">
            {upcomingEvents.length === 0 ? (
              <p style={{ padding: 12, color: 'var(--muted)' }}>No upcoming events right now.</p>
            ) : (
              upcomingEvents.map((ev) => (
                <Link to={`/student/event/${ev._id}`} className="more-item clickable" key={ev._id}>
                  <b>{ev.title}</b><span>{ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                </Link>
              ))
            )}
          </div>

          <div className="rr-title" style={{ marginTop: 24 }}>Past Events</div>
          <div className="card society-event-list">
            {pastEvents.length === 0 ? (
              <p style={{ padding: 12, color: 'var(--muted)' }}>No past events yet.</p>
            ) : (
              pastEvents.map((ev) => (
                <div className="more-item" key={ev._id}>
                  <b>{ev.title}</b><span>{ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
              ))
            )}
          </div>

          <div className="rr-title" style={{ marginTop: 24 }}>Gallery</div>
          <div className="card gallery-placeholder">
            {(!society.gallery || society.gallery.length === 0) ? (
              <p>No photos yet — check back after the next event!</p>
            ) : (
              <div className="gallery-grid">
                {society.gallery.map((src, i) => (
                  <img key={i} src={`${import.meta.env.VITE_API_URL}${src}`} alt="" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="society-side-col">
          <div className="rr-title">Recent Activity</div>
          <div className="card activity-feed">
            {(!society.activity || society.activity.length === 0) ? (
              <p style={{ padding: 12, color: 'var(--muted)' }}>No recent activity yet.</p>
            ) : (
              society.activity.map((a, i) => (
                <div className="activity-item" key={i}>
                  <span className="activity-icon">{a.icon}</span>
                  <div>
                    <p>{a.text}</p>
                    <span className="activity-time">{a.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card sticky-card">
            <h4>Contact</h4>
            {society.contactPerson && (
  <div className="kv-row"><span className="k">Contact Person</span><span className="v">{society.contactPerson}</span></div>
)}
            <div className="society-contact-list">
              {society.email && (
                <a className="society-contact-link" href={`mailto:${society.email}`}>✉ {society.email}</a>
              )}
              {society.instagram && (
                <a className="society-contact-link" href={`https://instagram.com/${society.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                  Instagram · {society.instagram}
                </a>
              )}
              {society.linkedin && (
                <a className="society-contact-link" href={`https://${society.linkedin}`} target="_blank" rel="noreferrer">LinkedIn</a>
              )}
              {society.website && (
                <a className="society-contact-link" href={society.website} target="_blank" rel="noreferrer">Website</a>
              )}
            </div>
          </div>
        </div>
      </div>
      {applyOpen && (
  <div className="ev-modal-overlay" onClick={() => setApplyOpen(false)}>
    <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
      <div className="ev-modal-head">
        <h3>Apply to {society.name}</h3>
        <button className="ev-modal-close" onClick={() => setApplyOpen(false)}>✕</button>
      </div>
      <form className="ev-modal-body" onSubmit={submitApplication}>
        <label className="ev-input-lbl">
          Which role interests you?
          <input
            className="ev-input"
            placeholder="e.g. Design, Events, Media"
            value={roleInterest}
            onChange={(e) => setRoleInterest(e.target.value)}
          />
        </label>
        <label className="ev-input-lbl">
          Why do you want to join?
          <textarea
            className="ev-input ev-textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <div className="ev-modal-actions">
          <button type="button" className="btn outline sm" onClick={() => setApplyOpen(false)}>Cancel</button>
          <button type="submit" className="btn sm" disabled={isApplying}>
            {isApplying ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}