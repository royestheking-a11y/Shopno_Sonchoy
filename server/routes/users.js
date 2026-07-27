const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const LoanRepayment = require('../models/LoanRepayment');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Helper to auto-sync loan balance
async function syncUserLoanBalance(userId) {
  const activeLoans = await Loan.find({ userId, status: { $in: ['active', 'approved'] } });
  let totalBalance = 0;
  for (let l of activeLoans) {
    const repayments = await LoanRepayment.find({ loanId: l._id, status: 'approved' });
    const totalRepaid = repayments.reduce((s, r) => s + r.amount, 0);
    const expected = l.amount + (l.amount * ((l.interestRate || 5) / 100));
    const remaining = expected - totalRepaid;
    if (remaining <= 0) {
      l.status = 'repaid';
      await l.save();
    } else {
      totalBalance += remaining;
    }
  }
  await User.findByIdAndUpdate(userId, { loanBalance: Math.max(0, totalBalance) });
  return Math.max(0, totalBalance);
}

// Get all users
router.get('/', verifyToken, async (req, res) => {
  try {
    let selectFields = '-password';
    if (req.user.role !== 'admin') {
      selectFields = '_id name role status';
    }
    const users = await User.find({}, selectFields);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get('/:id', verifyToken, async (req, res) => {
  try {
    await syncUserLoanBalance(req.params.id);
    const user = await User.findById(req.params.id, '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user balance/details
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Only allow admin or the user themselves to update
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    
    // Don't allow password updates through this route
    const updateData = { ...req.body };
    delete updateData.password;
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, select: '-password' });
    const io = req.app.get('io');
    if (io) io.emit('data_updated');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.put('/:id/password', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (req.user.id === req.params.id && req.user.role !== 'admin') {
      const valid = await user.comparePassword(currentPassword);
      if (!valid) return res.status(400).json({ message: 'Invalid current password' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
