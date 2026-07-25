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

module.exports = router;
