const express = require('express');
const router = express.Router();
const MasterWallet = require('../models/MasterWallet');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let wallet = await MasterWallet.findOne();
    if (!wallet) {
      wallet = new MasterWallet();
      await wallet.save();
    }
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/withdraw', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    let wallet = await MasterWallet.findOne();
    if (!wallet) {
      wallet = new MasterWallet();
    }
    wallet.balance -= Number(amount);
    await wallet.save();
    
    // Create an admin withdrawal transaction
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      userId: req.user.id,
      amount,
      method: 'Admin Expense',
      type: 'admin_withdrawal',
      reference: reason,
      status: 'approved'
    });
    const savedTxn = await transaction.save();

    // Create Ledger entry
    const Ledger = require('../models/Ledger');
    const ledgerEntry = new Ledger({
      type: 'expense',
      description: `Admin Expense: ${reason}`,
      debitAccount: 'Expense Account',
      debitAmount: amount,
      creditAccount: 'Master Wallet',
      creditAmount: amount,
      referenceId: savedTxn._id
    });
    await ledgerEntry.save();

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
