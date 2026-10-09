const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  doctorName: { type: String, trim: true, maxlength: 80, default: 'Doctor' },
  note: { type: String, required: true, trim: true, maxlength: 1000 },
  followUpDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DoctorNote', noteSchema);