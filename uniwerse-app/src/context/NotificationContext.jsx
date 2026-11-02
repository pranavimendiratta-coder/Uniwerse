import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`;

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, accessType } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      if (!token) { setItems([]); setIsLoading(false); return; }
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const mapped = data.map((n) => ({
            id: n._id,
            unread: n.unread,
            timestamp: n.createdAt,
            icon: n.icon,
            title: n.title,
            body: n.body,
            priority: n.priority,
            category: n.category,
            societyName: n.societyName,
            eventName: n.eventName,
            link: n.link,
          }));
          setItems(mapped);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifications();
  }, [token, accessType]);

  const markAsRead = async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await fetch(`${API_URL}/mark-all-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <NotificationContext.Provider value={{ items, isLoading, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}