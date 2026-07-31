const Notification = require('../models/Notification');

// GET /api/notifications — mine only, newest first
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/:id — mark one as read
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    notif.unread = false;
    await notif.save();
    res.status(200).json(notif);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/notifications/mark-all-read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, unread: true }, { unread: false });
    res.status(200).json({ message: 'All marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };