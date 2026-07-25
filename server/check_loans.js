const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Loan = require('./models/Loan');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const loans = await Loan.find({}).lean();
    console.log("Found", loans.length, "loans");
  } catch (e) {
    console.error("Error fetching loans:", e);
  }
  process.exit(0);
}
check();
