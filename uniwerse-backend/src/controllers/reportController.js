const fs = require('fs');
const path = require('path');
const Report = require('../models/Report');
const User = require('../models/User');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'reports');

// POST /api/reports — Society Head uploads a file to their own society's archive
const uploadReport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file was uploaded' });

    const uploader = await User.findById(req.user.id);

    const report = await Report.create({
      society: req.user.society,
      fileName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedByName: uploader ? uploader.name : '',
      uploadedById: req.user.id,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/reports — list this society's archive, newest first
const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ society: req.user.society }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/:id/download
const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'File not found' });
    if (report.society !== req.user.society) {
      return res.status(403).json({ message: 'You cannot access another society\'s archive' });
    }

    const filePath = path.join(UPLOAD_DIR, report.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    res.download(filePath, report.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/reports/:id
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'File not found' });
    if (report.society !== req.user.society) {
      return res.status(403).json({ message: 'You cannot delete another society\'s file' });
    }

    const filePath = path.join(UPLOAD_DIR, report.storedName);
    fs.unlink(filePath, () => {}); // best-effort; ignore if already gone

    await report.deleteOne();
    res.status(200).json({ message: 'File deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { uploadReport, getReports, downloadReport, deleteReport };