const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Loan = require('../models/Loan');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reports = await Report.find().sort({ generatedAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { type, title } = req.body;

    const data = {
      users: await User.countDocuments(),
      totalDeposits: await Deposit.countDocuments({ status: 'approved' }),
      totalLoans: await Loan.countDocuments({ status: { $in: ['approved', 'active'] } })
    };

    const report = new Report({
      title: title || `Report - ${type} - ${new Date().toLocaleDateString()}`,
      type,
      generatedBy: req.user.id,
      data
    });
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
