const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
const User = require('./models/User');
const Deposit = require('./models/Deposit');
const MonthlyClosing = require('./models/MonthlyClosing');
const MasterWallet = require('./models/MasterWallet');
const Ledger = require('./models/Ledger');
const Setting = require('./models/Setting');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({ role: 'admin' });
  const req = { user: { id: admin._id } };

  // Set up test user
  const user = await User.findOne({ email: 'mafujahmmed83@gmail.com' });
  if (user) {
    user.balance = 0;
    user.advanceMonths = 0;
    await user.save();
    
    // Create an old deposit (not this month)
    await Deposit.deleteMany({ userId: user._id });
    const oldDeposit = new Deposit({
      userId: user._id,
      amount: 4000,
      method: 'test',
      status: 'approved',
      date: new Date(2026, 4, 15) // May 2026
    });
    await oldDeposit.save();
  }

  const month = 7; // July
  const year = 2026;

  console.log("Running monthly closing for Month 7...");

  const settings = { globalInterestRate: 5 };
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  const deposits = await Deposit.find({ 
    status: 'approved',
    date: { $gte: startDate, $lte: endDate }
  });
  
  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

  const users = await User.find({ role: 'member' });
  let totalProfit = 0;
  let penaltyProfit = 0;
  let masterWallet = await MasterWallet.findOne() || new MasterWallet();

  for (let u of users) {
    const userDeposits = deposits.filter(d => d.userId.toString() === u._id.toString());
    const totalDepositedThisMonth = userDeposits.reduce((sum, d) => sum + d.amount, 0);
    const EXPECTED_DEPOSIT = 1000;
    
    if (totalDepositedThisMonth >= EXPECTED_DEPOSIT) {
      const monthsPaid = Math.floor(totalDepositedThisMonth / EXPECTED_DEPOSIT);
      if (monthsPaid > 1) {
        u.advanceMonths = (u.advanceMonths || 0) + (monthsPaid - 1);
      }
    } else {
      if (u.advanceMonths && u.advanceMonths > 0) {
        u.advanceMonths -= 1;
        console.log(`User ${u.name} used 1 advance month`);
      } else {
        const penaltyAmount = EXPECTED_DEPOSIT * 0.05;
        u.balance -= penaltyAmount;
        penaltyProfit += penaltyAmount;
        masterWallet.balance += penaltyAmount;
        console.log(`User ${u.name} penalized ${penaltyAmount}. Balance is now ${u.balance}`);
      }
    }
  }

  console.log("Total penalty profit:", penaltyProfit);
  process.exit(0);
}
test();
