const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  challenge: { type: String, required: true },
  createdAt: { type: Date, expires: '5m', default: Date.now } // Auto-delete after 5 minutes
});

module.exports = mongoose.model('Challenge', challengeSchema);
