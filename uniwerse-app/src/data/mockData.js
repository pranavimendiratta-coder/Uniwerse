// Mock data shared across the Student and Society dashboards — mirrors the
// hard-coded content in the original static demo pages.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// NOTE: these deadlines are generated relative to "now" purely so the demo
// shows all three states (open / closing soon / closed) without editing
// dates by hand. Swap for real ISO deadlines from the backend when wiring up.
const deadline = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();

export const events = [
  {
    id: 'cultural-fest-2025',
    title: 'Annual Cultural Fest 2025',
    society: 'Cultural Society',
    societyId: 'cultural-society',
    date: 'Jul 22, 2025',
    time: '4:00 PM – 9:00 PM',
    venue: 'Main Auditorium',
    capacity: 500,
    registered: 312,
    audience: 'open',
    category: 'Fest',
    gradient: 'grad-pink',
    tags: ['Cultural', 'Offline'],
    registrationDeadline: deadline(2 * DAY + 5 * HOUR),
    isRegistered: false,
    about:
      "IGDTUW's biggest cultural night of the year — an evening of dance, music, and drama performances from every society on campus, followed by celebrity night and food stalls. Open to all colleges; outside guests can register with a valid ID from their institution.",
  },
  {
    id: 'tech-innovation-summit',
    title: 'Tech Innovation Summit',
    society: 'IEEE Student Branch',
    societyId: 'ieee-student-branch',
    date: 'Jul 25, 2025',
    venue: 'Seminar Hall B',
    audience: 'igdtuw',
    category: 'Seminar',
    gradient: 'grad-blue',
    registrationDeadline: deadline(-DAY), // already passed → closed
    isRegistered: false,
  },
  {
    id: 'startup-pitch-day',
    title: 'Startup Pitch Day',
    society: 'E-Cell',
    societyId: 'e-cell',
    date: 'Jul 28, 2025',
    venue: 'MBA Block',
    audience: 'open',
    category: 'Seminar',
    gradient: 'grad-green',
    registrationDeadline: deadline(10 * HOUR), // closing soon
    isRegistered: true, // demo the "✓ Registered" state
  },
  {
    id: 'photography-workshop',
    title: 'Photography Workshop',
    society: 'Photo Club',
    societyId: 'photo-club',
    date: 'Aug 2, 2025',
    venue: 'Arts Block, Rm 12',
    audience: 'outsiders',
    category: 'Workshop',
    gradient: 'grad-blue',
    registrationDeadline: deadline(5 * DAY),
    isRegistered: false,
  },
  {
    id: 'quiz-night',
    title: 'Quiz Night — General Knowledge',
    society: 'Academic Club',
    societyId: 'academic-club',
    date: 'Aug 5, 2025',
    venue: 'LT-1, Ground Floor',
    audience: 'igdtuw',
    category: 'Seminar',
    gradient: 'grad-pink',
    registrationDeadline: deadline(-2 * HOUR), // just closed
    isRegistered: false,
  },
  {
    id: 'iot-hackathon',
    title: 'IoT Hackathon 2025',
    society: 'IEEE Student Branch',
    societyId: 'ieee-student-branch',
    date: 'Aug 10, 2025',
    venue: 'Innovation Lab',
    audience: 'open',
    category: 'Hackathon',
    gradient: 'grad-navy',
    registrationDeadline: deadline(30 * 60 * 1000), // 30 min → closing soon
    isRegistered: false,
  },
];

// ------------------------------------------------------------------
// Societies — powers the directory, card previews, and profile page
// ------------------------------------------------------------------
export const societyCategories = [
  'Technical',
  'Cultural',
  'Academic',
  'Entrepreneurship',
  'Photography',
];

