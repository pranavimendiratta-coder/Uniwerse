import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { audiencePill } from '../../data/mockData';
import { getInitials } from '../../utils/getInitials';
import { useAuth } from '../../context/AuthContext';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;

function BannerIcon({ variant }) {
  if (variant === 'grad-pink')
    return (
      <svg className="banner-icon" viewBox="0 0 60 60">
        <polygon points="30,4 36,22 55,22 40,33 45,52 30,41 15,52 20,33 5,22 24,22" strokeWidth="1.6" />
      </svg>
    );
  if (variant === 'grad-blue')
    return (
      <svg className="banner-icon" viewBox="0 0 60 60">
        <rect x="20" y="20" width="20" height="20" rx="2" strokeWidth="1.6" />
        <line x1="30" y1="4" x2="30" y2="20" strokeWidth="1.6" />
        <line x1="30" y1="40" x2="30" y2="56" strokeWidth="1.6" />
        <line x1="4" y1="30" x2="20" y2="30" strokeWidth="1.6" />
        <line x1="40" y1="30" x2="56" y2="30" strokeWidth="1.6" />
        <circle cx="30" cy="4" r="2.4" />
        <circle cx="30" cy="56" r="2.4" />
        <circle cx="4" cy="30" r="2.4" />
        <circle cx="56" cy="30" r="2.4" />
      </svg>
    );
  if (variant === 'grad-green')
    return (
      <svg className="banner-icon" viewBox="0 0 60 60">
        <path d="M30 4 C40 14 42 30 36 44 L24 44 C18 30 20 14 30 4 Z" strokeWidth="1.6" />
        <circle cx="30" cy="20" r="4" strokeWidth="1.4" />
        <path d="M24 44 L18 56 L26 50 Z" strokeWidth="1.4" />
        <path d="M36 44 L42 56 L34 50 Z" strokeWidth="1.4" />
      </svg>
    );
  return (
    <svg className="banner-icon" viewBox="0 0 60 60">
      <circle cx="14" cy="14" r="6" strokeWidth="1.6" />
      <circle cx="46" cy="14" r="6" strokeWidth="1.6" />
      <circle cx="30" cy="40" r="6" strokeWidth="1.6" />
      <circle cx="14" cy="46" r="4" strokeWidth="1.4" />
      <line x1="18" y1="17" x2="27" y2="36" strokeWidth="1.3" />
      <line x1="42" y1="17" x2="33" y2="36" strokeWidth="1.3" />
      <line x1="16" y1="19" x2="15" y2="42" strokeWidth="1.3" />
    </svg>
  );
}

const AUDIENCE_OPTIONS = [
  { key: 'open', label: 'Open for All' },
  { key: 'igdtuw', label: 'IGDTUW Only' },

];

const CATEGORY_OPTIONS = ['Fest', 'Seminar', 'Workshop', 'Hackathon'];

