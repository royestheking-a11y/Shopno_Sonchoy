const mongoose = require('mongoose');
const Deposit = require('./models/Deposit');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const deposits = await Deposit.find({});
  console.log("Deposits:", deposits);
  mongoose.disconnect();
});
