const express = require('express');
const router = express.Router();
const Ledger = require('../models/Ledger');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const ledgers = await Ledger.find().sort({ date: -1 });
    res.json(ledgers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
