const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  memberId: { type: String, unique: true, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rawPassword: { type: String },
  phone: { type: String },
  alternatePhone: { type: String },
  address: { type: String },
  nidNumber: { type: String },
  nomineeName: { type: String },
  nomineePhone: { type: String },
  balance: { type: Number, default: 0 },
  loanBalance: { type: Number, default: 0 },
  advanceMonths: { type: Number, default: 0 },
  currentChallenge: { type: String },
  passkeys: [{
    credentialID: String,
    credentialPublicKey: String,
    counter: Number,
    transports: [String]
  }]
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.rawPassword = this.password;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
