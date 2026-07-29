const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const LoanRepayment = require('../models/LoanRepayment');
const User = require('../models/User');
const MasterWallet = require('../models/MasterWallet');
const Ledger = require('../models/Ledger');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailHelper');

/**
 * Profit-First Repayment Allocator
 * -----------------------------------
 * Given a loan and the total amount already repaid, calculates how much
 * of a new payment goes to PROFIT (interest) first, then PRINCIPAL.
 *
 * Example:
 *   Loan = 10,000 BDT @ 5% → Total owed = 10,500 BDT
 *   Interest portion = 500 BDT (must be cleared FIRST)
 *   If user pays 3,000 BDT:
 *     → 500 BDT clears the profit
 *     → 2,500 BDT reduces principal
 *
 * @param {Object} loan        - Loan document (amount, interestRate)
 * @param {number} totalRepaid - Sum of all previously approved repayments for this loan
 * @param {number} payment     - Current payment being applied
 * @returns {{ profitPaid: number, principalPaid: number }}
 */
function calcProfitFirst(loan, totalRepaid, payment) {
  const principal = loan.amount;
  const interestRate = loan.interestRate || 5;
  const totalInterest = principal * (interestRate / 100);

  // How much interest has already been covered by prior payments?
  const interestAlreadyCovered = Math.min(totalRepaid, totalInterest);
  const remainingInterest = Math.max(0, totalInterest - interestAlreadyCovered);

  // Apply payment: profit first
  const profitPaid = Math.min(payment, remainingInterest);
  const principalPaid = payment - profitPaid;

  return { profitPaid, principalPaid };
}

// Get system profit stats
router.get('/system-profit', verifyToken, async (req, res) => {
  try {
    const loans = await Loan.find({ status: { $in: ['active', 'approved', 'repaid'] } });
    let totalProfit = 0;

    // Sum profit from all loans based on profit-first calculation
    for (let loan of loans) {
      const repayments = await LoanRepayment.find({ loanId: loan._id, status: 'approved' });
      const totalRepaid = repayments.reduce((s, r) => s + r.amount, 0);
      
      const { profitPaid } = calcProfitFirst(loan, 0, totalRepaid);
      totalProfit += profitPaid;
    }

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
      const activeInterestRate = loan.interestRate !== undefined ? loan.interestRate : 5;
      const loanWithInterest = loan.amount + (loan.amount * (activeInterestRate / 100));
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

        // Profit-first allocation
        const prevRepayments = await LoanRepayment.find({ loanId: loan._id, status: 'approved' });
        const totalPrevRepaid = prevRepayments.reduce((s, r) => s + r.amount, 0);
        const { profitPaid, principalPaid } = calcProfitFirst(loan, totalPrevRepaid, amount);

        user.balance -= amount;
        user.loanBalance = Math.max(0, user.loanBalance - amount);
        await user.save();

        repayment.approvedAt = new Date();
        
        let masterWallet = await MasterWallet.findOne();
        if (!masterWallet) masterWallet = new MasterWallet();
        masterWallet.balance += amount;
        masterWallet.lastUpdated = new Date();
        await masterWallet.save();

        // Ledger Entry — split into profit and principal for clarity
        if (profitPaid > 0) {
          await new Ledger({
            type: 'loan_interest_received',
            description: `Interest/profit received from ${user.memberId || user.name} via Wallet (৳${profitPaid} of ৳${amount} payment)`,
            debitAccount: 'User Wallet',
            debitAmount: profitPaid,
            creditAccount: 'Master Wallet (Profit)',
            creditAmount: profitPaid,
            referenceId: repayment._id
          }).save();
        }
        if (principalPaid > 0) {
          await new Ledger({
            type: 'loan_repayment',
            description: `Principal repayment from ${user.memberId || user.name} via Wallet (৳${principalPaid} of ৳${amount} payment)`,
            debitAccount: 'User Wallet',
            debitAmount: principalPaid,
            creditAccount: 'Master Wallet (Principal)',
            creditAmount: principalPaid,
            referenceId: repayment._id
          }).save();
        }
    }
    
    await repayment.save();
    
    // Check if fully repaid
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
            const loan = await Loan.findById(repayment.loanId);

            // --- Profit-first repayment allocation ---
            // Fetch all PREVIOUSLY approved repayments (excluding the current one being approved)
            const prevRepayments = await LoanRepayment.find({
              loanId: loan._id,
              status: 'approved',
              _id: { $ne: repayment._id }
            });
            const totalPrevRepaid = prevRepayments.reduce((s, r) => s + r.amount, 0);
            const { profitPaid, principalPaid } = calcProfitFirst(loan, totalPrevRepaid, repayment.amount);
            console.log(`[Profit-First] Loan ${loan._id}: payment=৳${repayment.amount}, profitPaid=৳${profitPaid}, principalPaid=৳${principalPaid}`);

            // Update user loan balance
            user.loanBalance = Math.max(0, user.loanBalance - repayment.amount);
            await user.save();

            // Update master wallet
            let masterWallet = await MasterWallet.findOne();
            if (!masterWallet) masterWallet = new MasterWallet();
            masterWallet.balance += repayment.amount;
            masterWallet.lastUpdated = new Date();
            masterWallet.updatedBy = req.user.id;
            await masterWallet.save();

            // Split ledger entries: profit portion + principal portion
            if (profitPaid > 0) {
              await new Ledger({
                type: 'loan_interest_received',
                description: `Interest/profit received from ${user.memberId || user.name} via ${repayment.method} (৳${profitPaid} of ৳${repayment.amount})`,
                debitAccount: 'External / Bank',
                debitAmount: profitPaid,
                creditAccount: 'Master Wallet (Profit)',
                creditAmount: profitPaid,
                referenceId: repayment._id
              }).save();
            }
            if (principalPaid > 0) {
              await new Ledger({
                type: 'loan_repayment',
                description: `Principal repayment from ${user.memberId || user.name} via ${repayment.method} (৳${principalPaid} of ৳${repayment.amount})`,
                debitAccount: 'External / Bank',
                debitAmount: principalPaid,
                creditAccount: 'Master Wallet (Principal)',
                creditAmount: principalPaid,
                referenceId: repayment._id
              }).save();
            }

            await repayment.save();

            // Check if fully repaid
            const allRepayments = await LoanRepayment.find({ loanId: loan._id, status: 'approved' });
            const totalRepaid = allRepayments.reduce((sum, r) => sum + r.amount, 0);
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
