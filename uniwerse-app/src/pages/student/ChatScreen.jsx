import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL}/api/chat`;
const SUGGESTIONS = ['Outsider-open events', 'How to register?', 'My events', 'Event QR help'];

export default function ChatScreen() {
  const showToast = useToast();
  const { token } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I can help you find events, check who can attend, and manage registrations. What would you like to know?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load past chat sessions for the sidebar, once on mount
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch(`${API_URL}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setSessions(data);
      } catch (err) {
        console.error('Failed to load chat sessions', err);
      }
    }
    if (token) loadSessions();
  }, [token]);

  // Load messages of a specific past session when clicked
  async function openSession(id) {
    try {
      const res = await fetch(`${API_URL}/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(id);
        setMessages(data);
      }
    } catch (err) {
      showToast('Could not load that chat');
    }
  }

  function startNewChat() {
    setSessionId(null);
    setMessages([
      { from: 'bot', text: 'Hi! I can help you find events, check who can attend, and manage registrations. What would you like to know?' },
    ]);
  }

  async function sendChat(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Chat failed');

      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { from: 'bot', text: data.reply }]);
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <button className="btn block" style={{ marginBottom: 18 }} onClick={startNewChat}>+ New Chat</button>
        <div className="rr-title">Recent Chats</div>
        {sessions.map((s) => (
          <div
            className={`chat-history-item${s.sessionId === sessionId ? ' active' : ''}`}
            key={s.sessionId}
            onClick={() => openSession(s.sessionId)}
          >
            {s.preview}
          </div>
        ))}
      </div>
      <div className="chat-main">
        <div className="chat-head">
          <div className="av">AI</div>
          <div><b>UniWerse Assistant</b><div className="status"><span className="dt" />Online</div></div>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div className={`msg${m.from === 'user' ? ' user' : ''}`} key={i}>
              <div className="av">{m.from === 'user' ? 'AS' : 'AI'}</div>
              <div className="msg-bubble">{m.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="msg">
              <div className="av">AI</div>
              <div className="msg-bubble typing-dots"><span /><span /><span /></div>
            </div>
          )}
        </div>
        <div className="chat-suggest">
          {SUGGESTIONS.map((s) => (
            <span className="tag" key={s} onClick={() => sendChat(s)}>{s}</span>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          />
          <button className="chat-send" onClick={() => sendChat()}>→</button>
        </div>
      </div>
    </div>
  );
}