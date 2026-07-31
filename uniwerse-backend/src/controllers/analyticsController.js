const Event = require('../models/Event');
const User = require('../models/User');

// GET /api/analytics/society — Society Head only, all-real numbers for their society
const getSocietyAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') {
      return res.status(403).json({ message: 'Only a Society Head can view analytics' });
    }

    const events = await Event.find({ societyName: req.user.society }).sort({ date: 1 });

    const totalEventsConducted = events.length;

    const eventPerformance = events.map((ev) => ({
      event: ev.title,
      registered: ev.registeredStudents.length,
      attended: ev.checkedInStudents.length,
    }));

    const attendanceTrends = eventPerformance
      .filter((e) => e.registered > 0)
      .map((e) => ({ event: e.event, pct: Math.round((e.attended / e.registered) * 100) }));

    const mostSuccessfulEvent = eventPerformance.length
      ? eventPerformance.reduce((max, e) => (e.registered > max.registered ? e : max), eventPerformance[0]).event
      : '—';

    const attendancePercentages = attendanceTrends.map((e) => e.pct);
    const averageAttendance = attendancePercentages.length
      ? `${Math.round(attendancePercentages.reduce((a, b) => a + b, 0) / attendancePercentages.length)}%`
      : '—';

    const uniqueParticipants = new Set();
    events.forEach((ev) => ev.registeredStudents.forEach((id) => uniqueParticipants.add(id.toString())));
    const totalParticipantsThisSemester = uniqueParticipants.size;

    const monthMap = {};
    events.forEach((ev) => {
      if (!ev.date) return;
      const d = new Date(ev.date);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (!monthMap[key]) monthMap[key] = { month: key, events: 0, registrations: 0 };
      monthMap[key].events += 1;
      monthMap[key].registrations += ev.registeredStudents.length;
    });
    const monthlyBreakdown = Object.values(monthMap);

    res.status(200).json({
      totalEventsConducted,
      eventPerformance,
      attendanceTrends,
      mostSuccessfulEvent,
      averageAttendance,
      totalParticipantsThisSemester,
      monthlyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function callGroqForHealthScore(stats) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const prompt = `You are analyzing a college society's performance. Based on this real data, give an overall health score from 0-100 and a one-sentence assessment.

Data:
- Total events conducted: ${stats.totalEventsConducted}
- Total unique participants this semester: ${stats.totalParticipantsThisSemester}
- Average attendance rate: ${stats.averageAttendance}
- Total members (POCs + Head): ${stats.membersCount}
- Most successful event: ${stats.mostSuccessfulEvent}

Respond ONLY in this exact JSON format, nothing else, no markdown:
{"score": <number 0-100>, "label": "<one or two words e.g. 'Strong', 'Needs Attention', 'Excellent'>", "summary": "<one sentence explanation>"}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return { score: 50, label: 'Unknown', summary: 'Could not generate an assessment right now.' };
  }
}

// GET /api/analytics/health-score — Society Head only
const getHealthScore = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') {
      return res.status(403).json({ message: 'Only a Society Head can view this' });
    }

    const events = await Event.find({ societyName: req.user.society });
    const totalEventsConducted = events.length;

    const uniqueParticipants = new Set();
    let totalRegistered = 0;
    let totalCheckedIn = 0;
    let bestEvent = { title: '—', registered: 0 };

    events.forEach((ev) => {
      ev.registeredStudents.forEach((id) => uniqueParticipants.add(id.toString()));
      totalRegistered += ev.registeredStudents.length;
      totalCheckedIn += ev.checkedInStudents.length;
      if (ev.registeredStudents.length > bestEvent.registered) {
        bestEvent = { title: ev.title, registered: ev.registeredStudents.length };
      }
    });

    const averageAttendance = totalRegistered > 0 ? `${Math.round((totalCheckedIn / totalRegistered) * 100)}%` : '0%';

    const pocCount = await User.countDocuments({ role: 'Student', pocOf: req.user.society });
    const headCount = await User.countDocuments({ role: 'Society Head', society: req.user.society });

    const result = await callGroqForHealthScore({
      totalEventsConducted,
      totalParticipantsThisSemester: uniqueParticipants.size,
      averageAttendance,
      membersCount: pocCount + headCount,
      mostSuccessfulEvent: bestEvent.title,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSocietyAnalytics, getHealthScore };