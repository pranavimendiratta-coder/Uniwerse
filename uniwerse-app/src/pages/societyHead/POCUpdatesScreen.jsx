import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API_URL = `${import.meta.env.VITE_API_URL}/api/society-chat`;

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function POCUpdatesScreen() {
  const { token } = useAuth();
  const showToast = useToast();

  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePocId, setActivePocId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [markUrgent, setMarkUrgent] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    async function loadThreads() {
      try {
        const res = await fetch(`${API_URL}/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setThreads(data);
          if (data.length > 0) setActivePocId(data[0].pocId);
        }
      } catch (err) {
        console.error('Failed to load threads', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadThreads();
  }, [token]);

  useEffect(() => {
    async function loadMessages() {
      if (!activePocId) { setActiveMessages([]); return; }
      try {
        const res = await fetch(`${API_URL}/thread/${activePocId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setActiveMessages(data);
      } catch (err) {
        console.error('Failed to load thread', err);
      }
    }
    loadMessages();
  }, [activePocId, token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages]);

  const openPoc = (pocId) => setActivePocId(pocId);

  async function sendMessage(e) {
  e.preventDefault();
  if (!draft.trim() || !activePocId) return;
  const text = markUrgent ? `[URGENT] ${draft.trim()}` : draft.trim();

  try {
    const res = await fetch(`${API_URL}/thread/${activePocId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, urgent: markUrgent }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send');

    setActiveMessages((prev) => [...prev, data]);
    setThreads((prev) => prev.map((t) => (t.pocId === activePocId ? { ...t, lastMessage: data.text, lastAt: data.createdAt } : t)));
    setDraft('');
    setMarkUrgent(false);
  } catch (err) {
    showToast(err.message);
  }
}
  const activePoc = threads.find((t) => t.pocId === activePocId);

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Messages with Society POCs</h1>
          <p className="shd-subtitle">
            Chat directly with each POC to track progress without managing execution.
          </p>
        </div>
      </div>

      <section className="shd-card poc-chat-card">
        <div className="poc-chat-shell">
          <div className="poc-list">
            {isLoading ? (
              <p style={{ padding: 16 }}>Loading…</p>
            ) : threads.length === 0 ? (
              <div className="shd-empty">No POCs found.</div>
            ) : (
              threads.map((t) => {
                const isActive = t.pocId === activePocId;
                return (
                  <button
                    key={t.pocId}
                    type="button"
                    className={`poc-list-item${isActive ? ' active' : ''}`}
                    onClick={() => openPoc(t.pocId)}
                  >
                    <div className="poc-list-avatar">{getInitials(t.pocName)}</div>
                    <div className="poc-list-info">
                      <span className="poc-list-name">{t.pocName}</span>
                      <span className="poc-list-preview">
                        {t.lastMessage || 'No messages yet'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="poc-thread">
            {activePoc ? (
              <>
                <div className="poc-thread-head">
                  <div className="poc-list-avatar">{getInitials(activePoc.pocName)}</div>
                  <div>
                    <span className="poc-thread-name">{activePoc.pocName}</span>
                    <span className="poc-thread-status">Society POC</span>
                  </div>
                </div>

                <div className="poc-thread-messages" ref={scrollRef}>
                {activeMessages.map((m) => (
  <div
    key={m._id}
    className={`poc-bubble-row${m.sender === 'head' ? ' me' : ''}`}
  >
    <div className={`poc-bubble${m.urgent ? ' urgent' : ''}`}>
      {m.urgent && <span className="uth2-urgent-badge">Urgent</span>}
      <span className="poc-bubble-text">{m.text}</span>
      <span className="poc-bubble-time">{formatTime(m.createdAt)}</span>
    </div>
  </div>
))}
                  {activeMessages.length === 0 && (
                    <div className="shd-empty">No messages yet — say hi 👋</div>
                  )}
                </div>

               <form className="poc-thread-input" onSubmit={sendMessage}>
  <input
    type="text"
    placeholder={`Message ${activePoc.pocName.split(' ')[0]}...`}
    value={draft}
    onChange={(e) => setDraft(e.target.value)}
  />
  <label className="uth2-urgent-check">
    <input
      type="checkbox"
      checked={markUrgent}
      onChange={(e) => setMarkUrgent(e.target.checked)}
    />
    Urgent
  </label>
  <button type="submit" className="shd-btn primary small">
    Send
  </button>
</form>
              </>
            ) : (
              <div className="shd-empty">Select a POC to view the conversation.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}