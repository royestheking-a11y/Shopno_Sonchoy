require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    const email = 'admin@shopno.com';
    const password = 'shopno9965';
    
    let admin = await User.findOne({ email });
    if (!admin) {
      admin = new User({
        memberId: 'ADMIN001',
        name: 'System Admin',
        email,
        password,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully.');
    } else {
      admin.password = password;
      admin.role = 'admin';
      await admin.save();
      console.log('Admin user updated successfully.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