export const societies = [
  {
    id: 'cultural-society',
    name: 'Cultural Society',
    category: 'Cultural',
    tagline: "Dance, drama, and music — IGDTUW's creative heartbeat.",
    gradient: 'grad-pink',
    logoInitials: 'CS',
    verified: true,
    activeSince: 2016,
    description:
      'The Cultural Society runs IGDTUW\'s dance, drama, and music circles year-round, culminating in the Annual Cultural Fest. We welcome performers and backstage crew alike — no prior experience required.',
    mission: 'To give every student a stage — literally — regardless of experience level.',
    vision: 'A campus where creative expression is as valued as academic achievement.',
    objectives: [
      'Host at least one major performance event each semester',
      'Run beginner-friendly workshops in dance, drama, and music',
      'Represent IGDTUW at inter-college cultural festivals',
    ],
    facultyCoordinator: 'Dr. Ritu Malhotra',
    team: {
      president: 'Ishita Verma',
      vicePresident: 'Kavya Reddy',
      generalSecretary: 'Priyanshi Gupta',
      executiveTeam: [
        { name: 'Simran Kaur', role: 'Dance Lead' },
        { name: 'Ananya Das', role: 'Drama Lead' },
        { name: 'Ritika Sharma', role: 'Music Lead' },
      ],
    },
    email: 'cultural.society@igdtuw.ac.in',
    instagram: '@igdtuw.cultural',
    linkedin: 'linkedin.com/company/igdtuw-cultural-society',
    website: null,
    contactPerson: 'Ishita Verma',
    membersCount: 86,
    eventsOrganised: 12,
    stats: { workshops: 8, hackathons: 0, competitions: 5 },
    upcomingEvents: [
      { id: 'cultural-fest-2025', title: 'Annual Cultural Fest 2025', date: 'Jul 22, 2025' },
      { title: 'Dance Showcase', date: 'Aug 4, 2025' },
      { title: 'Drama Night: Antigone', date: 'Aug 12, 2025' },
    ],
    pastEvents: [
      { title: 'Spring Fest 2025', date: 'Mar 14, 2025' },
      { title: 'Open Mic Night', date: 'Jan 20, 2025' },
    ],
    activity: [
      { icon: '📢', text: 'Registration open for Annual Cultural Fest 2025', time: '2 days ago' },
      { icon: '🎉', text: 'New event added — Dance Showcase', time: '5 days ago' },
      { icon: '📸', text: 'Photos from Spring Fest uploaded', time: '2 weeks ago' },
    ],
    gallery: [],
  },
  {
    id: 'ieee-student-branch',
    name: 'IEEE Student Branch',
    category: 'Technical',
    tagline: 'Building, hacking, and learning — one project at a time.',
    gradient: 'grad-blue',
    logoInitials: 'IE',
    verified: true,
    activeSince: 2014,
    description:
      'IEEE Student Branch IGDTUW hosts technical seminars, workshops, and hackathons focused on embedded systems, IoT, and emerging hardware — connecting students with industry mentors and real build experience.',
    mission: 'To bridge classroom theory and real hardware/software practice.',
    vision: 'Every IGDTUW engineer graduating with at least one shipped project.',
    objectives: [
      'Run a flagship hackathon every year',
      'Host monthly technical seminars with industry speakers',
      'Mentor first-years on IoT and embedded fundamentals',
    ],
    facultyCoordinator: 'Dr. Neha Kapoor',
    team: {
      president: 'Simran Kaur',
      vicePresident: 'Tanvi Oberoi',
      generalSecretary: 'Naina Bhatt',
      executiveTeam: [
        { name: 'Riya Kapoor', role: 'Hackathon Lead' },
        { name: 'Divya Menon', role: 'Workshops Lead' },
      ],
    },
    email: 'ieee.sb@igdtuw.ac.in',
    instagram: '@ieee.igdtuw',
    linkedin: 'linkedin.com/company/ieee-igdtuw',
    website: 'https://ieee-igdtuw.org',
    contactPerson: 'Simran Kaur',
    membersCount: 64,
    eventsOrganised: 9,
    stats: { workshops: 6, hackathons: 3, competitions: 2 },
    upcomingEvents: [
      { id: 'tech-innovation-summit', title: 'Tech Innovation Summit', date: 'Jul 25, 2025' },
      { id: 'iot-hackathon', title: 'IoT Hackathon 2025', date: 'Aug 10, 2025' },
    ],
    pastEvents: [{ title: 'Robotics Workshop', date: 'Jun 2, 2025' }],
    activity: [
      { icon: '📢', text: 'Registration closing soon for IoT Hackathon 2025', time: '1 day ago' },
      { icon: '🏆', text: 'Robotics Workshop results announced', time: '1 week ago' },
    ],
    gallery: [],
  },
  {
    id: 'e-cell',
    name: 'E-Cell',
    category: 'Entrepreneurship',
    tagline: 'Turning student ideas into startups.',
    gradient: 'grad-green',
    logoInitials: 'EC',
    verified: false,
    activeSince: 2019,
    description:
      'The Entrepreneurship Cell runs pitch days, founder talks, and mentorship circles for students building their first ventures, from ideation to first funding conversations.',
    mission: 'To make founding a startup feel accessible from year one.',
    vision: 'IGDTUW recognised as a launchpad for student-founded companies.',
    objectives: [
      'Host a pitch day every semester',
      'Connect students with alumni founders and investors',
      'Run a founder-fundamentals workshop series',
    ],
    facultyCoordinator: 'Dr. Anjali Bhatia',
    team: {
      president: 'Meher Chadha',
      vicePresident: 'Diya Sharma',
      generalSecretary: 'Aisha Khan',
      executiveTeam: [{ name: 'Ritu Nair', role: 'Partnerships Lead' }],
    },
    email: 'ecell@igdtuw.ac.in',
    instagram: '@ecell.igdtuw',
    linkedin: 'linkedin.com/company/ecell-igdtuw',
    website: null,
    contactPerson: 'Meher Chadha',
    membersCount: 41,
    eventsOrganised: 6,
    stats: { workshops: 4, hackathons: 0, competitions: 2 },
    upcomingEvents: [{ id: 'startup-pitch-day', title: 'Startup Pitch Day', date: 'Jul 28, 2025' }],
    pastEvents: [{ title: 'Founder Fireside Chat', date: 'May 10, 2025' }],
    activity: [
      { icon: '📢', text: 'Registration open for Startup Pitch Day', time: '3 days ago' },
    ],
    gallery: [],
  },
  {
    id: 'photo-club',
    name: 'Photo Club',
    category: 'Photography',
    tagline: 'Seeing campus life one frame at a time.',
    gradient: 'grad-blue',
    logoInitials: 'PC',
    verified: false,
    activeSince: 2021,
    description:
      'Photo Club runs weekend shoots, editing workshops, and an annual exhibition — open to beginners with just a phone camera and to DSLR regulars alike.',
    mission: 'To make photography feel approachable, not equipment-gated.',
    vision: 'A yearly exhibition that becomes a campus tradition.',
    objectives: [
      'Run monthly weekend shoots',
      'Host an annual exhibition of member work',
      'Teach editing fundamentals to beginners',
    ],
    facultyCoordinator: 'Prof. Sunita Rao',
    team: {
      president: 'Aarushi Jain',
      vicePresident: 'Nandini Roy',
      generalSecretary: 'Prisha Malhotra',
      executiveTeam: [],
    },
    email: 'photoclub@igdtuw.ac.in',
    instagram: '@igdtuw.photoclub',
    linkedin: null,
    website: null,
    contactPerson: 'Aarushi Jain',
    membersCount: 28,
    eventsOrganised: 5,
    stats: { workshops: 3, hackathons: 0, competitions: 1 },
    upcomingEvents: [{ id: 'photography-workshop', title: 'Photography Workshop', date: 'Aug 2, 2025' }],
    pastEvents: [{ title: 'Campus Frames Exhibition', date: 'Apr 18, 2025' }],
    activity: [
      { icon: '🎉', text: 'New event added — Photography Workshop', time: '4 days ago' },
    ],
    gallery: [],
  },
  {
    id: 'academic-club',
    name: 'Academic Club',
    category: 'Academic',
    tagline: 'Quizzing, debating, and general nerding out.',
    gradient: 'grad-pink',
    logoInitials: 'AC',
    verified: false,
    activeSince: 2017,
    description:
      'The Academic Club hosts quiz nights, inter-college debates, and subject-focused study circles for students who like a good argument backed by facts.',
    mission: 'To make intellectual curiosity a social activity, not a solitary one.',
    vision: 'The go-to society for anyone who misses a good pub quiz.',
    objectives: [
      'Run a quiz night every month',
      'Host at least one inter-college debate meet per year',
      'Maintain subject-focused study circles each exam season',
    ],
    facultyCoordinator: 'Dr. Kavita Sen',
    team: {
      president: 'Riya Malhotra',
      vicePresident: 'Tanya Singh',
      generalSecretary: 'Ovi Chatterjee',
      executiveTeam: [],
    },
    email: 'academicclub@igdtuw.ac.in',
    instagram: '@igdtuw.academic',
    linkedin: null,
    website: null,
    contactPerson: 'Riya Malhotra',
    membersCount: 33,
    eventsOrganised: 7,
    stats: { workshops: 2, hackathons: 0, competitions: 4 },
    upcomingEvents: [{ id: 'quiz-night', title: 'Quiz Night — General Knowledge', date: 'Aug 5, 2025' }],
    pastEvents: [{ title: 'Inter-College Debate Meet', date: 'Feb 8, 2025' }],
    activity: [
      { icon: '📢', text: 'Registration closed for Quiz Night', time: '6 hours ago' },
    ],
    gallery: [],
  },
];

