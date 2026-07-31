const User = require('../models/User');

const createUser = async (req, res) => {
  try {
    const { name, email, password, roles, society } = req.body;
    const newUser = await User.create({ name, email, password, roles, society });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/add-poc — only a Society Head can call this
const addPoc = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Student email is required' });

    const headSociety = req.user.society; // comes from the Head's own token/account

    const student = await User.findOne({ email: email.toLowerCase().trim() });
    if (!student) return res.status(404).json({ message: 'No account found with that email' });
    if (student.role !== 'Student') {
      return res.status(400).json({ message: 'Only Student accounts can be made a POC' });
    }

    if (!student.pocOf.includes(headSociety)) {
      student.pocOf.push(headSociety);
      await student.save();
    }

    res.status(200).json({ message: `${student.name} is now a POC for ${headSociety}`, pocOf: student.pocOf });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/users/remove-poc
const removePoc = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Student email is required' });

    const headSociety = req.user.society;

    const student = await User.findOne({ email: email.toLowerCase().trim() });
    if (!student) return res.status(404).json({ message: 'No account found with that email' });

    student.pocOf = student.pocOf.filter((s) => s !== headSociety);
    await student.save();

    res.status(200).json({ message: `${student.name} removed as POC for ${headSociety}`, pocOf: student.pocOf });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/users/pocs?society=Cultural Society — list all students who are POC for this society
const getSocietyPocs = async (req, res) => {
  try {
    const { society } = req.query;
    if (!society) return res.status(400).json({ message: 'society query param is required' });

    const pocs = await User.find({ role: 'Student', pocOf: society }).select('name email');
    res.status(200).json(pocs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUser, getUsers, addPoc, removePoc, getSocietyPocs };
