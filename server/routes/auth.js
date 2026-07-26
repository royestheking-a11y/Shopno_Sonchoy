const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await user.comparePassword(password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Return user info excluding password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { 
      memberId, name, email, password, role, 
      phone, alternatePhone, address, nidNumber, nomineeName, nomineePhone 
    } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = new User({ 
      memberId, name, email, password, role,
      phone, alternatePhone, address, nidNumber, nomineeName, nomineePhone
    });
    await user.save();

    // Send Welcome Email
    try {
      const { sendEmail } = require('../utils/emailHelper');
      await sendEmail(process.env.EMAILJS_TEMPLATE_WELCOME || process.env.EMAILJS_TEMPLATE_DEPOSIT, {
        to_email: user.email,
        email: user.email,
        name: user.name,
        message: 'Welcome to Shopno Sonchoy! Your account has been successfully created.'
      });
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr.response?.data || emailErr.message);
    }

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
