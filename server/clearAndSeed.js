const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');

const uri = process.env.MONGODB_URI || "mongodb+srv://sonchoyshopno_db_user:iFT1QLuWc74qR4mV@cluster0.5ekca7f.mongodb.net/swapno_sonchoy?retryWrites=true&w=majority";

async function clearAndSeed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('Successfully dropped the entire database');

    // Re-seed the admin user
    const admin = new User({
      name: 'System Admin',
      memberId: 'ADMIN-001',
      email: 'admin@shopno.com',
      password: 'shopno9965',
      role: 'admin',
      phone: '+8801700000000',
      balance: 0,
      loanBalance: 0,
      isApproved: true
    });
    
    await admin.save();
    console.log('Admin user seeded successfully. Email: admin@shopno.com, Password: shopno9965');

  } catch (err) {
    console.error('Error in clear and seed script:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

clearAndSeed();
