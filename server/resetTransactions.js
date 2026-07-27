const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const Deposit = require('./models/Deposit');
const Loan = require('./models/Loan');
const LoanRepayment = require('./models/LoanRepayment');
const Transaction = require('./models/Transaction');
const Ledger = require('./models/Ledger');
const MonthlyClosing = require('./models/MonthlyClosing');
const MasterWallet = require('./models/MasterWallet');
const User = require('./models/User');

async function resetAllTransactions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Delete all transaction collections
    const depositResult = await Deposit.deleteMany({});
    console.log(`Cleared ${depositResult.deletedCount} Deposit records.`);

    const loanResult = await Loan.deleteMany({});
    console.log(`Cleared ${loanResult.deletedCount} Loan records.`);

    const repaymentResult = await LoanRepayment.deleteMany({});
    console.log(`Cleared ${repaymentResult.deletedCount} LoanRepayment records.`);

    const transactionResult = await Transaction.deleteMany({});
    console.log(`Cleared ${transactionResult.deletedCount} Transaction records.`);

    const ledgerResult = await Ledger.deleteMany({});
    console.log(`Cleared ${ledgerResult.deletedCount} Ledger records.`);

    const closingResult = await MonthlyClosing.deleteMany({});
    console.log(`Cleared ${closingResult.deletedCount} MonthlyClosing records.`);

    // 2. Reset Master Wallet
    await MasterWallet.deleteMany({});
    await MasterWallet.create({
      balance: 0,
      totalDeposits: 0,
      totalLoans: 0,
      totalWithdrawn: 0,
      withdrawals: []
    });
    console.log('Master Wallet balance & withdrawal history reset to 0.');

    // 3. Reset User balances (keep user accounts & passwords intact)
    const userUpdateResult = await User.updateMany(
      {},
      {
        $set: {
          depositBalance: 0,
          outstandingLoan: 0,
          walletBalance: 0,
          totalDeposits: 0,
          totalLoans: 0
        }
      }
    );
    console.log(`Reset financial balances for ${userUpdateResult.modifiedCount} users.`);

    console.log('\n✅ ALL TRANSACTIONS CLEARED SUCCESSFULLY! The system is now 100% fresh.');
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

resetAllTransactions();
