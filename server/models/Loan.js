const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, default: 5 },
  status: { type: String, enum: ['pending', 'approved', 'active', 'repaid', 'rejected'], default: 'pending' },
  purpose: { type: String },
  method: { type: String }, // e.g. bKash, Bank Transfer
  requestDate: { type: Date, default: Date.now },
  approvalDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
