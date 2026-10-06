const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  relation: { type: String, default: 'self' },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);