const mongoose = require('mongoose');

const masterWalletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('MasterWallet', masterWalletSchema);
