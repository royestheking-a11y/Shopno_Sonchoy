const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
const User = require('./models/User');
const Deposit = require('./models/Deposit');
const Loan = require('./models/Loan');
const LoanRepayment = require('./models/LoanRepayment');
const Transaction = require('./models/Transaction');
const Ledger = require('./models/Ledger');

async function clear() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ name: "MD MAFUJ AHMMAD" });
  if (!user) {
    console.log("User not found!");
    process.exit(1);
  }
  console.log("Found user:", user.name, user._id);
  
  await Deposit.deleteMany({ userId: user._id });
  await Loan.deleteMany({ userId: user._id });
  await LoanRepayment.deleteMany({ userId: user._id });
  await Transaction.deleteMany({ userId: user._id });
  
  // Reset user balances
  user.balance = 0;
  user.loanBalance = 0;
  user.monthlySavings = 0;
  await user.save();
  
  console.log("Cleared transactions and reset balances for", user.name);
  process.exit(0);
}
clear();
