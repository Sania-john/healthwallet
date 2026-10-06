const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: ['lab_report', 'prescription', 'other'], default: 'lab_report' },
  title: { type: String, trim: true },
  doctor: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  fileName: { type: String, required: true },
  originalName: { type: String },
  ocrText: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);