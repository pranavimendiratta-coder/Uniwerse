
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
connectDB(); // ← add this

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running 🎉');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const chatRoutes = require('./src/routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);

const societyRoutes = require('./src/routes/societyRoutes');
app.use('/api/societies', societyRoutes);

const eventRoutes = require('./src/routes/eventRoutes');
app.use('/api/events', eventRoutes);

const taskRoutes = require('./src/routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const societyChatRoutes = require('./src/routes/societyChatRoutes');
app.use('/api/society-chat', societyChatRoutes);

const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

const applicationRoutes = require('./src/routes/applicationRoutes');
app.use('/api/applications', applicationRoutes);

const reportRoutes = require('./src/routes/reportRoutes');
app.use('/api/reports', reportRoutes);

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));