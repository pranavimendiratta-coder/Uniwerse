import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

function buildQrPixels() {
  const size = 10;
  const finder = (r, c) => (r < 3 && c < 3) || (r < 3 && c >= 7) || (r >= 7 && c < 3);
  const finderHollow = (r, c) => (r === 1 && c === 1) || (r === 1 && c === 8) || (r === 8 && c === 1);
  const pixels = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let on;
      if (finder(r, c)) on = !finderHollow(r, c);
      else on = (r * 7 + c * 13 + (r % 3)) % 3 !== 0;
      pixels.push(on);
    }
  }
  return pixels;
}

const SCAN_TABS = ['All'];
const QR_GRID_SIZE = 10;

let jsQRLoadPromise = null;
function loadJsQR() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (jsQRLoadPromise) return jsQRLoadPromise;
  jsQRLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js';
    script.onload = () => resolve(window.jsQR);
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return jsQRLoadPromise;
}

export default function QRCheckinScreen() {
  const { token, pocOf } = useAuth();
  const showToast = useToast();
  const managedSociety = pocOf && pocOf[0];
  const pixels = useMemo(buildQrPixels, []);

  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastDecoded, setLastDecoded] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const processingRef = useRef(false);

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

  async function loadAttendees() {
    if (!selectedEventId) return;
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

  useEffect(() => {
    setIsLoading(true);
    loadAttendees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, token]);

  const selectedEvent = myEvents.find((e) => e._id === selectedEventId);
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const registeredCount = attendees.length;
  const rate = registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0;

  async function checkinByScannedToken(scannedToken) {
  try {
    const res = await fetch(`${EVENTS_API}/${selectedEventId}/checkin-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: scannedToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Check-in failed');

    setScanStatus(`✓ ${data.message}`);
    setRecentScans((prev) => [{ email: data.name, time: new Date().toLocaleTimeString(), ok: true }, ...prev].slice(0, 10));
    await loadAttendees();
  } catch (err) {
    setScanStatus(`✕ ${err.message}`);
    setRecentScans((prev) => [{ email: 'Unknown', time: new Date().toLocaleTimeString(), ok: false }, ...prev].slice(0, 10));
  }
}
  function openScanner() {
    setCameraError('');
    setLastDecoded('');
    setScanStatus('');
    setScannerOpen(true);
  }

  function closeScanner() {
    setScannerOpen(false);
    setLastDecoded('');
    processingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    if (!scannerOpen) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const jsQR = await loadJsQR().catch(() => null);
        if (jsQR) {
          const tick = () => {
            if (cancelled) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(imageData.data, imageData.width, imageData.height);
              if (result && result.data && !processingRef.current) {
  processingRef.current = true;
  setLastDecoded('QR scanned');
  checkinByScannedToken(result.data.trim()).finally(() => {
    setTimeout(() => { processingRef.current = false; }, 2000);
  });
}
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotAllowedError'
              ? 'Camera permission was denied. Allow camera access in your browser settings to scan.'
              : 'Could not access the camera on this device.'
          );
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen, selectedEventId]);

  function handleDownloadQr() {
    const cell = 20;
    const canvas = document.createElement('canvas');
    canvas.width = QR_GRID_SIZE * cell;
    canvas.height = QR_GRID_SIZE * cell;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    pixels.forEach((on, i) => {
      if (!on) return;
      const r = Math.floor(i / QR_GRID_SIZE);
      const c = i % QR_GRID_SIZE;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    });
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(selectedEvent?.title || 'event').replace(/\s+/g, '-').toLowerCase()}-entry-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  if (!managedSociety) {
    return <div className="page-pad"><p>You are not a POC for any society.</p></div>;
  }

  return (
    <div className="page-pad">
      <div className="page-head">
        <div>
          <label className="qr-event-lbl" htmlFor="qr-event-select">QR check-in for</label>
          <select
            id="qr-event-select"
            className="qr-event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {myEvents.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={openScanner}>Open Live Scanner</button>
      </div>

      <div className="qr-layout">
        <div className="qr-left">
          <div className="card qr-card">
            <h4>Event Entry QR</h4>
            <div className="qr-visual">
              {pixels.map((on, i) => (
                <div key={i} className={`px${on ? '' : ' off'}`} />
              ))}
            </div>
            <div className="qr-caption">
              {selectedEvent?.title} · {selectedEvent?.date ? new Date(selectedEvent.date).toLocaleDateString() : ''}
            </div>
           
          </div>
          <div className="qr-stats">
            <div className="card qr-stat"><div className="num">{checkedInCount}</div><div className="lbl">Checked In</div></div>
            <div className="card qr-stat"><div className="num">{registeredCount}</div><div className="lbl">Registered</div></div>
            <div className="card qr-stat"><div className="num">{rate}%</div><div className="lbl">Rate</div></div>
          </div>
          <button className="btn block" style={{ marginBottom: 10 }} onClick={openScanner}>Open Live Camera Scanner</button>
          <button className="btn outline block" onClick={handleDownloadQr}>Download QR Code</button>
        </div>

        <div className="qr-right">
          <div className="section-head">
            <h3>Recent Scans</h3>
            <div className="scan-tabs">
              {SCAN_TABS.map((t) => (
                <div key={t} className="seg active">{t}</div>
              ))}
            </div>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table>
              <tbody>
                <tr><th>Email</th><th>Result</th><th>Time</th></tr>
                {recentScans.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 10px' }}>No scans yet.</td></tr>
                ) : (
                  recentScans.map((s, i) => (
                    <tr key={i}>
                      <td>{s.email}</td>
                      <td><span className={`status-pill ${s.ok ? 'in' : 'pending'}`}>{s.ok ? 'Checked In' : 'Failed'}</span></td>
                      <td>{s.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {scannerOpen && (
        <div className="qr-scanner-overlay" onClick={closeScanner}>
          <div className="qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-scanner-head">
              <h3>Live QR Scanner</h3>
              <button className="tb-modal-close" onClick={closeScanner}>✕</button>
            </div>

            <div className="qr-scanner-body">
              {cameraError ? (
                <div className="qr-scanner-error">{cameraError}</div>
              ) : (
                <div className="qr-scanner-video-wrap">
                  <video ref={videoRef} className="qr-scanner-video" playsInline muted />
                  <div className="qr-scanner-frame" />
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {lastDecoded && (
                <div className="qr-scanner-result">
                  <span className="qr-scanner-result-lbl">Scanned:</span> {lastDecoded}
                </div>
              )}
              {scanStatus && (
                <div className="qr-scanner-result">{scanStatus}</div>
              )}

              <p className="qr-scanner-hint">
  Point the camera at the student's personal check-in QR code.
</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}