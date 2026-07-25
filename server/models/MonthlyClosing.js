const mongoose = require('mongoose');

const monthlyClosingSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  totalDeposits: { type: Number, default: 0 },
  totalLoans: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  executedAt: { type: Date, default: Date.now },
  executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('MonthlyClosing', monthlyClosingSchema);
