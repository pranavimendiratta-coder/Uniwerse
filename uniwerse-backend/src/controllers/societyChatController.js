const SocietyChatMessage = require('../models/SocietyChatMessage');
const User = require('../models/User');

// --- POC side: always talks to "the Head", one thread only ---

// GET /api/society-chat/my-thread
const getMyThread = async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a POC can use this' });
    const student = await User.findById(req.user.id);
    const society = student.pocOf[0];
    if (!society) return res.status(400).json({ message: 'You are not a POC for any society' });

    const messages = await SocietyChatMessage.find({ society, pocId: req.user.id }).sort({ createdAt: 1 });
    res.status(200).json({ society, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/society-chat/my-thread
const sendAsPoc = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });
    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only a POC can use this' });

    const student = await User.findById(req.user.id);
    const society = student.pocOf[0];
    if (!society) return res.status(400).json({ message: 'You are not a POC for any society' });

    const message = await SocietyChatMessage.create({
      society, pocId: req.user.id, sender: 'poc', senderName: student.name, text: text.trim(),
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Head side: one thread per POC ---

// GET /api/society-chat/threads — list of this Head's POCs with last message preview
const getThreads = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head can use this' });

    const pocs = await User.find({ role: 'Student', pocOf: req.user.society }).select('name email');

    const threads = await Promise.all(
      pocs.map(async (poc) => {
        const last = await SocietyChatMessage.findOne({ society: req.user.society, pocId: poc._id }).sort({ createdAt: -1 });
        return {
          pocId: poc._id,
          pocName: poc.name,
          pocEmail: poc.email,
          lastMessage: last ? last.text : null,
          lastAt: last ? last.createdAt : null,
        };
      })
    );

    res.status(200).json(threads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/society-chat/thread/:pocId
const getThreadMessages = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head can use this' });
    const messages = await SocietyChatMessage.find({ society: req.user.society, pocId: req.params.pocId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/society-chat/thread/:pocId
const sendAsHead = async (req, res) => {
  try {
    const { text, urgent } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head can use this' });

    const message = await SocietyChatMessage.create({
      society: req.user.society, pocId: req.params.pocId, sender: 'head', senderName: 'Society Head',
      text: text.trim(), urgent: Boolean(urgent),
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// PATCH /api/society-chat/message/:id — toggle pinned/urgent (works for both POC and Head, own thread only)
const updateMessageFlags = async (req, res) => {
  try {
    const message = await SocietyChatMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Permission: must belong to this user's thread
    if (req.user.role === 'Student') {
      if (message.pocId.toString() !== req.user.id) return res.status(403).json({ message: 'Not your thread' });
    } else if (req.user.role === 'Society Head') {
      if (message.society !== req.user.society) return res.status(403).json({ message: 'Not your thread' });
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { pinned, urgent } = req.body;
    if (pinned !== undefined) message.pinned = pinned;
    if (urgent !== undefined) message.urgent = urgent;

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getMyThread, sendAsPoc, getThreads, getThreadMessages, sendAsHead, updateMessageFlags };