import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API_URL = `${import.meta.env.VITE_API_URL}/api/society-chat`;

const QUICK_ACTIONS = [
  'Send Event Update',
  'Request Approval',
  'Share Participant Count',
  'Share Budget',
  'Share Sponsorship Progress',
  'Share Meeting Notes',
  'Send Reminder',
];

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function UpdatesToHeadScreen() {
  const { token } = useAuth();
  const showToast = useToast();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [markUrgent, setMarkUrgent] = useState(false);
  const [search, setSearch] = useState('');

  const scrollRef = useRef(null);

  useEffect(() => {
    async function loadThread() {
      try {
        const res = await fetch(`${API_URL}/my-thread`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load messages');
        setMessages(data.messages);
      } catch (err) {
        showToast(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadThread();
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [messages, search]);

  const pinnedMessages = messages.filter((m) => m.pinned);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = markUrgent ? `[URGENT] ${draft.trim()}` : draft.trim();
    if (!draft.trim()) return;

    try {
      const res = await fetch(`${API_URL}/my-thread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send');

      setMessages((prev) => [...prev, data]);
      setDraft('');
      setMarkUrgent(false);
    } catch (err) {
      showToast(err.message);
    }
  }

  function handleQuickAction(label) {
    setDraft((d) => (d ? `${d} ${label}:` : `${label}: `));
  }

  async function togglePin(m) {
    try {
      const res = await fetch(`${API_URL}/message/${m._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: !m.pinned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages((prev) => prev.map((msg) => (msg._id === data._id ? data : msg)));
    } catch (err) {
      showToast(err.message);
    }
  }

  async function toggleUrgentFlag(m) {
    try {
      const res = await fetch(`${API_URL}/message/${m._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ urgent: !m.urgent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages((prev) => prev.map((msg) => (msg._id === data._id ? data : msg)));
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="shd-page uth2-shell">
      <header className="uth2-header">
        <div>
          <h1 className="uth2-page-title">Updates to Society Head</h1>
          <p className="uth2-page-subtitle">Send progress updates and get quick approvals.</p>
        </div>
      </header>

      <div className="uth2-scroll">
        <div className="uth2-toolbar">
          <div className="uth2-search">
            <svg className="uth2-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="uth2-search-input"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {pinnedMessages.length > 0 && (
            <div className="uth2-pinned-chip">
              <span className="uth2-pinned-chip-icon">📌</span>
              {pinnedMessages.length} pinned
            </div>
          )}
        </div>

        {pinnedMessages.length > 0 && (
          <section className="uth2-pinned-panel">
            {pinnedMessages.map((m) => (
              <div className="uth2-pinned-row" key={m._id}>{m.text}</div>
            ))}
          </section>
        )}

        <section className="uth2-chat-panel">
          <div className="uth2-messages" ref={scrollRef}>
            {isLoading ? (
              <p style={{ padding: 16 }}>Loading messages…</p>
            ) : filteredMessages.length === 0 ? (
              <div className="uth2-empty">No messages yet — say hi 👋</div>
            ) : (
              filteredMessages.map((m) => {
                const isMe = m.sender === 'poc';
                return (
                  <div className={`uth2-msg${isMe ? ' me' : ''}`} key={m._id}>
                    <div className={`uth2-bubble${m.urgent ? ' urgent' : ''}`}>
                      {m.urgent && <span className="uth2-urgent-badge">Urgent</span>}
                      <div className="uth2-bubble-sender">{isMe ? 'You' : 'Society Head'}</div>
                      <div className="uth2-bubble-text">{m.text}</div>
                      <div className="uth2-bubble-meta">
                        <span className="uth2-bubble-time">{formatTime(m.createdAt)}</span>
                        <button type="button" className="uth2-bubble-action" onClick={() => togglePin(m)}>
                          {m.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button type="button" className="uth2-bubble-action" onClick={() => toggleUrgentFlag(m)}>
                          {m.urgent ? 'Unmark urgent' : 'Mark urgent'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="uth2-quick-actions">
            {QUICK_ACTIONS.map((label) => (
              <button
                key={label}
                type="button"
                className="uth2-quick-btn"
                onClick={() => handleQuickAction(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="uth2-composer">
        <form className="uth2-input-row" onSubmit={sendMessage}>
          <input
            type="text"
            className="uth2-text-input"
            placeholder="Type an update..."
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

          <button type="submit" className="uth2-send-btn" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}