const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.patch('/mark-all-read', protect, markAllAsRead);
router.patch('/:id', protect, markAsRead);

module.exports = router;