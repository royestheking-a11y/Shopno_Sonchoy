const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Member ID and password are required' });
    }

    const input = email.toString().trim();
    const cleanPassword = password.toString();

    // Search by case-insensitive email, exact memberId, or phone
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { memberId: input },
        { phone: input }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found with provided Email or Member ID' });
    }

    const validPassword = await user.comparePassword(cleanPassword);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your password.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    
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
