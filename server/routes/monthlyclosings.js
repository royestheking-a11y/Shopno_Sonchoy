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
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Calculate aggregate totals for the month
    const deposits = await Deposit.find({ 
      status: 'approved',
      date: { $gte: startDate, $lte: endDate }
    });
    
    const loans = await Loan.find({ status: { $in: ['approved', 'active'] } });
    
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);

    const users = await User.find({ role: 'member' });
    let totalProfit = 0;
    let penaltyProfit = 0;
    let penaltiesApplied = 0;
    let advancePaymentsProcessed = 0;
    
    let masterWallet = await MasterWallet.findOne();
    if (!masterWallet) masterWallet = new MasterWallet();

    for (let user of users) {
      // 1. Advance Payments & Penalties
      const userDeposits = deposits.filter(d => d.userId.toString() === user._id.toString());
      const totalDepositedThisMonth = userDeposits.reduce((sum, d) => sum + d.amount, 0);
      const EXPECTED_DEPOSIT = 1000;
      
      if (totalDepositedThisMonth >= EXPECTED_DEPOSIT) {
        const monthsPaid = Math.floor(totalDepositedThisMonth / EXPECTED_DEPOSIT);
        if (monthsPaid > 1) {
          user.advanceMonths = (user.advanceMonths || 0) + (monthsPaid - 1);
          advancePaymentsProcessed++;
        }
      } else {
        if (user.advanceMonths && user.advanceMonths > 0) {
          user.advanceMonths -= 1;
          advancePaymentsProcessed++;
        } else {
          // Apply 5% Penalty
          const penaltyAmount = EXPECTED_DEPOSIT * 0.05;
          user.balance -= penaltyAmount;
          penaltyProfit += penaltyAmount;
          penaltiesApplied++;
          
          masterWallet.balance += penaltyAmount;

          const ledgerEntry = new Ledger({
            type: 'penalty',
            description: `Monthly missing deposit penalty for User ${user.memberId || user.name}`,
            debitAccount: 'User Wallet',
            debitAmount: penaltyAmount,
            creditAccount: 'Master Wallet',
            creditAmount: penaltyAmount,
            referenceId: user._id
          });
          await ledgerEntry.save();
        }
      }

      // 2. Accrue monthly interest on outstanding loan
      if (user.loanBalance > 0) {
        const monthlyInterest = (user.loanBalance * (settings.globalInterestRate / 100)) / 12;
        user.loanBalance += monthlyInterest;
        totalProfit += monthlyInterest;
      }
      
      await user.save();
    }
    
    totalProfit += penaltyProfit;
    masterWallet.lastUpdated = new Date();
    masterWallet.updatedBy = req.user.id;
    await masterWallet.save();

    const closing = new MonthlyClosing({
      month,
      year,
      totalDeposits,
      totalLoans,
      profit: totalProfit,
      executedBy: req.user.id
    });
    await closing.save();

    res.json({
      ...closing.toObject(),
      penaltiesApplied,
      advancePaymentsProcessed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
