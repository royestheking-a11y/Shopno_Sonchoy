const mongoose = require('mongoose');
require('dotenv').config();
const Deposit = require('./models/Deposit');
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const deposits = await Deposit.find({});
  console.log(deposits);
  process.exit(0);
}
check();
