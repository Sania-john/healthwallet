const express = require('express');
const path = require('path');
const fs = require('fs');
const Record = require('../models/Record');
const Profile = require('../models/Profile');
const Measurement = require('../models/Measurement');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { extractText } = require('../services/ocr');
const { parseMeasurements } = require('../utils/parser');

const router = express.Router();
router.use(auth);

const uploadsDir = path.join(__dirname, '../../uploads');

// upload a record
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const { profileId, type, title, doctor, date } = req.body;

    const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
    if (!profile) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Profile not found' });
    }

    const record = await Record.create({
      userId: req.userId, profileId, type, title, doctor,
      date: date || undefined,
      fileName: req.file.filename,
      originalName: req.file.originalname
    });
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// extract text + measurements from a record
router.post('/:id/extract', async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, userId: req.userId });
    if (!record) return res.status(404).json({ message: 'Record not found' });

    const text = await extractText(path.join(uploadsDir, record.fileName));
    record.ocrText = text;
    await record.save();

    const parsed = parseMeasurements(text);
    await Measurement.deleteMany({ recordId: record._id });
    const measurements = await Measurement.insertMany(
      parsed.map(m => ({
        ...m,
        userId: req.userId,
        profileId: record.profileId,
        recordId: record._id,
        date: record.date
      }))
    );

    res.json({ textLength: text.length, measurements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not read this file' });
  }
});

// list records (optionally ?profileId=...)
router.get('/', async (req, res) => {
  const filter = { userId: req.userId };
  if (req.query.profileId) filter.profileId = req.query.profileId;
  const records = await Record.find(filter).sort({ date: -1 });
  res.json(records);
});

// view the file (protected)
router.get('/:id/file', async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, userId: req.userId });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.sendFile(path.join(uploadsDir, record.fileName));
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

// delete record, its file and its measurements
router.delete('/:id', async (req, res) => {
  try {
    const record = await Record.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    await Measurement.deleteMany({ recordId: record._id });
    fs.unlink(path.join(uploadsDir, record.fileName), () => {});
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

module.exports = router;