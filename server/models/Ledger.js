const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, required: true }, // 'deposit', 'loan_disbursement', 'loan_repayment', 'fee', etc.
  description: { type: String, required: true },
  debitAccount: { type: String }, // e.g., 'Master Wallet'
  debitAmount: { type: Number, default: 0 },
  creditAccount: { type: String }, // e.g., 'User Wallet'
  creditAmount: { type: Number, default: 0 },
  referenceId: { type: mongoose.Schema.Types.ObjectId } // depositId, loanId, etc.
});

module.exports = mongoose.model('Ledger', ledgerSchema);
