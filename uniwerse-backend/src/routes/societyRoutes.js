const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { createSociety, getSocieties, getSocietyById, updateSociety, getMySociety, updateMySociety, addGalleryImage, removeGalleryImage } = require('../controllers/societyController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads', 'gallery')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

router.get('/', getSocieties);
router.get('/mine', protect, requireRole('Society Head'), getMySociety);
router.patch('/mine', protect, requireRole('Society Head'), updateMySociety);
router.post('/mine/gallery', protect, requireRole('Society Head'), galleryUpload.single('image'), addGalleryImage);
router.delete('/mine/gallery', protect, requireRole('Society Head'), removeGalleryImage);
router.get('/:id', getSocietyById);
router.post('/', protect, requireRole('Society Head'), createSociety);
router.patch('/:id', protect, requireRole('Society Head', 'Society POC'), updateSociety);

module.exports = router;