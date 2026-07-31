const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  tagline: { type: String, default: '' },
  logoInitials: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  activeSince: { type: Number },
  description: { type: String, default: '' },
  mission: { type: String, default: '' },
  vision: { type: String, default: '' },
  objectives: { type: [String], default: [] },
  facultyCoordinator: { type: String, default: '' },
  team: {
    president: { type: String, default: '' },
    vicePresident: { type: String, default: '' },
    generalSecretary: { type: String, default: '' },
    executiveTeam: [
      {
        name: String,
        role: String,
      },
    ],
  },
  email: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  instagram: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  website: { type: String, default: null },
  membersCount: { type: Number, default: 0 },
  eventsOrganised: { type: Number, default: 0 },
  stats: {
    workshops: { type: Number, default: 0 },
    hackathons: { type: Number, default: 0 },
    competitions: { type: Number, default: 0 },
  },
  activity: [
    {
      icon: String,
      text: String,
      time: String,
    },
  ],
  gallery: { type: [String], default: [] },
  discord: { type: String, default: '' },
  recruitmentStatus: { type: String, enum: ['Open', 'Closed', 'Opening Soon'], default: 'Open' },
  resourcesLink: { type: String, default: '' },
  achievements: { type: [String], default: [] },
  accentColor: { type: String, default: '#16294F' },
  execTeam: {
    type: [{
      name: String,
      role: String,
      responsibilities: String,
      assignment: String,
      contact: String,
      linkedin: String,
      color: String,
      initials: String,
    }],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Society', societySchema);