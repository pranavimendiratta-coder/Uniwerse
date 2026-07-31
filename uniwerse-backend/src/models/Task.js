const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  society: { type: String, required: true }, // society name, same pattern as Event.societyName
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }, // optional link to an event
  text: { type: String, required: true },
  tags: { type: [String], default: [] },
  assigneeName: { type: String, default: null },
  status: { type: String, enum: ['pending', 'inProgress', 'done'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);