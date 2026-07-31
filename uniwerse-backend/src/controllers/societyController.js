const Society = require('../models/Society');
const Event = require('../models/Event');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const createSociety = async (req, res) => {
  try {
    const society = await Society.create(req.body);
    res.status(201).json(society);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSocieties = async (req, res) => {
  try {
    const societies = await Society.find();
    const withCounts = await Promise.all(societies.map(attachLiveCounts));
    res.status(200).json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSocietyById = async (req, res) => {
  try {
    const society = await Society.findById(req.params.id);
    if (!society) return res.status(404).json({ message: 'Society not found' });
    const withCounts = await attachLiveCounts(society);
    res.status(200).json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSociety = async (req, res) => {
  try {
    const society = await Society.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!society) return res.status(404).json({ message: 'Society not found' });
    res.status(200).json(society);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/societies/mine — the logged-in Head's own society
const getMySociety = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head has a society to manage' });
    const society = await Society.findOne({ name: req.user.society });
    if (!society) return res.status(404).json({ message: 'Society not found' });
    const withCounts = await attachLiveCounts(society);
    res.status(200).json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// PATCH /api/societies/mine — update the logged-in Head's own society
const updateMySociety = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head can edit a society' });
    const society = await Society.findOneAndUpdate({ name: req.user.society }, req.body, { new: true });
    if (!society) return res.status(404).json({ message: 'Society not found' });
    res.status(200).json(society);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
async function attachLiveCounts(societyDoc) {
  const society = societyDoc.toObject();
  const eventsOrganised = await Event.countDocuments({ society: societyDoc._id });
  const pocCount = await User.countDocuments({ role: 'Student', pocOf: societyDoc.name });
  const headCount = await User.countDocuments({ role: 'Society Head', society: societyDoc.name });
  society.eventsOrganised = eventsOrganised;
  society.membersCount = pocCount + headCount;
  return society;
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'gallery');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// POST /api/societies/mine/gallery — Society Head uploads one image to their own gallery
const addGalleryImage = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head can manage the gallery' });
    if (!req.file) return res.status(400).json({ message: 'No image was uploaded' });

    const url = `/uploads/gallery/${req.file.filename}`;

    const society = await Society.findOneAndUpdate(
      { name: req.user.society },
      { $push: { gallery: url } },
      { new: true }
    );
    if (!society) return res.status(404).json({ message: 'Society not found' });

    res.status(201).json({ url, gallery: society.gallery });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/societies/mine/gallery — body: { url }
const removeGalleryImage = async (req, res) => {
  try {
    if (req.user.role !== 'Society Head') return res.status(403).json({ message: 'Only a Society Head can manage the gallery' });
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'url is required' });

    const society = await Society.findOneAndUpdate(
      { name: req.user.society },
      { $pull: { gallery: url } },
      { new: true }
    );
    if (!society) return res.status(404).json({ message: 'Society not found' });

    const filename = url.split('/').pop();
    fs.unlink(path.join(UPLOAD_DIR, filename), () => {}); // best-effort cleanup

    res.status(200).json({ gallery: society.gallery });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createSociety, getSocieties, getSocietyById, updateSociety, getMySociety, updateMySociety, addGalleryImage, removeGalleryImage };