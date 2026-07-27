const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get settings
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
      await setting.save();
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }
    
    if (req.body.globalInterestRate !== undefined) {
        setting.globalInterestRate = req.body.globalInterestRate;
    }

    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Deposit = require('../models/Deposit');
const Loan = require('../models/Loan');
const LoanRepayment = require('../models/LoanRepayment');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const MonthlyClosing = require('../models/MonthlyClosing');
const MasterWallet = require('../models/MasterWallet');
const User = require('../models/User');

// Reset all transaction data
router.post('/reset-transactions', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Deposit.deleteMany({});
    await Loan.deleteMany({});
    await LoanRepayment.deleteMany({});
    await Transaction.deleteMany({});
    await Ledger.deleteMany({});
    await MonthlyClosing.deleteMany({});

    await MasterWallet.deleteMany({});
    await MasterWallet.create({
      balance: 0,
      totalDeposits: 0,
      totalLoans: 0,
      totalWithdrawn: 0,
      withdrawals: []
    });

    const Report = require('../models/Report');
    await Report.deleteMany({});

    await User.updateMany(
      {},
      {
        $set: {
          balance: 0,
          loanBalance: 0,
          advanceMonths: 0
        }
      }
    );

    const io = req.app.get('io');
    if (io) io.emit('ticker_update', { type: 'reset_transactions', timestamp: Date.now() });

    res.json({ message: 'All transaction history successfully reset.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
