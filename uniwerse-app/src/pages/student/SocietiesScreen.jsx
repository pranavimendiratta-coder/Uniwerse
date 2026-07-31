import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRegistrationStatus } from '../../utils/registrationStatus';

const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;
const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;

const GRADIENTS = ['grad-pink', 'grad-blue', 'grad-green', 'grad-navy'];
function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

const SORT_OPTIONS = [
  { key: 'active', label: 'Most Active' },
  { key: 'newest', label: 'Newest' },
  { key: 'members', label: 'Most Members' },
  { key: 'events', label: 'Most Events' },
  { key: 'alpha', label: 'A–Z' },
];

function sortSocieties(list, sortKey) {
  const arr = [...list];
  switch (sortKey) {
    case 'newest':
      return arr.sort((a, b) => (b.activeSince || 0) - (a.activeSince || 0));
    case 'members':
      return arr.sort((a, b) => (b.membersCount || 0) - (a.membersCount || 0));
    case 'events':
      return arr.sort((a, b) => (b.eventsOrganised || 0) - (a.eventsOrganised || 0));
    case 'alpha':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'active':
    default:
      return arr.sort(
        (a, b) => (b.membersCount || 0) + (b.eventsOrganised || 0) * 3 - ((a.membersCount || 0) + (a.eventsOrganised || 0) * 3)
      );
  }
}

function NextEventPreview({ upcoming }) {
  const next = upcoming[0];
  if (!next) return <div className="soc-next-empty">No upcoming events right now</div>;

  const status = getRegistrationStatus(next.registrationDeadline);

  return (
    <div className="soc-next-event">
      <div className="soc-next-label">Next Up</div>
      <div className="soc-next-title">{next.title}</div>
      <div className="soc-next-meta">
        <span>{next.date ? new Date(next.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
        {next.venue && <span>· {next.venue}</span>}
      </div>
      <span className={`status-chip sm ${status.key}`}>
        <span className="dot" /> {status.label}
      </span>
    </div>
  );
}

export default function SocietiesScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortKey, setSortKey] = useState('active');
  const [followed, setFollowed] = useState({});

  const [societies, setSocieties] = useState([]);
  const [eventsBySociety, setEventsBySociety] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [socRes, evRes] = await Promise.all([fetch(SOCIETIES_API), fetch(EVENTS_API)]);
        const socData = await socRes.json();
        const evData = await evRes.json();

        const shapedSocieties = socData.map((s) => ({ ...s, id: s._id, gradient: gradientFor(s.name) }));
        setSocieties(shapedSocieties);

        const now = new Date();
        const grouped = {};
        evData.forEach((ev) => {
          const key = ev.society;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(ev);
        });
        Object.keys(grouped).forEach((key) => {
          grouped[key] = grouped[key]
            .filter((ev) => !ev.date || new Date(ev.date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        });
        setEventsBySociety(grouped);
      } catch (err) {
        console.error('Failed to load societies', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const societyCategories = useMemo(() => Array.from(new Set(societies.map((s) => s.category))), [societies]);

  const toggleFilter = (cat) => {
    setActiveFilters((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    setFollowed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    let list = societies;
    if (activeFilters.length > 0) {
      list = list.filter((s) => activeFilters.includes(s.category));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.tagline || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
      );
    }
    return sortSocieties(list, sortKey);
  }, [societies, query, activeFilters, sortKey]);

  const goToSociety = (id) => navigate(`/student/society/${id}`);

  if (isLoading) {
    return <div className="content-scroll" style={{ maxWidth: 1200, margin: '0 auto' }}><p>Loading societies…</p></div>;
  }

  return (
    <div className="content-scroll" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="section-head"></div>
      <p className="societies-subhead">
        Discover clubs and societies across campus — explore what they do, who runs them, and what's coming up.
      </p>

      <div className="searchbar" style={{ marginTop: 18 }}>
        <input
          type="text"
          placeholder="Search societies by name, category, or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="soc-filter-row">
        <div className="seg-tabs">
          <div className={`seg-tab${activeFilters.length === 0 ? ' active' : ''}`} onClick={() => setActiveFilters([])}>
            All
          </div>
          {societyCategories.map((cat) => (
            <div
              key={cat}
              className={`seg-tab${activeFilters.includes(cat) ? ' active' : ''}`}
              onClick={() => toggleFilter(cat)}
            >
              {cat}
            </div>
          ))}
        </div>

        <select className="soc-sort-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>Sort: {opt.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <h4>No societies match your search.</h4>
          <p>Try a different keyword or clear your filters.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            <button className="btn outline" onClick={() => { setQuery(''); setActiveFilters([]); }}>
              Clear Filters
            </button>
            <Link to="/student" className="btn">Browse Events</Link>
          </div>
        </div>
      ) : (
        <div className="society-grid">
          {filtered.map((soc) => {
            const upcoming = eventsBySociety[soc._id] || [];
            return (
              <div
                className="society-card-v2"
                key={soc._id}
                onClick={() => goToSociety(soc._id)}
                role="button"
                tabIndex={0}
              >
                <div className={`society-card-cover ${soc.gradient}`}>
                  <div className="hero-dots" />
                  <span className="society-card-category">{soc.category}</span>
                </div>

                <div className="society-card-body">
                  <div className="society-card-logo-row">
                    <div className="society-card-logo">{soc.logoInitials}</div>
                    <div className="society-card-name-block">
                      <div className="society-card-name-row">
                        <h4>{soc.name}</h4>
                        {soc.verified && <span className="verified-badge sm">✓</span>}
                      </div>
                      <p className="society-card-tagline">{soc.tagline}</p>
                    </div>
                  </div>

                  <div className="society-card-stats">
                    <div><b>{soc.membersCount || 0}</b><span>Members</span></div>
                    <div><b>{soc.eventsOrganised || 0}</b><span>Events</span></div>
                    <div><b>{upcoming.length}</b><span>Upcoming</span></div>
                  </div>

                  <NextEventPreview upcoming={upcoming} />

                  <button
                    className={`btn ${followed[soc._id] ? 'outline' : ''} block soc-follow-btn`}
                    onClick={(e) => toggleFollow(soc._id, e)}
                  >
                    {followed[soc._id] ? '✓ Following' : '+ Follow Society'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}