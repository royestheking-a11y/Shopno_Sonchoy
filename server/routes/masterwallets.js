const express = require('express');
const router = express.Router();
const MasterWallet = require('../models/MasterWallet');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let wallet = await MasterWallet.findOne();
    if (!wallet) {
      wallet = new MasterWallet();
      await wallet.save();
    }
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
