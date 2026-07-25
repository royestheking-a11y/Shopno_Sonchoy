const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'secret');
  
  const res = await axios.get('http://localhost:5000/api/deposits', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
}
test();
