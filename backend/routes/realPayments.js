const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authenticateToken, requireEmployee } = require('../middleware/auth');
const razorpayService = require('../services/razorpayService');

const router = express.Router();

// @route   GET /api/real-payments/methods
// @desc    Get supported payment methods
// @access  Private
router.get('/methods', authenticateToken, (req, res) => {
  try {
    const methods = razorpayService.getSupportedMethods();
    res.json({
      success: true,
      methods,
      message: 'Supported payment methods retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve payment methods' 
    });
  }
});

// @route   POST /api/real-payments/create-order
// @desc    Create Razorpay order for payment
// @access  Private (Employees only)
router.post('/create-order', authenticateToken, requireEmployee, [
  body('amount').isFloat({ min: 10, max: 50000 }).withMessage('Amount must be between ₹10 and ₹50,000'),
  body('purpose').optional().isString().withMessage('Purpose must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, purpose = 'Budget Top-up' } = req.body;
    const user = req.user;

    // Generate unique receipt ID
    const receipt = `DINE_${user.employeeId}_${Date.now()}`;

    // Create Razorpay order
    const orderResult = await razorpayService.createOrder(
      amount,
      'INR',
      receipt,
      {
        employee_id: user.employeeId,
        user_id: user._id.toString(),
        purpose
      }
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    // Create payment record in database
    const payment = new Payment({
      employee: user._id,
      amount,
      paymentMethod: 'razorpay',
      razorpayOrderId: orderResult.order.id,
      status: 'pending',
      bankDetails: {
        bankName: 'Razorpay Gateway',
        bankCode: 'RAZORPAY'
      },
      metadata: {
        purpose,
        receipt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await payment.save();

    res.json({
      success: true,
      order: orderResult.order,
      key_id: orderResult.key_id,
      payment_id: payment.paymentId,
      user: {
        name: user.name,
        email: user.email,
        contact: user.contactNumber
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/real-payments/verify
// @desc    Verify payment and update user budget
// @access  Private
router.post('/verify', authenticateToken, [
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Payment signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);
    if (!paymentDetails.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }

    const razorpayPayment = paymentDetails.payment;

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = razorpayPayment.status === 'captured' ? 'completed' : 'failed';
    payment.completedAt = new Date();
    payment.bankDetails = {
      ...payment.bankDetails,
      method: razorpayPayment.method,
      bank: razorpayPayment.bank || 'Unknown',
      accountNumber: razorpayPayment.bank_transaction_id || 'N/A'
    };

    await payment.save();

    // Update user budget if payment is successful
    if (payment.status === 'completed') {
      const user = await User.findById(payment.employee);
      if (user) {
        // Add amount to monthly limit
        user.pantryBudget.monthlyLimit += payment.amount;
        user.pantryBudget.lastUpdated = new Date();
        
        // Add to purchase history
        user.purchaseHistory.push({
          orderId: `TOP_${payment.paymentId}`,
          items: [{
            productId: 'budget-topup',
            name: 'Budget Top-up',
            price: payment.amount,
            quantity: 1
          }],
          totalAmount: payment.amount,
          timestamp: new Date(),
          vendor: null,
          type: 'budget-topup'
        });

        await user.save();
      }
    }

    res.json({
      success: true,
      message: payment.status === 'completed' ? 'Payment successful' : 'Payment failed',
      payment: {
        id: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        method: razorpayPayment.method,
        bank: razorpayPayment.bank
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/real-payments/webhook
// @desc    Handle Razorpay webhooks
// @access  Public (but verified)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(req.body, signature);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body);
    
    console.log('Webhook received:', event.event);

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Helper function to handle payment captured
async function handlePaymentCaptured(payment) {
  try {
    const paymentRecord = await Payment.findOne({ razorpayOrderId: payment.order_id });
    if (paymentRecord && paymentRecord.status !== 'completed') {
      paymentRecord.status = 'completed';
      paymentRecord.razorpayPaymentId = payment.id;
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();

      // Update user budget
      const user = await User.findById(paymentRecord.employee);
      if (user) {
        user.pantryBudget.monthlyLimit += paymentRecord.amount;
        user.pantryBudget.lastUpdated = new Date();
        await user.save();
      }
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Helper function to handle payment failed
async function handlePaymentFailed(payment) {
  try {
    const paymentRecord = await Payment.findOne({ razorpayOrderId: payment.order_id });
    if (paymentRecord) {
      paymentRecord.status = 'failed';
      paymentRecord.razorpayPaymentId = payment.id;
      await paymentRecord.save();
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Helper function to handle order paid
async function handleOrderPaid(order) {
  try {
    console.log('Order paid:', order.id);
    // Additional logic for order completion
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// @route   GET /api/real-payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, status } = req.query;
    
    const query = { employee: req.user._id };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('employee', 'name employeeId');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + payments.length)
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

module.exports = router; 