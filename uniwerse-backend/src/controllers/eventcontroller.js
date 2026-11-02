const Event = require('../models/Event');
const Society = require('../models/Society');
const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// POST /api/events — only a Student who is POC for that society
const createEvent = async (req, res) => {
  try {
    const { title, societyId, societyName, category, about, date, time, venue, capacity, audience, registrationDeadline, checklist } = req.body;

    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only a society POC can create events' });
    }

    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'User not found' });

    // Find the society: by id if given, otherwise by name (case/space-insensitive).
    const norm = (v) => String(v || '').trim().toLowerCase();
    let society = societyId ? await Society.findById(societyId).catch(() => null) : null;

    const wantedName = societyName || (society && society.name) || student.pocOf[0];
    if (!society && wantedName) {
      const all = await Society.find();
      society = all.find((s) => norm(s.name) === norm(wantedName)) || null;
    }

    // Still not found? Create it from the POC's own society name so publishing never gets stuck.
    if (!society) {
      const pocName = student.pocOf.find((n) => norm(n) === norm(wantedName));
      if (!pocName) return res.status(403).json({ message: 'You are not a POC for this society' });
      society = await Society.create({ name: pocName.trim(), category: 'General' });
    }

    const isPoc = student.pocOf.some((n) => norm(n) === norm(society.name));
    if (!isPoc) {
      return res.status(403).json({ message: 'You are not a POC for this society' });
    }

    const event = await Event.create({
      title, society: society._id, societyName: society.name, category, about,
      date, time, venue, capacity, audience, registrationDeadline,
      checklist: Array.isArray(checklist) ? checklist : [],
    });
    // Notify every student about the new event
    const students = await User.find({ role: 'Student' }).select('_id');
    if (students.length > 0) {
      await Notification.insertMany(
        students.map((s) => ({
          recipient: s._id,
          icon: '📅',
          title: 'New event published',
          body: `${society.name} just published "${event.title}" — check it out!`,
          priority: 'update',
          category: 'events',
          societyName: society.name,
          eventName: event.title,
          link: `/student/event/${event._id}`,
        }))
      );
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/events — list all, with optional ?society=<id> filter
const getEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.society) filter.society = req.query.society;

    const events = await Event.find(filter).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events/:id/register — logged-in student registers themselves
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role === 'Guest' && event.audience === 'igdtuw') {
      return res.status(403).json({ message: 'This event is only open to IGDTUW members' });
    }

    if (event.capacity && event.registeredStudents.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }
    if (event.registeredStudents.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already registered' });
    }

    event.registeredStudents.push(req.user.id);
    await event.save();

    await Notification.create({
      recipient: req.user.id,
      icon: '🎟️',
      title: 'Registration confirmed',
      body: `You're registered for "${event.title}".`,
      priority: 'info',
      category: 'registrations',
      societyName: event.societyName,
      eventName: event.title,
      link: `/student/event/${event._id}`,
    });

    res.status(200).json({ message: 'Registered successfully', registeredCount: event.registeredStudents.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/events/:id/register — unregister
const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.registeredStudents = event.registeredStudents.filter((id) => id.toString() !== req.user.id);
    await event.save();

    await Notification.create({
      recipient: req.user.id,
      icon: 'ℹ️',
      title: 'Registration cancelled',
      body: `You've unregistered from "${event.title}".`,
      priority: 'info',
      category: 'registrations',
      societyName: event.societyName,
      eventName: event.title,
      link: `/student/event/${event._id}`,
    });

    res.status(200).json({ message: 'Unregistered', registeredCount: event.registeredStudents.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/events/:id — only the POC who can create for this society can edit
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only a society POC can edit events' });
    }
    const student = await User.findById(req.user.id);
    const isPoc = student && student.pocOf.includes(event.societyName);
    if (!isPoc) {
      return res.status(403).json({ message: 'You are not a POC for this event\'s society' });
    }

    const { title, category, about, date, time, venue, capacity, audience, registrationDeadline } = req.body;
    if (title !== undefined) event.title = title;
    if (category !== undefined) event.category = category;
    if (about !== undefined) event.about = about;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (venue !== undefined) event.venue = venue;
    if (capacity !== undefined) event.capacity = capacity;
    if (audience !== undefined) event.audience = audience;
    if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline;

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/events/:id/attendees — POC only, returns registered students with check-in status
const getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registeredStudents', 'name email role');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a society POC can view attendees' });
    const student = await User.findById(req.user.id);
    if (!student || !student.pocOf.includes(event.societyName)) {
      return res.status(403).json({ message: 'You are not a POC for this event\'s society' });
    }

    const checkedInIds = new Set(event.checkedInStudents.map((id) => id.toString()));

    const attendees = event.registeredStudents.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      checkedIn: checkedInIds.has(s._id.toString()),
    }));

    res.status(200).json(attendees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events/:id/checkin — POC only, marks a registered student as checked in by email
const checkinStudent = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Student email is required' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a society POC can check students in' });
    const pocStudent = await User.findById(req.user.id);
    if (!pocStudent || !pocStudent.pocOf.includes(event.societyName)) {
      return res.status(403).json({ message: 'You are not a POC for this event\'s society' });
    }

    const target = await User.findOne({ email: email.toLowerCase().trim() });
    if (!target) return res.status(404).json({ message: 'No account found with that email' });

    const isRegistered = event.registeredStudents.some((id) => id.toString() === target._id.toString());
    if (!isRegistered) return res.status(400).json({ message: `${target.name} is not registered for this event` });

    const alreadyIn = event.checkedInStudents.some((id) => id.toString() === target._id.toString());
    if (alreadyIn) return res.status(400).json({ message: `${target.name} is already checked in` });

    event.checkedInStudents.push(target._id);
    await event.save();
    await Notification.create({
      recipient: target._id,
      icon: '✅',
      title: 'Checked in successfully',
      body: `You've been checked in to "${event.title}".`,
      priority: 'info',
      category: 'qr',
      societyName: event.societyName,
      eventName: event.title,
      link: `/student/event/${event._id}`,
    });

    res.status(200).json({ message: `${target.name} checked in successfully`, checkedInCount: event.checkedInStudents.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/events/:id — only the POC for that event's society
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a society POC can delete events' });
    const student = await User.findById(req.user.id);
    if (!student || !student.pocOf.includes(event.societyName)) {
      return res.status(403).json({ message: 'You are not a POC for this event\'s society' });
    }

    await event.deleteOne();
    res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
async function callGroqForDescription(title, category, venue, audience) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const prompt = `Write a short, engaging event description (3-5 sentences) for a college event with these details:
Title: ${title || 'Untitled Event'}
Category: ${category || 'General'}
Venue: ${venue || 'TBD'}
Audience: ${audience === 'igdtuw' ? 'IGDTUW students only' : audience === 'outsiders' ? 'primarily outside participants' : 'open to everyone'}

Keep it concise, friendly, and student-facing. Do not include the title as a heading. Just return the description text, nothing else.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Could not generate a description right now.';
}

// POST /api/events/generate-description — POC only
const generateDescription = async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a society POC can use this' });

    const { title, category, venue, audience } = req.body;
    const description = await callGroqForDescription(title, category, venue, audience);
    res.status(200).json({ description });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/events/:id/my-checkin-token — a registered student gets their unique QR payload
const getMyCheckinToken = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isRegistered = event.registeredStudents.some((id) => id.toString() === req.user.id);
    if (!isRegistered) return res.status(400).json({ message: 'You are not registered for this event' });

    const token = jwt.sign(
      { userId: req.user.id, eventId: event._id.toString(), purpose: 'checkin' },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events/:id/checkin-token — POC scans a student's QR, this verifies + checks them in
const checkinByToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'QR token is required' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a society POC can check students in' });
    const pocStudent = await User.findById(req.user.id);
    if (!pocStudent || !pocStudent.pocOf.includes(event.societyName)) {
      return res.status(403).json({ message: 'You are not a POC for this event\'s society' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    if (decoded.purpose !== 'checkin' || decoded.eventId !== event._id.toString()) {
      return res.status(400).json({ message: 'This QR code is not valid for this event' });
    }

    const target = await User.findById(decoded.userId);
    if (!target) return res.status(404).json({ message: 'Student account not found' });

    const isRegistered = event.registeredStudents.some((id) => id.toString() === decoded.userId);
    if (!isRegistered) return res.status(400).json({ message: `${target.name} is not registered for this event` });

    const alreadyIn = event.checkedInStudents.some((id) => id.toString() === decoded.userId);
    if (alreadyIn) return res.status(400).json({ message: `${target.name} is already checked in` });

    event.checkedInStudents.push(target._id);
    await event.save();

    res.status(200).json({ message: `${target.name} checked in successfully`, name: target.name, checkedInCount: event.checkedInStudents.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createEvent, getEvents, getEventById, registerForEvent, unregisterFromEvent, updateEvent, getEventAttendees, checkinStudent, deleteEvent, generateDescription, getMyCheckinToken, checkinByToken };
