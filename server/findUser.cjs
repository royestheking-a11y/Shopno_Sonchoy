const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
const User = require('./models/User');

async function find() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}, 'name email role');
  console.log(users);
  process.exit(0);
}
find();