export function getSocietyById(id) {
  return societies.find((s) => s.id === id);
}

export function getEventById(id) {
  return events.find((e) => e.id === id);
}

export const societyEvents = [
  { name: 'Tech Innovation Summit', date: 'Jul 25', registered: 89, audience: 'igdtuw' },
  { name: 'Robotics Workshop', date: 'Aug 2', registered: 42, audience: 'open' },
  { name: 'IoT Hackathon 2025', date: 'Aug 10', registered: 116, audience: 'open' },
  { name: 'Web Dev Bootcamp', date: 'Aug 20', registered: 34, audience: 'igdtuw' },
];

export const attendees = [
  { initials: 'PN', name: 'Priya Nair', idNo: '22CS001', type: 'igdtuw', dept: 'CSE', email: '22cs001@edu', checkin: '2:34 PM', status: 'in' },
  { initials: 'RS', name: 'Ravi Shankar', idNo: '22EC045', type: 'igdtuw', dept: 'ECE', email: '22ec045@edu', checkin: '—', status: 'pending' },
  { initials: 'AS', name: 'Ananya Singh', idNo: 'G-2301', type: 'guest', dept: 'DTU', email: 'g-2301@edu', checkin: '2:31 PM', status: 'in' },
  { initials: 'AK', name: 'Arun Kumar', idNo: 'G-2302', type: 'guest', dept: 'NSUT', email: 'g-2302@edu', checkin: '—', status: 'pending' },
  { initials: 'SP', name: 'Sneha Pillai', idNo: '22CS088', type: 'igdtuw', dept: 'CSE', email: '22cs088@edu', checkin: '2:28 PM', status: 'in' },
  { initials: 'MA', name: 'Mohammed Ali', idNo: 'G-2303', type: 'guest', dept: 'IGIT', email: 'g-2303@edu', checkin: '—', status: 'pending' },
  { initials: 'LR', name: 'Lakshmi R.', idNo: '22EC112', type: 'igdtuw', dept: 'ECE', email: '22ec112@edu', checkin: '2:25 PM', status: 'in' },
];

