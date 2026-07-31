const mongoose = require('mongoose');

const societyChatMessageSchema = new mongoose.Schema({
  society: { type: String, required: true, index: true },
  pocId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // identifies the thread — always the POC side, regardless of sender
  sender: { type: String, enum: ['head', 'poc'], required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  pinned: { type: Boolean, default: false },
urgent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SocietyChatMessage', societyChatMessageSchema);