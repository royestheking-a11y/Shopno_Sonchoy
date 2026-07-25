const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Deposit = require('./models/Deposit');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const deposit = new Deposit({
      userId: "6a63adc43593fc6bfcb40197",
      type: "deposit",
      amount: 1000,
      method: "bKash",
      reference: "TEST1234"
    });
    const saved = await deposit.save();
    console.log("Saved!", saved);
  } catch (err) {
    console.error("Failed!", err);
  }
  process.exit(0);
}
check();
