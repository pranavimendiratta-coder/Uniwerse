const crypto = require('crypto');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are the UniWerse Assistant, a helpful chatbot inside a college event management system (UniWerse) for IGDTUW.
You help students with general questions about using the platform (finding events, registering, managing societies, etc).
You do NOT have access to live event or registration data — if asked for specific real-time details, say you don't have that data yet and suggest checking the relevant screen in the app.
Keep answers concise and friendly.`;

async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

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
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a reply.";
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
    res.status(500).json({ message: error.message });
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