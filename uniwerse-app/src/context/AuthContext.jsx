import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

const STORAGE_KEYS = {
  accessType: 'uniwerseAccessType',
  role: 'uniwerseRole',
  email: 'uniwerseEmail',
  token: 'uniwerseToken',
  pocOf: 'uniwersePocOf',
  userId: 'uniwerseUserId',
  society: 'uniwerseSociety',
  name: 'uniwerseName',
};

export function AuthProvider({ children }) {
  const [accessType, setAccessType] = useState(() => sessionStorage.getItem(STORAGE_KEYS.accessType));
  const [role, setRole] = useState(() => sessionStorage.getItem(STORAGE_KEYS.role));
  const [email, setEmail] = useState(() => sessionStorage.getItem(STORAGE_KEYS.email) || '');
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEYS.token));
  const [pocOf, setPocOf] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.pocOf);
    return stored ? JSON.parse(stored) : [];
  });
  const [userId, setUserId] = useState(() => sessionStorage.getItem(STORAGE_KEYS.userId) || null);
  const [society, setSociety] = useState(() => sessionStorage.getItem(STORAGE_KEYS.society) || null);
  const [name, setName] = useState(() => sessionStorage.getItem(STORAGE_KEYS.name) || '');

  const [pendingRole, setPendingRole] = useState(null);
  const [pendingAccessType, setPendingAccessType] = useState(null);

  function persistSession({ nextRole, nextEmail, nextToken, nextAccessType, nextPocOf, nextUserId, nextSociety, nextName }) {
    sessionStorage.setItem(STORAGE_KEYS.accessType, nextAccessType);
    sessionStorage.setItem(STORAGE_KEYS.role, nextRole);
    sessionStorage.setItem(STORAGE_KEYS.email, nextEmail);
    sessionStorage.setItem(STORAGE_KEYS.token, nextToken);
    sessionStorage.setItem(STORAGE_KEYS.pocOf, JSON.stringify(nextPocOf || []));
    sessionStorage.setItem(STORAGE_KEYS.userId, nextUserId || '');
    sessionStorage.setItem(STORAGE_KEYS.society, nextSociety || '');
    sessionStorage.setItem(STORAGE_KEYS.name, nextName || '');
    setAccessType(nextAccessType);
    setRole(nextRole);
    setEmail(nextEmail);
    setToken(nextToken);
    setPocOf(nextPocOf || []);
    setUserId(nextUserId || null);
    setSociety(nextSociety || null);
    setName(nextName || '');
  }

  async function loginAsGuest(guestEmail) {
    const res = await fetch(`${API_URL}/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guestEmail }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Could not continue as guest');
    }

    persistSession({
      nextAccessType: 'guest',
      nextRole: data.user.role,
      nextEmail: data.user.email,
      nextToken: data.token,
      nextPocOf: data.user.pocOf,
      nextUserId: data.user.id,
      nextSociety: data.user.society,
      nextName: data.user.name,
    });

    return data.user;
  }

  async function login({ email: loginEmail, password }) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    persistSession({
      nextAccessType: 'member',
      nextRole: data.user.role,
      nextEmail: data.user.email,
      nextToken: data.token,
      nextPocOf: data.user.pocOf,
      nextUserId: data.user.id,
      nextSociety: data.user.society,
      nextName: data.user.name,
    });

    return data.user;
  }

  async function register({ name, email: regEmail, password, role: signupRole, society: signupSociety }) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: regEmail, password, role: signupRole, society: signupSociety }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    persistSession({
      nextAccessType: 'member',
      nextRole: data.user.role,
      nextEmail: data.user.email,
      nextToken: data.token,
      nextPocOf: data.user.pocOf,
      nextUserId: data.user.id,
      nextSociety: data.user.society,
      nextName: data.user.name,
    });

    return data.user;
  }

  function logout() {
    Object.values(STORAGE_KEYS).forEach((key) => sessionStorage.removeItem(key));
    setAccessType(null);
    setRole(null);
    setEmail('');
    setToken(null);
    setPocOf([]);
    setUserId(null);
    setSociety(null);
    setName('');
    setPendingRole(null);
    setPendingAccessType(null);
  }

  const value = {
    accessType,
    role,
    email,
    token,
    pocOf,
    userId,
    society,
    name,
    pendingRole,
    pendingAccessType,
    setPendingRole,
    setPendingAccessType,
    login,
    loginAsGuest,
    register,
    logout,
    isLoggedIn: Boolean(accessType),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}