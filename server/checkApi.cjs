const express = require('express');
const mongoose = require('mongoose');
require('./models/User'); // Register User schema
const Deposit = require('./models/Deposit');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const deposits = await Deposit.find().populate('userId', 'name').sort({ date: -1 });
  console.log(JSON.stringify(deposits, null, 2));
  process.exit(0);
}
check();
