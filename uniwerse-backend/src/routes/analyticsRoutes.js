const express = require('express');
const router = express.Router();
const { getSocietyAnalytics, getHealthScore } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/society', protect, getSocietyAnalytics);
router.get('/health-score', protect, getHealthScore);

module.exports = router;