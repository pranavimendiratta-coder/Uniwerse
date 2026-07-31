const Task = require('../models/Task');
const User = require('../models/User');

async function assertPoc(req, society) {
  if (req.user.role !== 'Student') return false;
  const student = await User.findById(req.user.id);
  return student && student.pocOf.includes(society);
}

// GET /api/tasks?society=Cultural Society
const getTasks = async (req, res) => {
  try {
    const { society } = req.query;
    if (!society) return res.status(400).json({ message: 'society query param is required' });
    const tasks = await Task.find({ society }).sort({ createdAt: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { society, eventId, text, tags, assigneeName, status } = req.body;
    if (!society || !text) return res.status(400).json({ message: 'society and text are required' });

    const isPoc = await assertPoc(req, society);
    if (!isPoc) return res.status(403).json({ message: 'Only a society POC can create tasks' });

    const task = await Task.create({ society, eventId: eventId || null, text, tags: tags || [], assigneeName: assigneeName || null, status: status || 'pending' });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/tasks/:id — used for status changes (drag) and assignee changes
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isPoc = await assertPoc(req, task.society);
    if (!isPoc) return res.status(403).json({ message: 'Only a society POC can update tasks' });

    const { text, tags, assigneeName, status } = req.body;
    if (text !== undefined) task.text = text;
    if (tags !== undefined) task.tags = tags;
    if (assigneeName !== undefined) task.assigneeName = assigneeName;
    if (status !== undefined) task.status = status;

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isPoc = await assertPoc(req, task.society);
    if (!isPoc) return res.status(403).json({ message: 'Only a society POC can delete tasks' });

    await task.deleteOne();
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };