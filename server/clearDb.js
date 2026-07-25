require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Deposit = require('./models/Deposit');
const Ledger = require('./models/Ledger');
const Loan = require('./models/Loan');
const LoanRepayment = require('./models/LoanRepayment');
const MasterWallet = require('./models/MasterWallet');
const MonthlyClosing = require('./models/MonthlyClosing');
const Report = require('./models/Report');
const Subscription = require('./models/Subscription');
const Transaction = require('./models/Transaction');
const Broadcast = require('./models/Broadcast');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Clearing database...');
    
    // Delete all users except admin
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('Deleted non-admin users.');
    
    // Reset admin balances to 0 just in case
    await User.updateMany({ role: 'admin' }, { balance: 0, loanBalance: 0 });
    console.log('Reset admin balances.');
    
    // Delete all transactional data
    await Deposit.deleteMany({});
    await Ledger.deleteMany({});
    await Loan.deleteMany({});
    await LoanRepayment.deleteMany({});
    await MonthlyClosing.deleteMany({});
    await Report.deleteMany({});
    await Subscription.deleteMany({});
    await Transaction.deleteMany({});
    await Broadcast.deleteMany({});
    
    // Reset MasterWallet
    await MasterWallet.deleteMany({});
    const newWallet = new MasterWallet({ balance: 0, profit: 0 });
    await newWallet.save();
    
    console.log('Cleared all transaction, deposit, loan, and operational data successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
