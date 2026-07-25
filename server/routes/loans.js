const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const LoanRepayment = require('../models/LoanRepayment');
const User = require('../models/User');
const MasterWallet = require('../models/MasterWallet');
const Ledger = require('../models/Ledger');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const emailjs = require('@emailjs/nodejs');

// Get system profit stats
router.get('/system-profit', verifyToken, async (req, res) => {
  try {
    const loans = await Loan.find({ status: { $in: ['approved', 'active', 'repaid'] } });
    const totalProfit = loans.reduce((sum, l) => sum + (l.amount * ((l.interestRate || 5) / 100)), 0);
    const activeMembers = await User.countDocuments({ role: 'member', status: 'active' }) || await User.countDocuments({ role: 'member' });
    res.json({ totalProfit, activeMembers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all loans
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }
    const loans = await Loan.find(query).populate('userId', 'name memberId email phone').sort({ requestDate: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request new loan
router.post('/', verifyToken, async (req, res) => {
  try {
    const loan = new Loan({
      userId: req.user.id,
      ...req.body
    });
    const saved = await loan.save();
    const io = req.app.get('io');
    if (io) io.emit('data_updated');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve/Reject loan (admin only)
router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan already processed' });
    }

    const { status, interestRate } = req.body;
    loan.status = status;
    if (interestRate) loan.interestRate = interestRate;
    
    if (status === 'approved') {
      loan.approvalDate = new Date();
      
      const user = await User.findById(loan.userId);
      const loanWithInterest = loan.amount + (loan.amount * (loan.interestRate / 100));
      user.loanBalance += loanWithInterest;
      // We assume loan is transferred outside or to wallet. Usually outside (bKash/Bank). 
      // User requested withdrawal as a loan.
      await user.save();

      // Deduct from Master Wallet
      let masterWallet = await MasterWallet.findOne();
      if (!masterWallet) masterWallet = new MasterWallet();
      masterWallet.balance -= loan.amount;
      masterWallet.lastUpdated = new Date();
      masterWallet.updatedBy = req.user.id;
      await masterWallet.save();

      // Ledger Entry
      const ledgerEntry = new Ledger({
        type: 'loan_disbursement',
        description: `Loan disbursed to User ${user.memberId || user.name}`,
        debitAccount: 'Master Wallet',
        debitAmount: loan.amount,
        creditAccount: 'User Loan Account / External',
        creditAmount: loan.amount,
        referenceId: loan._id
      });
      await ledgerEntry.save();

      // Send Email Notification
      try {
        await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_LOAN,
          {
            email: user.email,
            name: user.name,
            amount: loan.amount.toLocaleString(),
            interestRate: `${loan.interestRate || 5}%`,
            loanId: loan._id.toString(),
            date: new Date().toLocaleDateString()
          },
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY || undefined
          }
        );
        console.log(`Loan approval email sent to ${user.email}`);
      } catch (emailErr) {
        console.error('Failed to send loan approval email:', emailErr);
      }
    }
    
    await loan.save();
    const io = req.app.get('io');
    if (io) io.emit('data_updated');
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Repay loan
router.post('/:id/repay', verifyToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    const { amount, method } = req.body;
    
    const repayment = new LoanRepayment({
      loanId: loan._id,
      userId: loan.userId,
      amount,
      method,
      status: method === 'Wallet Balance' ? 'approved' : 'pending'
    });

    if (method === 'Wallet Balance') {
        const user = await User.findById(loan.userId);
        if (user.balance < amount) return res.status(400).json({ message: 'Insufficient wallet balance' });
        user.balance -= amount;
        user.loanBalance -= amount;
        await user.save();

        repayment.approvedAt = new Date();
        
        let masterWallet = await MasterWallet.findOne();
        if (!masterWallet) masterWallet = new MasterWallet();
        masterWallet.balance += amount;
        masterWallet.lastUpdated = new Date();
        await masterWallet.save();

        // Ledger Entry
        const ledgerEntry = new Ledger({
          type: 'loan_repayment',
          description: `Loan repayment from User ${user.memberId || user.name} via Wallet`,
          debitAccount: 'User Wallet',
          debitAmount: amount,
          creditAccount: 'Master Wallet',
          creditAmount: amount,
          referenceId: repayment._id
        });
        await ledgerEntry.save();
    }
    
    await repayment.save();
    
    // Check if fully repaid (we could compute this dynamically but let's do it if it's approved)
    if (repayment.status === 'approved') {
        const repayments = await LoanRepayment.find({ loanId: loan._id, status: 'approved' });
        const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
        const expectedRepayment = loan.amount + (loan.amount * (loan.interestRate / 100));
        
        if (totalRepaid >= expectedRepayment) {
          loan.status = 'repaid';
          await loan.save();
        }
    }

    const io = req.app.get('io');
    if (io) io.emit('data_updated');
    res.json(repayment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get loan repayments (admin)
router.get('/repayments', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const repayments = await LoanRepayment.find().populate('userId', 'name memberId email phone').sort({ date: -1 });
        res.json(repayments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve/Reject loan repayment (admin)
router.put('/repayments/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const repayment = await LoanRepayment.findById(req.params.id);
        if (!repayment) return res.status(404).json({ message: 'Repayment not found' });
        if (repayment.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

        const { status } = req.body;
        repayment.status = status;
        
        if (status === 'approved') {
            repayment.approvedAt = new Date();
            repayment.approvedBy = req.user.id;
            
            const user = await User.findById(repayment.userId);
            user.loanBalance -= repayment.amount;
            await user.save();

            let masterWallet = await MasterWallet.findOne();
            if (!masterWallet) masterWallet = new MasterWallet();
            masterWallet.balance += repayment.amount;
            masterWallet.lastUpdated = new Date();
            masterWallet.updatedBy = req.user.id;
            await masterWallet.save();

            const ledgerEntry = new Ledger({
              type: 'loan_repayment',
              description: `Loan repayment from User ${user.memberId || user.name} via ${repayment.method}`,
              debitAccount: 'External / Bank',
              debitAmount: repayment.amount,
              creditAccount: 'Master Wallet',
              creditAmount: repayment.amount,
              referenceId: repayment._id
            });
            await ledgerEntry.save();

            const loan = await Loan.findById(repayment.loanId);
            const repayments = await LoanRepayment.find({ loanId: loan._id, status: 'approved' });
            const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
            const expectedRepayment = loan.amount + (loan.amount * (loan.interestRate / 100));
            if (totalRepaid >= expectedRepayment) {
                loan.status = 'repaid';
                await loan.save();
            }
        }
        await repayment.save();
        const io = req.app.get('io');
        if (io) io.emit('data_updated');
        res.json(repayment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
