const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getSessions, getSessionMessages } = require('../controllers/chatController');

router.use(protect);

router.post('/', sendMessage);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId', getSessionMessages);

module.exports = router;