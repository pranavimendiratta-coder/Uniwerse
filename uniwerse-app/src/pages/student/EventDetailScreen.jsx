import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef } from 'react';
import { audiencePill } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import AddToCalendarButton from '../../components/common/AddToCalendarButton';
import { getRegistrationStatus, formatCountdown, formatDeadlineDisplay } from '../../utils/registrationStatus';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

const GRADIENTS = ['grad-pink', 'grad-blue', 'grad-green', 'grad-navy'];
function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

let qrLibPromise = null;
function loadQrLib() {
  if (window.QRCode) return Promise.resolve(window.QRCode);
  if (qrLibPromise) return qrLibPromise;
  qrLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => resolve(window.QRCode);
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return qrLibPromise;
}

export default function EventDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { accessType, token, userId } = useAuth();
  const isGuest = accessType === 'guest';
  const [regMode, setRegMode] = useState('form');

  const [event, setEvent] = useState(null);
  const [society, setSociety] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regState, setRegState] = useState('idle');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const qrContainerRef = useRef(null);

  async function openMyQr() {
    setQrModalOpen(true);
    setIsLoadingQr(true);
    try {
      const res = await fetch(`${EVENTS_API}/${event.id}/my-checkin-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not generate your QR');

      await loadQrLib();
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = '';
        new window.QRCode(qrContainerRef.current, {
          text: data.token,
          width: 220,
          height: 220,
        });
      }
    } catch (err) {
      showToast(err.message);
      setQrModalOpen(false);
    } finally {
      setIsLoadingQr(false);
    }
  }

  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true);
      try {
        const res = await fetch(`${EVENTS_API}/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Event not found');

        const shaped = {
          id: data._id,
          title: data.title,
          society: data.societyName,
          societyId: data.society,
          date: data.date
            ? new Date(data.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
          rawDate: data.date,
          time: data.time || '',
          venue: data.venue,
          capacity: data.capacity,
          audience: data.audience,
          about: data.about,
          gradient: gradientFor(data.title || data._id),
          registrationDeadline: data.registrationDeadline,
          registeredStudents: data.registeredStudents || [],
          tags: [],
        };
        setEvent(shaped);

        if (userId && shaped.registeredStudents.includes(userId)) {
          setRegState('success');
        }

        if (data.society) {
          const socRes = await fetch(`${SOCIETIES_API}/${data.society}`);
          const socData = await socRes.json();
          if (socRes.ok) setSociety(socData);
        }
      } catch (err) {
        showToast(err.message || 'Could not load this event');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [id, userId]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const regStatus = useMemo(
    () => (event ? getRegistrationStatus(event.registrationDeadline) : { key: 'open', label: '' }),
    [event]
  );
  const countdownText = useMemo(
    () => (event ? formatCountdown(event.registrationDeadline) : ''),
    [event]
  );

  if (isLoading) {
    return <div className="content-scroll" style={{ maxWidth: 1160, margin: '0 auto' }}><p>Loading event…</p></div>;
  }

  if (!event) {
    return <div className="content-scroll" style={{ maxWidth: 1160, margin: '0 auto' }}><p>Event not found.</p></div>;
  }

  if (isGuest && event.audience === 'igdtuw') {
    return <Navigate to="/student" replace />;
  }

  const pill = audiencePill[event.audience];

  const goToSociety = () => {
    if (society) navigate(`/student/society/${society._id}`);
  };

  async function handleRegisterClick(successMessage) {
    if (regStatus.key === 'closed' || regState === 'loading' || regState === 'success') return;
    setRegState('loading');
    try {
      const res = await fetch(`${EVENTS_API}/${event.id}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      setRegState('success');
      showToast(successMessage || data.message || 'Registered successfully!');
    } catch (err) {
      setRegState('idle');
      showToast(err.message);
    }
  }

  const registerLabel = () => {
    if (regStatus.key === 'closed') return 'Registration Closed';
    if (regState === 'loading') return 'Registering…';
    if (regState === 'success') return '✓ Registered';
    return 'Register for This Event';
  };

  const registerBtnClass = () => {
    let cls = 'btn';
    if (regStatus.key === 'closed') cls += ' disabled';
    else if (regState === 'loading') cls += ' loading';
    else if (regState === 'success') cls += ' success';
    return cls;
  };

  const registerDisabled = regStatus.key === 'closed' || regState === 'loading' || regState === 'success';

  return (
    <div className="content-scroll" style={{ maxWidth: 1160, margin: '0 auto' }}>
      <div className="breadcrumb">
        <Link to="/student">Home</Link> / Events / <b>{event.title}</b>
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <div className={`big-banner ${event.gradient}`}>
            <div className="hero-dots" />
          </div>

          <div className="detail-title-row">
            <div>
              <h1>{event.title}</h1>
              <div className="org-line">
                <div
                  className={`av${society ? ' clickable' : ''}`}
                  onClick={society ? goToSociety : undefined}
                  role={society ? 'button' : undefined}
                  tabIndex={society ? 0 : undefined}
                  title={society ? `View ${society.name}` : undefined}
                />
                <span
                  className={`name${society ? ' clickable' : ''}`}
                  onClick={society ? goToSociety : undefined}
                  role={society ? 'button' : undefined}
                  tabIndex={society ? 0 : undefined}
                >
                  {event.society}
                </span>
                <span className={pill.className}>{pill.label}</span>
                <span className={`status-chip ${regStatus.key}`}>
                  <span className="dot" /> {regStatus.label}
                </span>
                {(event.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flex: '0 0 auto' }}>
              <AddToCalendarButton event={event} />
              <button
                className={registerBtnClass()}
                disabled={registerDisabled}
                onClick={() => {
                  if (regStatus.key === 'closed') return;
                  handleRegisterClick();
                }}
              >
                {registerLabel()}
              </button>
            </div>
          </div>
          <div className="info-tiles">
            <div className="info-tile"><div className="lbl">Date &amp; Time</div><div className="val">{event.date} · {event.time}</div></div>
            <div className="info-tile"><div className="lbl">Venue</div><div className="val">{event.venue}</div></div>
            <div className="info-tile"><div className="lbl">Capacity</div><div className="val">{event.capacity ? `${event.capacity} seats` : '—'}</div></div>
            <div className="info-tile"><div className="lbl">Organiser</div><div className="val">{event.society}</div></div>
          </div>

          <div className="notice-banner">
            <span className={pill.className}>{pill.label}</span>
            <div>
              <h4>
                {event.audience === 'igdtuw'
                  ? 'This event is for IGDTUW members only'
                  : 'This event is open for everyone'}
              </h4>
              <p>
                {event.audience === 'igdtuw'
                  ? 'Only IGDTUW students, faculty, and Society POCs can register for this event.'
                  : 'Both IGDTUW students and outside participants are welcome to register. Bring your college ID for entry.'}
              </p>
            </div>
          </div>

          <div className="about-block">
            <h3>About this Event</h3>
            <p>{event.about || `${event.title}, hosted by ${event.society}. Details, agenda, and speaker information will be updated closer to the event date.`}</p>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Registration Mode</h3>
          <div className="reg-mode-tabs">
            <div className={`tab${regMode === 'form' ? ' active' : ''}`} onClick={() => setRegMode('form')}>In-app Form</div>
            <div className={`tab${regMode === 'qr' ? ' active' : ''}`} onClick={() => setRegMode('qr')}>QR Registration</div>
          </div>

          {regStatus.key === 'closed' ? (
            <div className="card" style={{ padding: 28, textAlign: 'center', marginBottom: 22 }}>
              <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                Registration for this event closed on {formatDeadlineDisplay(event.registrationDeadline)}.
              </p>
            </div>
          ) : regMode === 'form' ? (
            <div className="form-grid">
              <div className="field"><label>Full Name</label><input type="text" placeholder="Your full name as on ID card" disabled={regState === 'success'} /></div>
              <div className="field"><label>Roll Number / ID</label><input type="text" placeholder="e.g. 22CS001 or Guest-ID (for outsiders)" disabled={regState === 'success'} /></div>
              <div className="field"><label>College / Institution</label><input type="text" placeholder="e.g. IGDTUW or your college name" disabled={regState === 'success'} /></div>
              <div className="field"><label>Email Address</label><input type="text" placeholder="you@email.com" disabled={regState === 'success'} /></div>
              <div className="field"><label>Phone Number</label><input type="text" placeholder="10-digit mobile number" disabled={regState === 'success'} /></div>
              <div className="field"><label>Department (optional)</label><input type="text" placeholder="e.g. CSE, ECE" disabled={regState === 'success'} /></div>
              <div className="field full">
                <button className={registerBtnClass()} disabled={registerDisabled} onClick={() => handleRegisterClick('Registration submitted — QR sent to your email')}>
                  {registerLabel()}
                </button>
                {isGuest && regState !== 'success' && (
                  <button className="btn outline" style={{ marginTop: 10 }} onClick={() => showToast('Redirecting to Google…')}>
                    Register with Google
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 28, textAlign: 'center', marginBottom: 22 }}>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 16 }}>
                Show this screen at the entry desk — the organiser will scan you in directly.
              </p>
              <button className={registerBtnClass()} disabled={registerDisabled} onClick={() => handleRegisterClick('QR registration confirmed')}>
                {regState === 'success' ? '✓ Registered' : regState === 'loading' ? 'Generating…' : 'Generate My QR'}
              </button>
            </div>
          )}
        </div>

        <div className="detail-side">
          <div className="card sticky-card">
            <h4>Event Summary</h4>
            <div className="kv-row"><span className="k">Date</span><span className="v">{event.date}</span></div>
            <div className="kv-row"><span className="k">Time</span><span className="v">{event.time || 'TBA'}</span></div>
            <div className="kv-row"><span className="k">Venue</span><span className="v">{event.venue}</span></div>
            <div className="kv-row"><span className="k">Capacity</span><span className="v">{event.capacity || '—'}</span></div>
            <div className="kv-row"><span className="k">Registered</span><span className="v">{event.registeredStudents.length} / {event.capacity || '—'}</span></div>
            <div className="kv-row"><span className="k">Open To</span><span className="v">{event.audience === 'igdtuw' ? 'IGDTUW Only' : 'Everyone'}</span></div>
            <div className="kv-row"><span className="k">Registration Deadline</span><span className="v">{formatDeadlineDisplay(event.registrationDeadline)}</span></div>

            {countdownText && (
              <div className="countdown-box">
                <span className="countdown-label">Registration closes in</span>
                <span className="countdown-value">{countdownText}</span>
              </div>
            )}

            <div className={`status-chip ${regStatus.key} block`}>
              <span className="dot" /><span>{regStatus.label}</span>
            </div>

            <button className={`${registerBtnClass()} block`} disabled={registerDisabled} onClick={() => handleRegisterClick()}>
              {registerLabel()}
            </button>
            {regState === 'success' && (
              <button className="btn outline block" style={{ marginTop: 10 }} onClick={openMyQr}>
                📱 Show My Check-in QR
              </button>
            )}
          </div>

          <div className="rr-title">Organised By</div>
          <div
            className={`card org-card${society ? ' clickable' : ''}`}
            onClick={society ? goToSociety : undefined}
            role={society ? 'button' : undefined}
            tabIndex={society ? 0 : undefined}
          >
            <div className="av">{society ? society.logoInitials : ''}</div>
            <div className="org-card-body">
              <div className="org-card-name-row">
                <b>{event.society}</b>
                {society?.verified && <span className="verified-badge sm" title="Verified Society">✓</span>}
              </div>
              <span>
                {society ? `${society.eventsOrganised} events · ${society.membersCount} members` : ''}
              </span>
            </div>
            {society && (
              <span className="view-society-arrow" title="View Society">→</span>
            )}
          </div>
        </div>
      </div>

      {qrModalOpen && (
        <div className="ev-modal-overlay" onClick={() => setQrModalOpen(false)}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="ev-modal-head">
              <h3>Your Check-in QR</h3>
              <button className="ev-modal-close" onClick={() => setQrModalOpen(false)}>✕</button>
            </div>
            <div className="ev-modal-body">
              {isLoadingQr && <p>Generating your QR…</p>}
              <div ref={qrContainerRef} style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }} />
              <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                Show this at the entry desk — the organiser will scan it to check you in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}