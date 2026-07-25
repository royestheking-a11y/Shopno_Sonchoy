const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get transactions (Admin gets all, user gets their own)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }
    const transactions = await Transaction.find(query).populate('userId', 'name email memberId').sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new transaction
router.post('/', verifyToken, async (req, res) => {
  try {
    const { amount, method, type, reference } = req.body;
    const transaction = new Transaction({
      userId: req.user.id,
      amount,
      method,
      type,
      reference,
      status: 'pending' // Admin needs to approve
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update transaction status (Admin only)
router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'pending') return res.status(400).json({ message: 'Transaction already processed' });

    transaction.status = status;
    await transaction.save();

    // If approved, update user balance and master wallet
    if (status === 'approved') {
      const user = await User.findById(transaction.userId);
      if (transaction.type === 'deposit') {
        user.balance += transaction.amount;
        await user.save();

        const MasterWallet = require('../models/MasterWallet');
        let wallet = await MasterWallet.findOne();
        if (!wallet) {
          wallet = new MasterWallet();
        }
        wallet.balance += transaction.amount;
        await wallet.save();
      } else if (transaction.type === 'withdraw') {
        user.balance -= transaction.amount;
        await user.save();
        
        const MasterWallet = require('../models/MasterWallet');
        let wallet = await MasterWallet.findOne();
        if (wallet) {
          wallet.balance -= transaction.amount;
          await wallet.save();
        }

        const Ledger = require('../models/Ledger');
        const ledgerEntry = new Ledger({
          type: 'withdraw',
          description: `Withdrawal by User ${user.memberId || user.name}`,
          debitAccount: 'Master Wallet',
          debitAmount: transaction.amount,
          creditAccount: 'User Wallet / External',
          creditAmount: transaction.amount,
          referenceId: transaction._id
        });
        await ledgerEntry.save();
      }
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
