/* ------------------------------------------------------------------ */
/*  Shared mock data + helpers for the entire Society Head section.   */
/*  Swap the exported constants for real API calls (scoped to the     */
/*  logged-in head's societyId) when the backend is ready.            */
/* ------------------------------------------------------------------ */

export const HEAD_PROFILE = {
  name: 'Ritika Sharma',
  designation: 'President',
};

export const SOCIETY = {
  name: 'Codeher Society',
  logoInitials: 'CH',
  category: 'Technology & Development',
  founded: 2019,
  description:
    'Building a community of women engineers at IGDTUW through hands-on projects, workshops, and peer mentorship.',
  president: 'Ritika Sharma',
  vicePresident: 'Ananya Verma',
  facultyCoordinator: 'Dr. Meenal Kapoor',
  officialEmail: 'codeher@igdtuw.ac.in',
  socials: { instagram: '@codeher.igdtuw', linkedin: 'Codeher Society IGDTUW' },
  achievements: [
    'Winner — Smart India Hackathon (Software Edition) 2025',
    'Best Technical Society — IGDTUW Fest 2025',
    '3 open-source contributions merged upstream in 2025',
  ],
};

export const EXEC_TEAM = [
  { name: 'Ritika Sharma', role: 'President', responsibilities: 'Overall strategy, external relations', assignment: 'Alumni Speaker Series', contact: 'ritika@igdtuw.ac.in', initials: 'RS', color: 'pink' },
  { name: 'Ananya Verma', role: 'Vice President', responsibilities: 'Internal operations, budgeting', assignment: 'Hack-Her-Night', contact: 'ananya@igdtuw.ac.in', initials: 'AV', color: 'blue' },
  { name: 'Simran Kaur', role: 'General Secretary', responsibilities: 'Documentation, member records', assignment: 'Recruitment Drive', contact: 'simran@igdtuw.ac.in', initials: 'SK', color: 'green' },
  { name: 'Divya Menon', role: 'Joint Secretary', responsibilities: 'Sponsorships, finance tracking', assignment: 'Alumni Speaker Series', contact: 'divya@igdtuw.ac.in', initials: 'DM', color: 'amber' },
  { name: 'Fatima Khan', role: 'Society POC', responsibilities: 'Event execution lead', assignment: 'Hack-Her-Night', contact: 'fatima@igdtuw.ac.in', initials: 'FK', color: 'purple' },
  { name: 'Priya Nair', role: 'Society POC', responsibilities: 'Speaker & venue coordination', assignment: 'Alumni Speaker Series', contact: 'priya@igdtuw.ac.in', initials: 'PN', color: 'blue' },
];

export const EVENTS = [
  { id: 1, name: 'Intro to Git Workshop', date: 'Jul 28, 2026', venue: 'Lab 4', status: 'upcoming', registrations: 96, capacity: 120, attendance: null, feedback: null },
  { id: 2, name: 'Hack-Her-Night', date: 'Aug 4, 2026', venue: 'Seminar Hall 2', status: 'upcoming', registrations: 61, capacity: 80, attendance: null, feedback: null },
  { id: 3, name: 'Alumni Speaker Series', date: 'Aug 14, 2026', venue: 'Auditorium', status: 'upcoming', registrations: 140, capacity: 150, attendance: null, feedback: null },
  { id: 4, name: 'UI/UX Bootcamp', date: 'May 22, 2026', venue: 'Lab 2', status: 'completed', registrations: 132, capacity: 140, attendance: 118, feedback: '4.6 / 5 avg rating' },
  { id: 5, name: 'Orientation 2026', date: 'Feb 3, 2026', venue: 'Auditorium', status: 'completed', registrations: 175, capacity: 180, attendance: 169, feedback: '4.8 / 5 avg rating' },
  { id: 6, name: 'DSA Sprint Series', date: 'Jul 25, 2026', venue: 'Lab 1', status: 'ongoing', registrations: 88, capacity: 100, attendance: 74, feedback: 'In progress' },
];

export const REGISTRATION_STATS = [
  { event: 'Git Workshop', registered: 96, attended: 0 },
  { event: 'Hack-Her-Night', registered: 61, attended: 0 },
  { event: 'UI/UX Bootcamp', registered: 132, attended: 118 },
  { event: 'Orientation', registered: 175, attended: 169 },
];

export const MONTHLY_GROWTH = [
  { month: 'Feb', members: 138, events: 1 },
  { month: 'Mar', members: 149, events: 2 },
  { month: 'Apr', members: 155, events: 1 },
  { month: 'May', members: 162, events: 2 },
  { month: 'Jun', members: 172, events: 1 },
  { month: 'Jul', members: 184, events: 3 },
];

