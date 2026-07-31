// Derives 1-2 letter initials for an avatar, from a name (preferred) or email (fallback).
export function getInitials(name, email) {
  const source = (name || '').trim();

  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (email) {
    return email.trim().slice(0, 2).toUpperCase();
  }

  return '?';
}