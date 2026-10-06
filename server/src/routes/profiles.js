const express = require('express');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// list my profiles
router.get('/', async (req, res) => {
  const profiles = await Profile.find({ userId: req.userId }).sort({ createdAt: 1 });
  res.json(profiles);
});

// create
router.post('/', async (req, res) => {
  try {
    const { name, relation, dob, gender } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const profile = await Profile.create({ userId: req.userId, name, relation, dob, gender });
    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update
router.put('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

module.exports = router;