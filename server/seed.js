require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create Default Admin
    const admin = new User({
      memberId: 'A-001',
      role: 'admin',
      name: 'System Admin',
      email: 'admin@shopno.com',
      password: 'password', // will be hashed by pre-save
      balance: 0,
      loanBalance: 0
    });
    
    const member1 = new User({
      memberId: 'M-1001',
      role: 'member',
      name: 'Rahim Uddin',
      email: 'member@shopno.com',
      password: 'password',
      phone: '01711000001',
      balance: 195000,
      loanBalance: 0
    });

    await admin.save();
    await member1.save();
    
    console.log('Database Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
