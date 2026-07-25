const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Deposit = require('./models/Deposit');
const Loan = require('./models/Loan');
const LoanRepayment = require('./models/LoanRepayment');
const Transaction = require('./models/Transaction');

async function clearUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne({ name: 'MD MAFUJ AHMMAD' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user._id})`);

  const d = await Deposit.deleteMany({ userId: user._id });
  const l = await Loan.deleteMany({ userId: user._id });
  const r = await LoanRepayment.deleteMany({ userId: user._id });
  const t = await Transaction.deleteMany({ userId: user._id });
  
  user.balance = 0;
  user.loanBalance = 0;
  await user.save();

  console.log(`Deleted ${d.deletedCount} deposits, ${l.deletedCount} loans, ${r.deletedCount} repayments, ${t.deletedCount} transactions.`);
  console.log(`User balance reset to 0.`);
  
  process.exit(0);
}

clearUser().catch(console.error);