const GRADIENTS = ['grad-pink', 'grad-blue', 'grad-green', 'grad-navy'];
function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function parseEventDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseInputDate(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { accessType, userId, name, email } = useAuth();
  const isGuest = accessType === 'guest';

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [audienceFilters, setAudienceFilters] = useState([]);
  const [societyFilters, setSocietyFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(EVENTS_API);
        const data = await res.json();
const now = new Date();
const upcoming = data.filter((ev) => !ev.date || new Date(ev.date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));
const mapped = upcoming.map((ev) => ({
          id: ev._id,
          title: ev.title,
          society: ev.societyName,
          rawDate: ev.date || null,
          date: ev.date
            ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
          venue: ev.venue,
          audience: ev.audience === 'outsiders' ? 'open' : ev.audience,
          category: ev.category,
          gradient: gradientFor(ev.title || ev._id),
          capacity: ev.capacity,
          registeredStudents: ev.registeredStudents || [],
          registeredCount: ev.registeredStudents ? ev.registeredStudents.length : 0,
        }));
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  const societies = useMemo(() => {
    return Array.from(new Set(events.map((ev) => ev.society)));
  }, [events]);

  const myUpcomingEvents = useMemo(() => {
    if (!userId) return [];
    return events
      .filter((ev) => ev.registeredStudents.some((id) => String(id) === String(userId)))
      .sort((a, b) => new Date(a.rawDate || 0) - new Date(b.rawDate || 0))
      .slice(0, 4);
  }, [events, userId]);

  const trendingSocieties = useMemo(() => {
    const totals = {};
    events.forEach((ev) => {
      if (!ev.society) return;
      totals[ev.society] = (totals[ev.society] || 0) + ev.registeredCount;
    });
    const ranked = Object.entries(totals)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const max = ranked.length ? ranked[0][1] : 0;
    const barColors = ['var(--pink)', 'var(--blue)', 'var(--green)', 'var(--navy)'];
    return ranked.map(([society, count], i) => ({
      society,
      count,
      widthPct: max ? Math.max(8, Math.round((count / max) * 100)) : 0,
      color: barColors[i % barColors.length],
    }));
  }, [events]);
  function toggleAudience(key) {
    setAudienceFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleSociety(soc) {
    setSocietyFilters((prev) =>
      prev.includes(soc) ? prev.filter((s) => s !== soc) : [...prev, soc]
    );
  }
  function toggleCategory(cat) {
    setCategoryFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function applyDateFilters() {
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
  }

  const filteredEvents = useMemo(() => {
    const startDate = parseInputDate(appliedStartDate);
    const endDate = parseInputDate(appliedEndDate);

    return events.filter((ev) => {
      if (isGuest && ev.audience === 'igdtuw') return false;

      if (audienceFilters.length && !audienceFilters.includes(ev.audience)) return false;
      if (societyFilters.length && !societyFilters.includes(ev.society)) return false;
      if (categoryFilters.length && !categoryFilters.includes(ev.category)) return false;

      if (startDate || endDate) {
        const evDate = parseEventDate(ev.date);
        if (evDate) {
          if (startDate && evDate < startDate) return false;
          if (endDate && evDate > endDate) return false;
        }
      }

      if (appliedSearch.trim()) {
        const q = appliedSearch.trim().toLowerCase();
        const matches =
          ev.title.toLowerCase().includes(q) ||
          ev.society.toLowerCase().includes(q) ||
          ev.venue.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [events, isGuest, audienceFilters, societyFilters, categoryFilters, appliedSearch, appliedStartDate, appliedEndDate]);

  const hasActiveFilters =
    audienceFilters.length > 0 ||
    societyFilters.length > 0 ||
    categoryFilters.length > 0 ||
    appliedStartDate ||
    appliedEndDate ||
    appliedSearch;

  const heroEvent = filteredEvents[0] || events[0] || null;
  const gridEvents = filteredEvents;

  function resetFilters() {
    setAudienceFilters([]);
    setSocietyFilters([]);
    setCategoryFilters([]);
    setSearchTerm('');
    setAppliedSearch('');
    setStartDateInput('');
    setEndDateInput('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  }

  return (
    <div className="layout">
      <div className={`sidebar${filtersOpen ? ' open' : ''}`}>
        {!isGuest && (
          <div className="sb-block">
            <div className="sb-title">Audience</div>
            {AUDIENCE_OPTIONS.map((opt) => (
              <label className="chk-row" key={opt.key}>
                <input
                  type="checkbox"
                  checked={audienceFilters.includes(opt.key)}
                  onChange={() => toggleAudience(opt.key)}
                />
                {' '}{opt.label}
              </label>
            ))}
          </div>
        )}
        <div className="sb-divider" />
        <div className="sb-block">
          <div className="sb-title">Society</div>
          {societies.map((soc) => (
            <label className="chk-row" key={soc}>
              <input
                type="checkbox"
                checked={societyFilters.includes(soc)}
                onChange={() => toggleSociety(soc)}
              />
              {' '}{soc}
            </label>
          ))}
        </div>
        <div className="sb-divider" />
        <div className="sb-block">
          <div className="sb-title">Category</div>
          {CATEGORY_OPTIONS.map((cat) => (
            <label className="chk-row" key={cat}>
              <input
                type="checkbox"
                checked={categoryFilters.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {' '}{cat}
            </label>
          ))}
        </div>
        <div className="sb-divider" />
        <div className="sb-block">
          <div className="sb-title">Date Range</div>
          <div className="field-sm">
            <label>Start date</label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
            />
          </div>
          <div className="field-sm">
            <label>End date</label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
            />
          </div>
          <button className="btn block sm" style={{ marginTop: 6 }} onClick={applyDateFilters}>
            Apply Filters
          </button>
        </div>
        <div className="sb-divider" />
        <div className="sb-block">
          <button className="btn outline block sm" onClick={resetFilters}>
            Reset All Filters
          </button>
        </div>
      </div>

      <div className="content-scroll">
        <button
          className="btn outline block sm filters-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? '✕ Close Filters' : '☰ Filters'}
        </button>

        <div className="searchbar">
          <input
            type="text"
            placeholder="Search events, societies, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(searchTerm)}
          />
          <button className="btn" onClick={() => setAppliedSearch(searchTerm)}>Search</button>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <b>Loading events…</b>
          </div>
        ) : heroEvent ? (
          <div className="hero-banner">
            <div className="hero-dots" />
            <div className="hero-copy">
              <div>
                <h2>{heroEvent.title}</h2>
                <p>{heroEvent.date} · {heroEvent.venue} · Open for everyone — performances, stalls &amp; a live finale</p>
              </div>
              <button className="btn" onClick={() => navigate(`/student/event/${heroEvent.id}`)}>View Event →</button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">📅</div>
            <b>No events yet</b>
            <p>Check back soon — societies are getting things ready.</p>
          </div>
        )}

        <div className="section-head">
          <h3>Upcoming Events {hasActiveFilters && `(${filteredEvents.length} of ${events.length})`}</h3>
          <a>View all →</a>
        </div>

        {gridEvents.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <b>{events.length === 0 ? 'No events yet' : 'No events match your filters'}</b>
            <p>
              {events.length === 0
                ? 'Once societies publish events, they will show up here.'
                : 'Try removing a filter or search term, or reset everything to see the full list.'}
            </p>
            {events.length > 0 && (
              <button className="btn outline sm" style={{ marginTop: 6 }} onClick={resetFilters}>Reset Filters</button>
            )}
          </div>
        ) : (
          <div className="event-grid">
            {gridEvents.map((ev) => (
              <div className="card event-card" key={ev.id} tabIndex={0} onClick={() => navigate(`/student/event/${ev.id}`)}>
                <div className={`ev-banner ${ev.gradient}`}>
                  <div className="dotgrid" />
                  <BannerIcon variant={ev.gradient} />
                  <span className={`ev-pill-corner ${audiencePill[ev.audience].className}`}>{audiencePill[ev.audience].label}</span>
                </div>
                <div className="ev-body">
                  <h4>{ev.title}</h4>
                  <div className="soc">{ev.society}</div>
                  <div className="ev-meta">
                    <span><span className="sq" />{ev.date}</span>
                    <span><span className="sq" />{ev.venue}</span>
                  </div>
                  <button className="btn block" onClick={(e) => e.stopPropagation()}>Register</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="right-rail">
        <div className="rr-block">
          <div className="rr-title">Your Upcoming</div>
          {myUpcomingEvents.length === 0 ? (
            <div className="upcoming-mini" style={{ opacity: 0.7 }}>
              {isGuest ? 'Log in as a member to register for events' : 'No registrations yet'}
            </div>
          ) : (
            myUpcomingEvents.map((ev) => (
              <div className="upcoming-mini" key={ev.id}>{ev.title} · {ev.date}</div>
            ))
          )}
        </div>
        <div className="rr-block">
          <div className="rr-title">My Role</div>
          <div className="role-card"><span className="av">{isGuest ? 'G' : getInitials(name, email)}</span> {isGuest ? 'Guest' : 'Student'} — {isGuest ? 'External' : 'IGDTUW'}</div>
        </div>
        <div className="rr-block">
          <div className="rr-title">Trending</div>
          {trendingSocieties.length === 0 ? (
            <div className="chart-box" style={{ opacity: 0.7 }}>Not enough registrations yet to show trends.</div>
          ) : (
            <div className="chart-box">
              {trendingSocieties.map((t) => (
                <div className="bar-row" key={t.society}>
                  {t.society}
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${t.widthPct}%`, background: t.color }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}