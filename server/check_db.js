const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Deposit = require('./models/Deposit');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const deposits = await Deposit.find({}).lean();
  console.log("Found", deposits.length, "deposits");
  deposits.forEach(d => console.log(d));
  process.exit(0);
}
check();
