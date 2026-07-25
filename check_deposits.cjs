const mongoose = require('mongoose');
const Deposit = require('./server/models/Deposit');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const deposits = await Deposit.find({});
  console.log("Deposits:", deposits);
  mongoose.disconnect();
});
