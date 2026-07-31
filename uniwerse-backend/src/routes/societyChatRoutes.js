const express = require('express');
const router = express.Router();
const { getMyThread, sendAsPoc, getThreads, getThreadMessages, sendAsHead, updateMessageFlags } = require('../controllers/societyChatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-thread', getMyThread);
router.post('/my-thread', sendAsPoc);
router.get('/threads', getThreads);
router.get('/thread/:pocId', getThreadMessages);
router.post('/thread/:pocId', sendAsHead);
router.patch('/message/:id', updateMessageFlags);

module.exports = router;