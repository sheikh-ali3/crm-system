const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], required: true },
  productAccess: [
    {
      productId: { type: String, required: true },
      hasAccess: { type: Boolean, default: false },
      grantedAt: { type: Date },
      accessUrl: { type: String }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
