const express = require('express');
const router = express.Router();
const MonthlyClosing = require('../models/MonthlyClosing');
const User = require('../models/User');
const MasterWallet = require('../models/MasterWallet');
const Ledger = require('../models/Ledger');
const Setting = require('../models/Setting');
const Deposit = require('../models/Deposit');
const Loan = require('../models/Loan');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const closings = await MonthlyClosing.find().sort({ executedAt: -1 });
    res.json(closings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Check if already closed
    const existing = await MonthlyClosing.findOne({ month, year });
    if (existing) return res.status(400).json({ message: 'Month already closed' });

    const settings = await Setting.findOne() || { globalInterestRate: 5 };
    
    // Calculate aggregate totals for the month
    const deposits = await Deposit.find({ status: 'approved' }); // ideally filtered by month
    const loans = await Loan.find({ status: { $in: ['approved', 'active'] } });
    
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);

    // Run penalties or interests (Example simplified execution)
    const users = await User.find({ role: 'member' });
    let totalProfit = 0;

    for (let user of users) {
      if (user.loanBalance > 0) {
        // Accrue monthly interest on outstanding loan
        const monthlyInterest = (user.loanBalance * (settings.globalInterestRate / 100)) / 12;
        user.loanBalance += monthlyInterest;
        totalProfit += monthlyInterest;
        await user.save();
      }
    }

    const closing = new MonthlyClosing({
      month,
      year,
      totalDeposits,
      totalLoans,
      profit: totalProfit,
      executedBy: req.user.id
    });
    await closing.save();

    res.json(closing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
