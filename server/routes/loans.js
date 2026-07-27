const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const LoanRepayment = require('../models/LoanRepayment');
const User = require('../models/User');
const MasterWallet = require('../models/MasterWallet');
const Ledger = require('../models/Ledger');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailHelper');

// Get system profit stats
router.get('/system-profit', verifyToken, async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'repaid' });
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
    const existingPending = await Loan.findOne({ userId: req.user.id, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending loan request. Please wait for it to be processed.' });
    }

    if (!req.body.amount || req.body.amount < 500) {
      return res.status(400).json({ error: 'Minimum loan amount is 500' });
    }

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
        const loanAmountStr = loan.amount.toLocaleString();
        const interestRateStr = `${loan.interestRate || 5}%`;
        const loanIdStr = loan._id.toString().slice(-5).toUpperCase();
        const currentDateStr = new Date().toLocaleDateString();
        const loanBalanceStr = (user.loanBalance || 0).toLocaleString();
        const walletBalanceStr = (user.balance || 0).toLocaleString();

        await sendEmail(process.env.EMAILJS_TEMPLATE_LOAN, {
          to_email: user.email,
          email: user.email,
          user_email: user.email,
          to_name: user.name,
          name: user.name,
          user_name: user.name,

          amount: loanAmountStr,
          loan_amount: loanAmountStr,
          loanAmount: loanAmountStr,

          interestRate: interestRateStr,
          interest_rate: interestRateStr,
          interestrate: interestRateStr,
          interest: interestRateStr,

          loanId: loanIdStr,
          loan_id: loanIdStr,
          loanid: loanIdStr,
          transaction_id: loanIdStr,
          trx_id: loanIdStr,
          trxId: loanIdStr,
          trxid: loanIdStr,
          id: loanIdStr,

          date: currentDateStr,
          approval_date: currentDateStr,
          approvalDate: currentDateStr,

          loanBalance: loanBalanceStr,
          loan_balance: loanBalanceStr,
          loanbalance: loanBalanceStr,
          updated_loan_balance: loanBalanceStr,

          newBalance: walletBalanceStr,
          new_balance: walletBalanceStr,
          newbalance: walletBalanceStr,
          updatedBalance: walletBalanceStr,
          updated_balance: walletBalanceStr,
          balance: walletBalanceStr
        });
        console.log(`Loan approval email sent to ${user.email}`);
      } catch (emailErr) {
        console.error('Failed to send loan approval email:', emailErr.response?.data || emailErr.message);
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

    const existingPending = await LoanRepayment.findOne({ userId: loan.userId, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending loan repayment request. Please wait for admin approval before submitting another.' });
    }
    
    const { amount, method, reference } = req.body;
    
    const repayment = new LoanRepayment({
      loanId: loan._id,
      userId: loan.userId,
      amount,
      method,
      reference,
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

// Get loan repayments (admin or member's own)
router.get('/repayments', verifyToken, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user.id;
        }
        const repayments = await LoanRepayment.find(query).populate('userId', 'name memberId email phone').sort({ date: -1 });
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

            await repayment.save();

            const loan = await Loan.findById(repayment.loanId);
            const repayments = await LoanRepayment.find({ loanId: loan._id, status: 'approved' });
            const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
            const expectedRepayment = loan.amount + (loan.amount * ((loan.interestRate || 5) / 100));
            if (totalRepaid >= expectedRepayment) {
                loan.status = 'repaid';
                await loan.save();
            }

            // Send Email Notification
            try {
              const repayAmountStr = repayment.amount.toLocaleString();
              const remainingLoanStr = Math.max(0, user.loanBalance).toLocaleString();
              const currentDateStr = new Date().toLocaleDateString();
              const trxRefStr = repayment.reference || repayment.method || repayment._id.toString();

              await sendEmail(process.env.EMAILJS_TEMPLATE_LOAN || process.env.EMAILJS_TEMPLATE_DEPOSIT, {
                to_email: user.email,
                email: user.email,
                user_email: user.email,
                to_name: user.name,
                name: user.name,
                user_name: user.name,

                amount: repayAmountStr,
                repayment_amount: repayAmountStr,
                repaymentAmount: repayAmountStr,

                method: repayment.method || 'bKash',
                payment_method: repayment.method || 'bKash',
                paymentMethod: repayment.method || 'bKash',

                transactionId: trxRefStr,
                transaction_id: trxRefStr,
                trx_id: trxRefStr,
                trxId: trxRefStr,
                reference: trxRefStr,
                id: repayment._id.toString(),

                date: currentDateStr,
                approval_date: currentDateStr,
                approvalDate: currentDateStr,

                loanBalance: remainingLoanStr,
                loan_balance: remainingLoanStr,
                updated_loan_balance: remainingLoanStr,
                newBalance: remainingLoanStr,
                new_balance: remainingLoanStr,
                updatedBalance: remainingLoanStr,
                updated_balance: remainingLoanStr,
                balance: remainingLoanStr
              });
              console.log(`Loan repayment approval email sent to ${user.email}`);
            } catch (emailErr) {
              console.error('Failed to send loan repayment approval email:', emailErr.message);
            }
        } else {
            await repayment.save();
        }
        const io = req.app.get('io');
        if (io) io.emit('data_updated');
        res.json(repayment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
