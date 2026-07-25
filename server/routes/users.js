const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

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
