const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();
const sha = t => crypto.createHash('sha256').update(t).digest('hex');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, language } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, language });
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// step 1: request a reset link (printed in the server console in this demo)
router.post('/forgot', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase();
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      user.resetTokenHash = sha(token);
      user.resetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      console.log(`\nPASSWORD RESET LINK for ${email}:\nhttp://localhost:5173/reset/${token}\n(valid for 15 minutes)\n`);
    }
    // same answer whether or not the email exists
    res.json({ message: 'If that email is registered, a reset link has been generated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// step 2: set a new password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ resetTokenHash: sha(token), resetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;
    user.resetExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated. You can log in now.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;