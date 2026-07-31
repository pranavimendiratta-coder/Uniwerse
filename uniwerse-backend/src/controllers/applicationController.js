const Application = require('../models/Application');
const User = require('../models/User');

function isHeadOrPocFor(req, society) {
  if (req.user.role === 'Society Head') return req.user.society === society;
  return false; // POC check needs DB lookup, handled separately below where needed
}

// POST /api/applications — a logged-in student applies to a society
const applyToSociety = async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can apply to societies' });
    }
    const { society, roleInterest, message } = req.body;
    if (!society) return res.status(400).json({ message: 'society is required' });

    const student = await User.findById(req.user.id);

    const existing = await Application.findOne({ society, applicant: req.user.id, stage: { $ne: 'Rejected' } });
    if (existing) return res.status(400).json({ message: 'You already have an active application for this society' });

    const application = await Application.create({
      society,
      applicant: req.user.id,
      applicantName: student.name,
      applicantEmail: student.email,
      roleInterest: roleInterest || '',
      message: message || '',
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/applications/mine — a student sees their own applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/applications?society=Cultural Society — Head or POC views all applications for their society
const getApplicationsForSociety = async (req, res) => {
  try {
    const { society } = req.query;
    if (!society) return res.status(400).json({ message: 'society query param is required' });

    let allowed = req.user.role === 'Society Head' && req.user.society === society;
    if (!allowed && req.user.role === 'Student') {
      const student = await User.findById(req.user.id);
      allowed = student && student.pocOf.includes(society);
    }
    if (!allowed) return res.status(403).json({ message: 'Not authorized to view these applications' });

    const applications = await Application.find({ society }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/applications/:id — Head or POC updates the stage
const updateApplicationStage = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    let allowed = req.user.role === 'Society Head' && req.user.society === application.society;
    if (!allowed && req.user.role === 'Student') {
      const student = await User.findById(req.user.id);
      allowed = student && student.pocOf.includes(application.society);
    }
    if (!allowed) return res.status(403).json({ message: 'Not authorized to update this application' });

    const { stage } = req.body;
    const validStages = ['Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected'];
    if (!validStages.includes(stage)) return res.status(400).json({ message: 'Invalid stage' });

    application.stage = stage;
    await application.save();
    res.status(200).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { applyToSociety, getMyApplications, getApplicationsForSociety, updateApplicationStage };