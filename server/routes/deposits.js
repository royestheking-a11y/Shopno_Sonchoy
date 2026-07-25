const express = require('express');
const router = express.Router();
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Ledger = require('../models/Ledger');
const MasterWallet = require('../models/MasterWallet');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all deposits
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }
    const deposits = await Deposit.find(query).populate('userId', 'name memberId email phone').sort({ date: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new deposit
router.post('/', verifyToken, async (req, res) => {
  try {
    const deposit = new Deposit({
      userId: req.user.id,
      ...req.body
    });
    const saved = await deposit.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update deposit status (admin only)
router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit already processed' });
    }

    const { status } = req.body;
    deposit.status = status;
    deposit.approvedAt = new Date();
    deposit.approvedBy = req.user.id;
    await deposit.save();

    if (status === 'approved') {
      // Update User balance
      const user = await User.findById(deposit.userId);
      user.balance += deposit.amount;
      await user.save();

      // Update Master Wallet
      let masterWallet = await MasterWallet.findOne();
      if (!masterWallet) masterWallet = new MasterWallet();
      masterWallet.balance += deposit.amount;
      masterWallet.lastUpdated = new Date();
      masterWallet.updatedBy = req.user.id;
      await masterWallet.save();

      // Create Ledger entry
      const ledgerEntry = new Ledger({
        type: 'deposit',
        description: `Deposit by User ${user.memberId || user.name}`,
        debitAccount: 'User Wallet / External',
        debitAmount: deposit.amount,
        creditAccount: 'Master Wallet',
        creditAmount: deposit.amount,
        referenceId: deposit._id
      });
      await ledgerEntry.save();
    }

    res.json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
