import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { notificationCategories } from '../../data/notificationsData';

const TIME_FILTERS = ['Today', 'Yesterday', 'This Week', 'Earlier'];
const PRIORITY_LABEL = {
  important: 'Important',
  reminder: 'Reminder',
  update: 'Update',
  info: 'Info',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function bucketOf(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (day < 1) return 'Today';
  if (day < 2) return 'Yesterday';
  if (day < 7) return 'This Week';
  return 'Earlier';
}

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { items, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const [category, setCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState(null);
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [query, setQuery] = useState('');
  

  const filtered = useMemo(() => {
    let list = items;

    if (category === 'unread') list = list.filter((n) => n.unread);
    else if (category !== 'all') list = list.filter((n) => n.category === category);

    if (timeFilter) list = list.filter((n) => bucketOf(n.timestamp) === timeFilter);
    if (priorityOnly) list = list.filter((n) => n.priority === 'important');

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          (n.societyName || '').toLowerCase().includes(q) ||
          (n.eventName || '').toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [items, category, timeFilter, priorityOnly, query]);

  const unreadCount = items.filter((n) => n.unread).length;

  const openNotification = (n) => {
    if (n.unread) markAsRead(n.id);
    navigate(n.link);
  };

  return (
    <div className="layout notif-layout">
      <div className="content-scroll notif-main">
        <div className="section-head">
          <h3>Notifications</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 600, alignItems: 'center' }}>
            {unreadCount > 0 && <span className="unread-count-pill">{unreadCount} unread</span>}
            <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={markAllAsRead}>
              Mark all read
           </a>
          </div>
        </div>

        <div className="searchbar" style={{ marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Search notifications by event, society, or keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="notif-tabs">
          {notificationCategories.map((c) => (
            <div
              key={c.key}
              className={`tab${category === c.key ? ' active' : ''}`}
              onClick={() => setCategory(c.key)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && setCategory(c.key)}
            >
              {c.label}
            </div>
          ))}
        </div>

        <div className="notif-filter-chips">
          {TIME_FILTERS.map((t) => (
            <div
              key={t}
              className={`chip-filter${timeFilter === t ? ' active' : ''}`}
              onClick={() => setTimeFilter((cur) => (cur === t ? null : t))}
            >
              {t}
            </div>
          ))}
          <div
            className={`chip-filter${priorityOnly ? ' active' : ''}`}
            onClick={() => setPriorityOnly((v) => !v)}
          >
            Important
          </div>
          {(timeFilter || priorityOnly || query) && (
            <div
              className="chip-filter clear"
              onClick={() => { setTimeFilter(null); setPriorityOnly(false); setQuery(''); }}
            >
              Clear filters ×
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state card">
            <h4>🎉 You're all caught up!</h4>
            <p>No new notifications.</p>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => navigate('/student')}>
              Browse Events
            </button>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              className={`notif-item-v2${n.unread ? ' unread' : ''}`}
              key={n.id}
              onClick={() => openNotification(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openNotification(n)}
            >
              <div className="notif-icon-badge">{n.icon}</div>
              <div className="notif-body-v2">
                <div className="notif-top-row">
                  <b>{n.title}</b>
                  <span className={`priority-badge ${n.priority}`}>{PRIORITY_LABEL[n.priority]}</span>
                  {n.unread && <span className="dot-unread" />}
                </div>
                <p>{n.body}</p>
                <div className="notif-meta-row">
                  {n.societyName && (
                    <span className="notif-society-tag">
                      <span className="notif-society-dot" /> {n.societyName}
                    </span>
                  )}
                  {n.eventName && <span className="notif-event-tag">{n.eventName}</span>}
                </div>
              </div>
              <div className="notif-time">{timeAgo(n.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}