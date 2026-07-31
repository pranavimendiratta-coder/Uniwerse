const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // A fixed, single role now — no more arrays here.
  role: {
    type: String,
    enum: ['Student', 'Society Head', 'Guest'],
    required: true,
    default: 'Student',
  },
  // Only meaningful for Society Head accounts — which society they head.
  society: {
    type: String,
    default: null,
  },
  // Only meaningful for Student accounts — list of societies they're
  // currently a POC for. Empty array = not a POC anywhere.
  pocOf: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);