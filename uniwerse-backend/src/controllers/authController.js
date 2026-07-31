const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, society: user.society },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, society } = req.body;

    if (!['Student', 'Society Head'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Student or Society Head' });
    }

    if (role === 'Society Head' && !society) {
      return res.status(400).json({ message: 'Society Head signup requires a society name' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      society: role === 'Society Head' ? society : null,
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        society: user.society,
        pocOf: user.pocOf,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        society: user.society,
        pocOf: user.pocOf,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/guest — creates (or reuses) a lightweight Guest account, no password needed
const guestLogin = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user && user.role !== 'Guest') {
      return res.status(400).json({ message: 'This email is already registered — please log in normally instead.' });
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: hashedPassword,
        role: 'Guest',
        society: null,
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        society: user.society,
        pocOf: user.pocOf,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, guestLogin };