const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
  testName: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String },
  refLow: { type: Number },
  refHigh: { type: Number },
  status: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Measurement', measurementSchema);