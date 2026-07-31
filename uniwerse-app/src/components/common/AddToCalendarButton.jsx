import { useState } from 'react';
import { downloadICS, googleCalendarLink, outlookLink } from '../../utils/calendarExport';

export default function AddToCalendarButton({ event, className = 'btn outline sm', label = '📅 Add to Calendar' }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={className} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className="dropdown-menu" style={{ top: '110%', right: 0 }} onMouseLeave={() => setOpen(false)}>
          <a href={googleCalendarLink(event)} target="_blank" rel="noreferrer" className="dropdown-item">
            Google Calendar
          </a>
          <button className="dropdown-item" onClick={() => { downloadICS(event); setOpen(false); }}>
            Apple Calendar (.ics)
          </button>
          <a href={outlookLink(event)} target="_blank" rel="noreferrer" className="dropdown-item">
            Outlook Calendar
          </a>
          <button className="dropdown-item" onClick={() => { downloadICS(event); setOpen(false); }}>
            Download .ics File
          </button>
        </div>
      )}
    </div>
  );
}