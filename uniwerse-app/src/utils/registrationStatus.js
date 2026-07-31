const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function getRegistrationStatus(deadlineISO) {
  if (!deadlineISO) return { key: 'open', label: 'Registration Open' };
  const diff = new Date(deadlineISO).getTime() - Date.now();
  if (diff <= 0) return { key: 'closed', label: 'Registration Closed' };
  if (diff <= DAY) return { key: 'closing', label: 'Closing Soon' };
  return { key: 'open', label: 'Registration Open' };
}

export function formatCountdown(deadlineISO) {
  if (!deadlineISO) return null;
  const diff = new Date(deadlineISO).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDeadlineDisplay(deadlineISO) {
  if (!deadlineISO) return '—';
  const d = new Date(deadlineISO);
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} • ${timePart}`;
}