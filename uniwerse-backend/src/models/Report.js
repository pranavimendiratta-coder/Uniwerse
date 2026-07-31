const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  society: { type: String, required: true, index: true },
  fileName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
  uploadedByName: { type: String, default: '' },
  uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);