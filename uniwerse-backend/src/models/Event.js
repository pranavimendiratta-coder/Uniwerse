const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  societyName: { type: String, required: true }, // denormalized for easy display, avoids extra lookups everywhere
  category: { type: String, default: '' },
  about: { type: String, default: '' },
  date: { type: Date, required: true },
  time: { type: String, default: '' }, // display string e.g. "5:00 PM"
  venue: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  audience: { type: String, enum: ['open', 'igdtuw', 'outsiders'], default: 'igdtuw' },
  registrationDeadline: { type: Date },
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  checkedInStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  checklist: [{
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);