const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  society: { type: String, required: true, index: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  roleInterest: { type: String, default: '' },
  message: { type: String, default: '' },
  stage: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected'],
    default: 'Applied',
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);