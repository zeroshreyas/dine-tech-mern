const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10,
    max: 10000
  },
  paymentMethod: {
    type: String,
    enum: ['net_banking', 'card', 'wallet', 'razorpay'],
    default: 'net_banking'
  },
  
  // Razorpay specific fields
  razorpayOrderId: {
    type: String,
    sparse: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  bankDetails: {
    bankCode: String,
    bankName: String,
    accountNumber: String, // Last 4 digits only for security
    ifscCode: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  description: {
    type: String,
    default: 'Pantry budget top-up'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String
  }
}, {
  timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.paymentId = `PAY${timestamp}${random}`;
  }
  next();
});

// Set completion date when status changes to completed
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema); 