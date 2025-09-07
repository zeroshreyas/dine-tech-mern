const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authenticateToken, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Simulated bank database
const SUPPORTED_BANKS = {
  'SBI': { name: 'State Bank of India', code: 'SBI', processingTime: 2000 },
  'HDFC': { name: 'HDFC Bank', code: 'HDFC', processingTime: 1500 },
  'ICICI': { name: 'ICICI Bank', code: 'ICICI', processingTime: 1800 },
  'AXIS': { name: 'Axis Bank', code: 'AXIS', processingTime: 1700 },
  'BOI': { name: 'Bank of India', code: 'BOI', processingTime: 2500 },
  'PNB': { name: 'Punjab National Bank', code: 'PNB', processingTime: 2200 },
  'CANARA': { name: 'Canara Bank', code: 'CANARA', processingTime: 2000 },
  'IOB': { name: 'Indian Overseas Bank', code: 'IOB', processingTime: 2300 }
};

// @route   GET /api/payments/banks
// @desc    Get list of supported banks
// @access  Private
router.get('/banks', authenticateToken, (req, res) => {
  const banks = Object.values(SUPPORTED_BANKS).map(bank => ({
    code: bank.code,
    name: bank.name
  }));
  
  res.json({ banks });
});

// @route   POST /api/payments/initiate
// @desc    Initiate payment process
// @access  Private (Employees only)
router.post('/initiate', authenticateToken, requireEmployee, [
  body('amount').isFloat({ min: 10, max: 10000 }).withMessage('Amount must be between 10 and 10000'),
  body('bankCode').exists().withMessage('Bank code is required').isIn(Object.keys(SUPPORTED_BANKS)).withMessage('Invalid bank code'),
  body('paymentMethod').optional().isIn(['net_banking', 'card', 'wallet']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }

    const { amount, bankCode, paymentMethod = 'net_banking' } = req.body;
    const bank = SUPPORTED_BANKS[bankCode];

    // Create payment record
    const payment = new Payment({
      employee: req.user._id,
      amount,
      paymentMethod,
      bankDetails: {
        bankCode,
        bankName: bank.name
      },
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: `SES${Date.now()}${Math.floor(Math.random() * 1000)}`
      }
    });

    await payment.save();

    res.json({
      message: 'Payment initiated successfully',
      paymentId: payment.paymentId,
      sessionId: payment.metadata.sessionId,
      bankDetails: {
        name: bank.name,
        code: bank.code,
        processingTime: bank.processingTime
      },
      redirectUrl: `/api/payments/banking/${payment.paymentId}`
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid payment data', details: error.message });
    }
    res.status(500).json({ message: 'Server error initiating payment', error: error.message });
  }
});

// @route   POST /api/payments/banking/:paymentId
// @desc    Simulate bank login and payment processing
// @access  Private
router.post('/banking/:paymentId', [
  body('customerId').exists().withMessage('Customer ID is required').isLength({ min: 6, max: 12 }).withMessage('Customer ID must be 6-12 characters'),
  body('password').exists().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('accountNumber').exists().withMessage('Account number is required').isLength({ min: 10, max: 18 }).withMessage('Account number must be 10-18 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Banking validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }

    const { paymentId } = req.params;
    const { customerId, password, accountNumber } = req.body;

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    // Simulate bank authentication (90% success rate)
    const authSuccess = Math.random() > 0.1;
    
    if (!authSuccess) {
      return res.status(401).json({ 
        message: 'Invalid credentials. Please check your Customer ID and Password.',
        errorCode: 'AUTH_FAILED'
      });
    }

    // Update payment status to processing
    payment.status = 'processing';
    payment.bankDetails.accountNumber = accountNumber.slice(-4);
    await payment.save();

    const bank = SUPPORTED_BANKS[payment.bankDetails.bankCode];

    // Simulate processing time
    setTimeout(async () => {
      try {
        // 95% success rate for payment processing
        const paymentSuccess = Math.random() > 0.05;
        
        if (paymentSuccess) {
          payment.status = 'completed';
          payment.completedAt = new Date();
          await payment.save();

          // Update user budget
          await User.findByIdAndUpdate(
            payment.employee,
            {
              $inc: { 'pantryBudget.monthlyLimit': payment.amount },
              'pantryBudget.lastUpdated': new Date()
            }
          );
        } else {
          payment.status = 'failed';
          await payment.save();
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        payment.status = 'failed';
        await payment.save();
      }
    }, bank.processingTime);

    res.json({
      message: 'Authentication successful. Processing payment...',
      paymentId: payment.paymentId,
      status: 'processing',
      estimatedTime: Math.ceil(bank.processingTime / 1000),
      amount: payment.amount,
      bankName: bank.name,
      accountNumber: `****${accountNumber.slice(-4)}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

// @route   GET /api/payments/status/:paymentId
// @desc    Check payment status
// @access  Private
router.get('/status/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findOne({ paymentId })
      .populate('employee', 'firstName lastName email')
      .select('-metadata');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking payment status' });
  }
});

// @route   POST /api/payments
// @desc    Process payment for budget top-up (Legacy route)
// @access  Private (Employees only)
router.post('/', authenticateToken, requireEmployee, [
  body('amount').isFloat({ min: 10, max: 10000 }),
  body('bankCode').exists(),
  body('accountNumber').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, bankCode, bankName, accountNumber, ifscCode } = req.body;

    // Create payment record
    const payment = new Payment({
      employee: req.user._id,
      amount,
      bankDetails: {
        bankCode,
        bankName,
        accountNumber: accountNumber.slice(-4),
        ifscCode
      },
      status: 'processing',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await payment.save();

    // Simulate payment processing (90% success rate)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: { 'pantryBudget.monthlyLimit': amount },
          'pantryBudget.lastUpdated': new Date()
        },
        { new: true }
      );

      res.json({
        message: 'Payment processed successfully',
        paymentId: payment.paymentId,
        amount,
        newBudget: user.pantryBudget
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        message: 'Payment failed due to technical issues',
        paymentId: payment.paymentId
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history
// @access  Private (Employees only)
router.get('/history', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { limit = 10, offset = 0, status } = req.query;
    
    let query = { employee: req.user._id };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-metadata');

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
});

// @route   POST /api/payments/cancel/:paymentId
// @desc    Cancel pending payment
// @access  Private
router.post('/cancel/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findOne({ 
      paymentId, 
      employee: req.user._id,
      status: { $in: ['pending', 'processing'] }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found or cannot be cancelled' });
    }

    payment.status = 'cancelled';
    await payment.save();

    res.json({
      message: 'Payment cancelled successfully',
      paymentId: payment.paymentId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling payment' });
  }
});

module.exports = router; 