const express = require('express');
const router = express.Router();
const { getUsers, addPoc, removePoc, getSocietyPocs } = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, getUsers);
router.post('/add-poc', protect, requireRole('Society Head'), addPoc);
router.post('/remove-poc', protect, requireRole('Society Head'), removePoc);
router.get('/pocs', protect, getSocietyPocs);

module.exports = router;