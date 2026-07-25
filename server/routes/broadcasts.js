const express = require('express');
const router = express.Router();
const Broadcast = require('../models/Broadcast');
const { verifyToken } = require('../middleware/auth');

// Get all broadcasts (sorted newest first)
router.get('/', verifyToken, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ date: -1 }).populate('author', 'name');
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new broadcast (admin only)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const broadcast = new Broadcast({
    title: req.body.title,
    message: req.body.message,
    type: req.body.type || 'info',
    author: req.user.id,
    readBy: []
  });

  try {
    const newBroadcast = await broadcast.save();
    
    // Emit event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_broadcast', newBroadcast);
    }
    
    res.status(201).json(newBroadcast);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mark a broadcast as read for the current user
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }

    // Add user ID to readBy array if not already present
    if (!broadcast.readBy.includes(req.user.id)) {
      broadcast.readBy.push(req.user.id);
      await broadcast.save();
    }

    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a broadcast (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    await Broadcast.findByIdAndDelete(req.params.id);
    res.json({ message: 'Broadcast deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