export const RECRUITMENT = {
  applied: 210,
  shortlisted: 96,
  interviewed: 68,
  selected: 46,
  currentTeamStrength: 184,
  stage: 'Interviews in progress',
};

export const VOLUNTEERS = [
  { name: 'Fatima Khan', hours: 38, tasks: 14 },
  { name: 'Priya Nair', hours: 31, tasks: 11 },
  { name: 'Vaani Gupta', hours: 27, tasks: 9 },
  { name: 'Ishita Rao', hours: 22, tasks: 8 },
];

export const TIMELINE = [
  { date: 'Feb 2026', category: 'Recruitment', label: 'AY 2026–27 recruitment drive opened' },
  { date: 'Mar 2026', category: 'Workshops', label: 'Intro to Git & GitHub — 3-part workshop series' },
  { date: 'Apr 2026', category: 'Hackathons', label: 'Internal 24-hr hackathon — "Build for Bharat"' },
  { date: 'May 2026', category: 'Workshops', label: 'UI/UX Bootcamp — highest attendance yet' },
  { date: 'Jun 2026', category: 'Cultural Events', label: 'Society Foundation Day celebration' },
  { date: 'Jul 2026', category: 'Achievements', label: 'Won Smart India Hackathon (Software Edition)' },
  { date: 'Aug 2026', category: 'Annual Report', label: 'Semester report compiled and shared with faculty' },
];

export const REPORTS = [
  { name: 'Monthly Activity Report — Jun 2026', size: '212 KB', date: 'Jul 1', type: 'Monthly' },
  { name: 'Semester Report — Jan–Jun 2026', size: '480 KB', date: 'Jul 5', type: 'Semester' },
  { name: 'Attendance Summary — Q2 2026', size: '184 KB', date: 'Jul 3', type: 'Attendance' },
  { name: 'Registration Report — Q2 2026', size: '156 KB', date: 'Jul 3', type: 'Registration' },
  { name: 'Event Performance Report — UI/UX Bootcamp', size: '96 KB', date: 'May 25', type: 'Event Performance' },
];

export const POC_UPDATES = [
  { poc: 'Fatima Khan', category: 'Venue Confirmed', text: 'Venue confirmed for Hack-Her-Night — Seminar Hall 2, 6–10 PM.', time: '2h ago' },
  { poc: 'Priya Nair', category: 'Sponsorship Finalized', text: 'Speaker for the Alumni Series confirmed: Ms. Ananya Iyer (Google).', time: '1d ago' },
  { poc: 'Fatima Khan', category: 'Registrations Opened', text: 'Git Workshop registration closes tonight — 96/120 filled.', time: '2d ago' },
  { poc: 'Simran Kaur', category: 'Poster Uploaded', text: 'Recruitment drive poster uploaded for social media.', time: '3d ago' },
  { poc: 'Priya Nair', category: 'Judges Confirmed', text: 'Judging panel finalized for the DSA Sprint Series demo day.', time: '4d ago' },
  { poc: 'Fatima Khan', category: 'Event Completed', text: 'UI/UX Bootcamp wrapped — feedback forms sent out.', time: '1w ago' },
];

export const NOTIFICATIONS = [
  { category: 'New Event', text: '"DSA Sprint Series" was created by Fatima Khan.', time: '3h ago', read: false },
  { category: 'Venue Change', text: 'Hack-Her-Night moved from Lab 3 to Seminar Hall 2.', time: '1d ago', read: false },
  { category: 'Sponsorship', text: 'Sponsorship confirmed for Alumni Speaker Series.', time: '1d ago', read: true },
  { category: 'Recruitment', text: 'Shortlist for AY 2026–27 recruitment is ready for review.', time: '2d ago', read: false },
  { category: 'Milestone', text: 'Society crossed 180 total members.', time: '4d ago', read: true },
  { category: 'Report', text: 'Semester Report — Jan–Jun 2026 is ready to download.', time: '5d ago', read: true },
];

export const HEALTH = { engagement: 82, attendance: 76, activity: 88, eventSuccess: 91 };

export const ANALYTICS_INSIGHTS = {
  mostSuccessfulEvent: 'Orientation 2026 (97% attendance)',
  averageAttendance: '89%',
  totalParticipantsThisSemester: 604,
  activeVolunteers: 12,
  totalEventsConducted: 9,
};

/* ---------------- helpers ---------------- */

export function overallHealth(h) {
  return Math.round((h.engagement + h.attendance + h.activity + h.eventSuccess) / 4);
}

export function healthLabel(score) {
  if (score >= 85) return { text: 'Thriving', color: 'green' };
  if (score >= 70) return { text: 'Healthy', color: 'blue' };
  if (score >= 50) return { text: 'Needs attention', color: 'amber' };
  return { text: 'At risk', color: 'pink' };
}

export function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}