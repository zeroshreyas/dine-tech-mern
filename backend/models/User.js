const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['employee', 'vendor', 'admin'],
    default: 'employee'
  },
  department: {
    type: String,
    required: function() {
      return this.userType === 'employee';
    }
  },
  position: {
    type: String,
    required: function() {
      return this.userType === 'employee';
    }
  },
  contactNumber: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  secretPin: {
    type: String,
    required: function() {
      return this.userType === 'employee';
    },
    minlength: 4,
    maxlength: 4
  },
  pantryBudget: {
    monthlyLimit: {
      type: Number,
      default: 100,
      min: 0
    },
    currentSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  purchaseHistory: [{
    id: String,
    productName: String,
    price: Number,
    category: String,
    quantity: Number,
    unit: String,
    month: String,
    purchaseDate: Date,
    vendorName: String,
    orderId: String,
    // Legacy fields for backward compatibility
    items: [{
      name: String,
      price: Number,
      quantity: Number,
      category: String
    }],
    total: Number
  }],
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get remaining budget
userSchema.methods.getRemainingBudget = function() {
  return this.pantryBudget.monthlyLimit - this.pantryBudget.currentSpent;
};

// Update budget after purchase
userSchema.methods.updateBudgetAfterPurchase = function(amount) {
  this.pantryBudget.currentSpent += amount;
  this.pantryBudget.lastUpdated = new Date();
};

// Add purchase to history
userSchema.methods.addPurchase = function(purchaseData) {
  this.purchaseHistory.push(purchaseData);
};

module.exports = mongoose.model('User', userSchema); 