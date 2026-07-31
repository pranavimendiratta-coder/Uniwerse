const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  icon: { type: String, default: '🔔' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  priority: { type: String, enum: ['important', 'reminder', 'update', 'info'], default: 'info' },
  category: { type: String, default: 'general' },
  societyName: { type: String, default: null },
  eventName: { type: String, default: null },
  link: { type: String, default: '/student' },
  unread: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);