function pad(n) { return String(n).padStart(2, '0'); }

// Parses 'Jul 22, 2025' + optional '4:00 PM – 9:00 PM' into real Date objects
export function parseEventDateTime(dateStr, timeStr) {
  const base = new Date(dateStr);
  if (!timeStr) return { start: base, end: new Date(base.getTime() + 60 * 60 * 1000) };
  const [startPart, endPart] = timeStr.split('–').map((s) => s.trim());
  const applyTime = (d, t) => {
    const m = t.match(/(\d+):(\d+)\s?(AM|PM)/i);
    if (!m) return d;
    let hh = parseInt(m[1], 10) % 12;
    const mm = parseInt(m[2], 10);
    if (m[3].toUpperCase() === 'PM') hh += 12;
    const nd = new Date(d);
    nd.setHours(hh, mm, 0, 0);
    return nd;
  };
  const start = applyTime(base, startPart);
  const end = endPart ? applyTime(base, endPart) : new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

export function icsDate(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function triggerDownload(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadICS(event) {
  const { start, end } = parseEventDateTime(event.date, event.time);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UniWerse//Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@uniwerse`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.society} · ${event.venue}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  triggerDownload(`${event.id}.ics`, ics);
}

export function downloadAllICS(evts) {
  const blocks = evts.map((event) => {
    const { start, end } = parseEventDateTime(event.date, event.time);
    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@uniwerse`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.society} · ${event.venue}`,
      'END:VEVENT',
    ].join('\r\n');
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UniWerse//Calendar//EN', ...blocks, 'END:VCALENDAR'].join('\r\n');
  triggerDownload('my-events.ics', ics);
}

export function googleCalendarLink(event) {
  const { start, end } = parseEventDateTime(event.date, event.time);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: `${event.society} · ${event.venue}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookLink(event) {
  const { start, end } = parseEventDateTime(event.date, event.time);
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: `${event.society} · ${event.venue}`,
    startdt: toISO(start),
    enddt: toISO(end),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}