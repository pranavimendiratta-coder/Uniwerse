const express = require('express');
const router = express.Router();
const { register, login, guestLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);

module.exports = router;