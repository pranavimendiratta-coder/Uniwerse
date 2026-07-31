import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audiencePill } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;

const REMINDER_OPTIONS = [
  { key: '30m', label: '30 minutes before' },
  { key: '1h', label: '1 hour before' },
  { key: '1d', label: '1 day before' },
];

const LAYERS = [
  { key: 'academic', label: '📚 Academic Calendar', default: false },
  { key: 'society', label: '🎉 Society Events', default: true },
  { key: 'mine', label: '👤 My Registered Events', default: true },
];

function pad(n) { return String(n).padStart(2, '0'); }

function parseEventDateTime(dateStr, timeStr) {
  const base = new Date(dateStr);
  if (!timeStr) return { start: base, end: new Date(base.getTime() + 60 * 60 * 1000) };
  const [startPart, endPart] = timeStr.split('–').map((s) => s.trim());
  const applyTime = (d, t) => {
    const m = t.match(/(\d+):(\d+)\s?(AM|PM)/i);
    if (!m) return d;
    let hh = parseInt(m[1], 10) % 12;
    const mm = parseInt(m[2], 10);
    if (m[3].toUpperCase() === 'PM') hh += 12;
    const nd = new Date(d);
    nd.setHours(hh, mm, 0, 0);
    return nd;
  };
  const start = applyTime(base, startPart);
  const end = endPart ? applyTime(base, endPart) : new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

function icsDate(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function downloadICS(event) {
  const { start, end } = parseEventDateTime(event.date, event.time);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UniWerse//Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@uniwerse`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.society} · ${event.venue}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllICS(evts) {
  const blocks = evts.map((event) => {
    const { start, end } = parseEventDateTime(event.date, event.time);
    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@uniwerse`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.society} · ${event.venue}`,
      'END:VEVENT',
    ].join('\r\n');
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UniWerse//Calendar//EN', ...blocks, 'END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-events.ics';
  a.click();
  URL.revokeObjectURL(url);
}

function googleCalendarLink(event) {
  const { start, end } = parseEventDateTime(event.date, event.time);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: `${event.society} · ${event.venue}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookLink(event) {
  const { start, end } = parseEventDateTime(event.date, event.time);
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: `${event.society} · ${event.venue}`,
    startdt: toISO(start),
    enddt: toISO(end),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const GRADIENTS = ['grad-pink', 'grad-blue', 'grad-green', 'grad-navy'];
function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function AddToCalendarMenu({ event, onClose }) {
  return (
    <div className="dropdown-menu" style={{ top: '110%', right: 0 }} onMouseLeave={onClose}>
      <a href={googleCalendarLink(event)} target="_blank" rel="noreferrer" className="dropdown-item">Google Calendar</a>
      <button className="dropdown-item" onClick={() => downloadICS(event)}>Apple Calendar (.ics)</button>
      <a href={outlookLink(event)} target="_blank" rel="noreferrer" className="dropdown-item">Outlook Calendar</a>
      <button className="dropdown-item" onClick={() => downloadICS(event)}>Download .ics File</button>
    </div>
  );
}

function ReminderMenu({ onPick, onClose }) {
  return (
    <div className="dropdown-menu" style={{ top: '110%', right: 0 }} onMouseLeave={onClose}>
      {REMINDER_OPTIONS.map((opt) => (
        <button key={opt.key} className="dropdown-item" onClick={() => onPick(opt)}>{opt.label}</button>
      ))}
    </div>
  );
}

export default function CalendarScreen() {
  const navigate = useNavigate();
  const { token, userId } = useAuth();

  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(EVENTS_API);
        const data = await res.json();
        const mapped = data.map((ev) => ({
          id: ev._id,
          title: ev.title,
          society: ev.societyName,
          date: ev.date ? new Date(ev.date).toISOString() : '',
          time: ev.time || '',
          venue: ev.venue,
          audience: ev.audience,
          gradient: gradientFor(ev.title || ev._id),
          registeredStudents: ev.registeredStudents || [],
        }));
        setAllEvents(mapped);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  const registeredEvents = useMemo(
    () => (userId ? allEvents.filter((e) => e.registeredStudents.includes(userId)) : []),
    [allEvents, userId]
  );

  const today = new Date();

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [reminders, setReminders] = useState({});
  const [layers, setLayers] = useState(Object.fromEntries(LAYERS.map((l) => [l.key, l.default])));

  const eventsByDate = useMemo(() => {
    const map = {};
    registeredEvents.forEach((e) => {
      const key = dateKey(new Date(e.date));
      map[key] = map[key] || [];
      map[key].push(e);
    });
    return map;
  }, [registeredEvents]);

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const key = dateKey(dateObj);
      cells.push({
        day: d,
        key,
        isToday: key === dateKey(today),
        hasEvent: !!eventsByDate[key],
        count: eventsByDate[key]?.length || 0,
      });
    }
    return cells;
  }, [viewDate, eventsByDate, today]);

  const goPrevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const groups = useMemo(() => {
    let list = [...registeredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (selectedDate) list = list.filter((e) => dateKey(new Date(e.date)) === selectedDate);

    const byDate = {};
    list.forEach((e) => {
      const key = dateKey(new Date(e.date));
      byDate[key] = byDate[key] || [];
      byDate[key].push(e);
    });

    return Object.entries(byDate).map(([key, items]) => {
      const d = new Date(key);
      let label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (key === dateKey(today)) label = `Today — ${label}`;
      else {
        const tmrw = new Date(today);
        tmrw.setDate(tmrw.getDate() + 1);
        if (key === dateKey(tmrw)) label = `Tomorrow — ${label}`;
      }
      return { label, items };
    });
  }, [registeredEvents, selectedDate, today]);

  const handleDayClick = (cell) => {
    if (!cell) return;
    setSelectedDate((cur) => (cur === cell.key ? null : cell.key));
  };

  const toggleLayer = (key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="card cal-box">
          <div className="cal-nav">
            <button onClick={goPrevMonth}>‹</button>
            {monthLabel}
            <button onClick={goNextMonth}>›</button>
          </div>
          <div className="cal-grid">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div className="dow" key={i}>{d}</div>)}
            {calendarCells.map((cell, i) => (
              <div
                key={i}
                className={`day${cell?.isToday ? ' today' : ''}${cell?.hasEvent ? ' event' : ''}${selectedDate === cell?.key ? ' selected' : ''}`}
                onClick={() => handleDayClick(cell)}
                role={cell ? 'button' : undefined}
                tabIndex={cell ? 0 : undefined}
                style={{ cursor: cell ? 'pointer' : 'default', visibility: cell ? 'visible' : 'hidden' }}
                title={cell?.hasEvent ? `${cell.count} event(s)` : undefined}
              >
                {cell?.day ?? ''}
              </div>
            ))}
          </div>
        </div>

        <div className="sb-divider" />
        <div className="sb-block">
          <div className="sb-title">Status Legend</div>
          <div className="legend-row"><span className="dt" style={{ background: 'var(--green)' }} />Registered</div>
          <div className="legend-row"><span className="dt" style={{ background: 'var(--blue)' }} />QR Generated</div>
          <div className="legend-row"><span className="dt" style={{ background: 'var(--pink)' }} />Form Submitted</div>
        </div>

        <div className="sb-divider" />
        <div className="sb-block">
          <div className="sb-title">Calendar Layers</div>
          {LAYERS.map((l) => (
            <div className="chk-row" key={l.key} onClick={() => toggleLayer(l.key)}>
              <input type="checkbox" checked={layers[l.key]} readOnly />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="content-scroll">
        <div className="section-head">
          <h3>My Registered Events{selectedDate ? ` — ${selectedDate}` : ''}</h3>
          <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
            {selectedDate && (
              <button className="btn outline sm" onClick={() => setSelectedDate(null)}>Clear filter</button>
            )}
            <button
              className="btn outline sm"
              onClick={() => setOpenMenu((m) => (m?.type === 'export-all' ? null : { type: 'export-all' }))}
            >
              ↓ Export Calendar
            </button>
            {openMenu?.type === 'export-all' && registeredEvents.length > 0 && (
              <div className="dropdown-menu" style={{ top: '110%', right: 0 }} onMouseLeave={() => setOpenMenu(null)}>
                <a href={googleCalendarLink(registeredEvents[0])} target="_blank" rel="noreferrer" className="dropdown-item">Google Calendar</a>
                <button className="dropdown-item" onClick={() => downloadAllICS(registeredEvents)}>Apple Calendar (.ics)</button>
                <a href={outlookLink(registeredEvents[0])} target="_blank" rel="noreferrer" className="dropdown-item">Outlook Calendar</a>
                <button className="dropdown-item" onClick={() => downloadAllICS(registeredEvents)}>Download .ics File</button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state card"><h4>Loading your events…</h4></div>
        ) : groups.length === 0 ? (
          <div className="empty-state card">
            <h4>{selectedDate ? 'No events on this day' : "You're not registered for anything yet"}</h4>
            <p>{selectedDate ? 'Try a different date or clear the filter.' : 'Browse events to register for something.'}</p>
            {!selectedDate && (
              <button className="btn" style={{ marginTop: 14 }} onClick={() => navigate('/student')}>Browse Events</button>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <div className="day-group" key={group.label}>
              <div className="dlabel">{group.label}</div>
              {group.items.map((event, i) => {
                const pill = audiencePill[event.audience] || { className: 'pill', label: event.audience };
                return (
                  <div
                    className="card ev-row"
                    key={event.id}
                    style={{ marginBottom: i === group.items.length - 1 ? 0 : 12, position: 'relative' }}
                  >
                    <div className="time">{event.time ? event.time.split('–')[0].trim() : event.date}</div>
                    <div className="bar" style={{ background: 'var(--green)' }} />
                    <div className="info">
                      <b>{event.title}</b>
                      <span>{event.society} · {event.venue}</span>
                    </div>
                    <span className={pill.className}>{pill.label}</span>
                    <span className="dt" style={{ background: 'var(--green)' }} />

                    <div style={{ display: 'flex', gap: 8, position: 'relative', flexWrap: 'wrap' }}>
                      <button
                        className="btn outline sm"
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(event.venue)}`, '_blank')}
                      >
                        Directions
                      </button>
                      <button
                        className="btn outline sm"
                        onClick={() => setOpenMenu((m) => (m?.type === 'reminder' && m.eventId === event.id ? null : { type: 'reminder', eventId: event.id }))}
                      >
                        🔔 {reminders[event.id] ? REMINDER_OPTIONS.find((r) => r.key === reminders[event.id])?.label : 'Remind Me'}
                      </button>
                      {openMenu?.type === 'reminder' && openMenu.eventId === event.id && (
                        <ReminderMenu
                          onClose={() => setOpenMenu(null)}
                          onPick={(opt) => {
                            setReminders((prev) => ({ ...prev, [event.id]: opt.key }));
                            setOpenMenu(null);
                          }}
                        />
                      )}
                      <button
                        className="btn outline sm"
                        onClick={() => setOpenMenu((m) => (m?.type === 'export' && m.eventId === event.id ? null : { type: 'export', eventId: event.id }))}
                      >
                        Add to Calendar
                      </button>
                      {openMenu?.type === 'export' && openMenu.eventId === event.id && (
                        <AddToCalendarMenu event={event} onClose={() => setOpenMenu(null)} />
                      )}
                      <button className="btn sm" onClick={() => navigate(`/student/event/${event.id}`)}>View Details</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}