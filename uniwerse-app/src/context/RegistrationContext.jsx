import { createContext, useContext, useState } from 'react';
import { events as seedEvents } from '../data/mockData';

const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  // Seed from whatever mockData already marks as registered
  const initialIds = seedEvents.filter((e) => e.isRegistered).map((e) => e.id);
  const [registeredIds, setRegisteredIds] = useState(new Set(initialIds));

  const isRegistered = (eventId) => registeredIds.has(eventId);

  const registerEvent = (eventId) => {
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });
    // TODO: once backend exists, POST registration here instead of / alongside local state
  };

  const unregisterEvent = (eventId) => {
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  return (
    <RegistrationContext.Provider value={{ isRegistered, registerEvent, unregisterEvent, registeredIds }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistrations() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistrations must be used within a RegistrationProvider');
  return ctx;
}