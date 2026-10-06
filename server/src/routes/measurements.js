const express = require('express');
const Measurement = require('../models/Measurement');
const auth = require('../middleware/auth');
const { computeStatus } = require('../utils/parser');

const router = express.Router();
router.use(auth);

// ?profileId=...&testName=Hemoglobin  (oldest first, ready for charts)
router.get('/', async (req, res) => {
  const filter = { userId: req.userId };
  if (req.query.profileId) filter.profileId = req.query.profileId;
  if (req.query.testName) filter.testName = req.query.testName;
  const items = await Measurement.find(filter).sort({ date: 1 });
  res.json(items);
});

// correct a wrongly read value
router.put('/:id', async (req, res) => {
  try {
    const m = await Measurement.findOne({ _id: req.params.id, userId: req.userId });
    if (!m) return res.status(404).json({ message: 'Not found' });
    if (req.body.value != null) m.value = Number(req.body.value);
    if (req.body.unit) m.unit = req.body.unit;
    m.status = computeStatus(m.value, m.refLow, m.refHigh);
    await m.save();
    res.json(m);
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const m = await Measurement.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!m) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

module.exports = router;