export const recentScans = [
  { name: 'Priya Nair', type: 'igdtuw', idNo: '22CS001', time: '4:34 PM' },
  { name: 'Ananya Singh', type: 'guest', idNo: 'G-2301', time: '4:31 PM' },
  { name: 'Ravi Sharma', type: 'igdtuw', idNo: '22EC045', time: '4:28 PM' },
  { name: 'Kiran Mehta', type: 'guest', idNo: 'G-2304', time: '4:25 PM' },
  { name: 'Sneha Pillai', type: 'igdtuw', idNo: '22CS088', time: '4:22 PM' },
  { name: 'Lakshmi R.', type: 'igdtuw', idNo: '22EC112', time: '4:19 PM' },
];

export const taskBoard = {
  pending: [
    { text: 'Book venue for Symposium', tags: ['Logistics', 'Due Jul 18'], av: 'RK' },
    { text: 'Send speaker invitation emails', tags: ['Outreach', 'Due Jul 19'], av: 'PM' },
    { text: 'Design social media poster', tags: ['Design', 'Due Jul 20'], av: 'AS' },
  ],
  inProgress: [
    { text: 'Set up registration form on UniWerse', tags: ['Tech', 'Due Jul 22'], av: 'SA' },
    { text: 'Coordinate with sponsors for banner', tags: ['Finance', 'Due Jul 21'], av: 'DM' },
  ],
  done: [
    { text: 'Create event on UniWerse platform', tags: ['Admin', 'Due Jul 15'], av: 'SA' },
    { text: 'Get HOD approval and venue letter', tags: ['Admin', 'Due Jul 14'], av: 'RK' },
  ],
};

export const audiencePill = {
  open: { className: 'pill open', label: 'Open for All' },
  igdtuw: { className: 'pill igdtuw', label: 'IGDTUW Only' },
  outsiders: { className: 'pill outsiders', label: 'Open for All' },
};