const express = require('express');
const router = express.Router();
const {
  createEvent, getEvents, getEventById, registerForEvent, unregisterFromEvent,
  updateEvent, getEventAttendees, checkinStudent, deleteEvent, generateDescription,
  getMyCheckinToken, checkinByToken,
} = require('../controllers/eventcontroller');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, createEvent);
router.post('/generate-description', protect, generateDescription);
router.patch('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, unregisterFromEvent);
router.get('/:id/attendees', protect, getEventAttendees);
router.post('/:id/checkin', protect, checkinStudent);
router.get('/:id/my-checkin-token', protect, getMyCheckinToken);
router.post('/:id/checkin-token', protect, checkinByToken);

module.exports = router;