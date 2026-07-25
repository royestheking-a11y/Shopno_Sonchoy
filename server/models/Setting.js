const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  globalInterestRate: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
