const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  viewCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date }
}, { timestamps: true });

shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ShareLink', shareSchema);