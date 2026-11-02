const crypto = require('crypto');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');

const GROQ_URL = process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are the UniWerse Assistant, a helpful chatbot inside a college event management system (UniWerse) for IGDTUW.
You help students with general questions about using the platform (finding events, registering, managing societies, etc).
You do NOT have access to live event or registration data — if asked for specific real-time details, say you don't have that data yet and suggest checking the relevant screen in the app.
Keep answers concise and friendly.`;

function getSmartFallbackReply(messageText) {
  const query = (messageText || '').toLowerCase();

  if (/outsider|external|guest|non-igdtuw/i.test(query)) {
    return "Outsiders and guests are welcome to attend events marked with the 'Open to All' or 'Outsiders' tag on the UniWerse feed. Simply sign up with your personal/college email and click 'Register Now' on the event card to secure your pass!";
  }

  if (/how to register|registering|sign up for event|registration/i.test(query)) {
    return "To register for any event in UniWerse:\n1. Open your Student Home feed.\n2. Tap on the event card that interests you.\n3. Click 'Register Now'. Your registration will be confirmed immediately and a personal QR entry pass will be generated under 'My Registrations'.";
  }

  if (/my events|registered events|ticket|pass|attending/i.test(query)) {
    return "You can view all the events you have registered for on your Student Home screen under 'Registered Events' or through the Calendar view. Click on any event to see your entry status and QR code.";
  }

  if (/qr|checkin|check-in|entry|gate/i.test(query)) {
    return "For event check-in, open your registered event details to view your personal QR code pass. Show this QR at the venue entrance where the Society POC will scan it to verify your attendance.";
  }

  if (/society|societies|club|clubs|join|recruitment/i.test(query)) {
    return "UniWerse hosts all active IGDTUW societies including Cultural Society, IEEE Student Branch, E-Cell, Photo Club, and Academic Club. Check the 'Societies' tab in your app to view active recruitment drives, past events, and POC contacts!";
  }

  if (/poc|head|host|organize|create event/i.test(query)) {
    return "Society POCs can schedule new events, generate AI descriptions, track RSVPs, and scan QR check-ins from the Society Dashboard. Society Heads can manage executive teams and monitor society health analytics.";
  }

  if (/hi|hello|hey|help|who are you/i.test(query)) {
    return "Hi there! I'm your UniWerse Campus Assistant. I'm here to help you discover IGDTUW events, guide you through registrations, explain guest entry rules, and find active society recruitment. What can I help you with today?";
  }

  return "Thanks for reaching out! UniWerse makes campus event discovery and attendance seamless. You can browse upcoming fests, hackathons, and workshops on your Home feed, filter by audience, and register in one click. Let me know if you need help with a specific event or society!";
}

async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    return getSmartFallbackReply(lastUserMsg);
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API returned status ${response.status}. Using smart fallback.`);
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      return getSmartFallbackReply(lastUserMsg);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || getSmartFallbackReply();
  } catch (err) {
    console.warn('Groq API call failed:', err.message, '- falling back to smart reply.');
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    return getSmartFallbackReply(lastUserMsg);
  }
}

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    let { sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (!sessionId) sessionId = crypto.randomUUID();

    const userId = req.user.id;

    await ChatMessage.create({ user: userId, sessionId, role: 'user', content: message.trim() });

    const history = await ChatMessage.find({ user: userId, sessionId })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const reply = await callGroq(groqMessages);

    await ChatMessage.create({ user: userId, sessionId, role: 'assistant', content: reply });

    res.status(200).json({ sessionId, reply });
  } catch (error) {
    console.error('Chat error:', error);
    const fallbackReply = getSmartFallbackReply(req.body?.message);
    res.status(200).json({ sessionId: req.body?.sessionId || crypto.randomUUID(), reply: fallbackReply });
  }
};

const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await ChatMessage.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$sessionId', firstMessage: { $first: '$content' }, lastActivity: { $last: '$createdAt' } } },
      { $sort: { lastActivity: -1 } },
    ]);

    res.status(200).json(
      sessions.map((s) => ({ sessionId: s._id, preview: s.firstMessage.slice(0, 60), lastActivity: s.lastActivity }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const messages = await ChatMessage.find({ user: userId, sessionId }).sort({ createdAt: 1 }).lean();

    res.status(200).json(
      messages.map((m) => ({ from: m.role === 'user' ? 'user' : 'bot', text: m.content, createdAt: m.createdAt }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getSessions, getSessionMessages };
