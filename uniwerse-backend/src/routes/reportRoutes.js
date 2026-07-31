const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  uploadReport,
  getReports,
  downloadReport,
  deleteReport,
} = require('../controllers/reportController');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'reports');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.get('/', protect, requireRole('Society Head'), getReports);
router.post('/', protect, requireRole('Society Head'), upload.single('file'), uploadReport);
router.get('/:id/download', protect, requireRole('Society Head'), downloadReport);
router.delete('/:id', protect, requireRole('Society Head'), deleteReport);

module.exports = router;