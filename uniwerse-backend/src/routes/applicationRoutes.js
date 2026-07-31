const express = require('express');
const router = express.Router();
const { applyToSociety, getMyApplications, getApplicationsForSociety, updateApplicationStage } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, applyToSociety);
router.get('/mine', protect, getMyApplications);
router.get('/', protect, getApplicationsForSociety);
router.patch('/:id', protect, updateApplicationStage);

module.exports = router;