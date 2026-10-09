const express = require('express');
const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const Profile = require('../models/Profile');
const Measurement = require('../models/Measurement');
const DoctorNote = require('../models/DoctorNote');
const auth = require('../middleware/auth');
const { buildSummary } = require('../utils/summary');

const router = express.Router();

const activeLink = token =>
  ShareLink.findOne({ token, expiresAt: { $gt: new Date() } });

// PUBLIC: doctor opens the link (no login)
router.get('/public/:token', async (req, res) => {
  try {
    const link = await activeLink(req.params.token);
    if (!link) return res.status(404).json({ message: 'This link is invalid or has expired' });

    const profile = await Profile.findById(link.profileId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    link.viewCount += 1;
    link.lastViewedAt = new Date();
    await link.save();

    const items = await Measurement.find({ profileId: link.profileId }).sort({ date: 1 });
    const notes = await DoctorNote.find({ profileId: link.profileId }).sort({ createdAt: -1 });
    res.json({
      profile: { name: profile.name, relation: profile.relation },
      expiresAt: link.expiresAt,
      measurements: items.map(m => ({
        _id: m._id, testName: m.testName, value: m.value, unit: m.unit,
        refLow: m.refLow, refHigh: m.refHigh, status: m.status, date: m.date
      })),
      notes,
      summary: buildSummary(items, req.query.lang)
    });
  } catch (err) {
    res.status(404).json({ message: 'This link is invalid or has expired' });
  }
});

// PUBLIC: doctor leaves a note / follow-up date
router.post('/public/:token/notes', async (req, res) => {
  try {
    const link = await activeLink(req.params.token);
    if (!link) return res.status(404).json({ message: 'This link is invalid or has expired' });

    const note = (req.body.note || '').trim();
    if (!note) return res.status(400).json({ message: 'Please write a note' });

    const created = await DoctorNote.create({
      userId: link.userId,
      profileId: link.profileId,
      doctorName: (req.body.doctorName || '').trim() || 'Doctor',
      note: note.slice(0, 1000),
      followUpDate: req.body.followUpDate || undefined
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: 'Could not save the note' });
  }
});

// Everything below needs login
router.use(auth);

router.post('/', async (req, res) => {
  try {
    const { profileId } = req.body;
    const hours = Math.min(Math.max(Number(req.body.hours) || 24, 1), 168);

    const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const link = await ShareLink.create({
      userId: req.userId,
      profileId,
      token: crypto.randomBytes(24).toString('hex'),
      expiresAt: new Date(Date.now() + hours * 3600 * 1000)
    });
    res.status(201).json({ token: link.token, expiresAt: link.expiresAt });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid request' });
  }
});

// patient: doctor notes for a profile
router.get('/notes', async (req, res) => {
  const notes = await DoctorNote.find({
    userId: req.userId, profileId: req.query.profileId
  }).sort({ createdAt: -1 });
  res.json(notes);
});

router.get('/', async (req, res) => {
  const links = await ShareLink.find({
    userId: req.userId, profileId: req.query.profileId, expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
  res.json(links);
});

router.delete('/:id', async (req, res) => {
  try {
    const link = await ShareLink.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!link) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Revoked' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

module.exports = router;