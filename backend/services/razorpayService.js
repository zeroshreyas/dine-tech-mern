const Razorpay = require('razorpay');
const crypto = require('crypto');

// Check if we have valid Razorpay keys
console.log('🔑 Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('🔐 Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing');

const isTestMode = !process.env.RAZORPAY_KEY_ID || 
                   process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id_here' ||
                   process.env.RAZORPAY_KEY_ID === 'rzp_test_demo_key_id';

console.log('🧪 Is Test Mode:', isTestMode);

// Initialize Razorpay instance with fallback for demo mode
const razorpay = isTestMode ? null : new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

if (razorpay) {
  console.log('✅ Razorpay initialized successfully');
} else {
  console.log('⚠️  Running in demo mode - Razorpay not initialized');
}

class RazorpayService {
  // Create a payment order
  async createOrder(amount, currency = 'INR', receipt, notes = {}) {
    try {
      // Handle demo mode when Razorpay keys are not configured
      if (isTestMode) {
        console.log('⚠️  Running in DEMO mode - Configure Razorpay keys for real payments');
        const mockOrder = {
          id: `order_demo_${Date.now()}`,
          amount: Math.round(amount * 100),
          currency,
          receipt,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
          notes: {
            application: 'Dine Tech - Pantry Management',
            purpose: 'Budget Top-up',
            ...notes
          }
        };

        return {
          success: true,
          order: mockOrder,
          key_id: 'rzp_test_demo_key',
          isDemo: true,
          message: 'Demo mode - Configure Razorpay keys for real payments'
        };
      }

      const orderOptions = {
        amount: Math.round(amount * 100), // Amount in paisa (smallest currency unit)
        currency,
        receipt,
        notes: {
          application: 'Dine Tech - Pantry Management',
          purpose: 'Budget Top-up',
          ...notes
        }
      };

      const order = await razorpay.orders.create(orderOptions);
      return {
        success: true,
        order,
        key_id: process.env.RAZORPAY_KEY_ID,
        isDemo: false
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment order',
        details: isTestMode ? 'Running in demo mode - get Razorpay keys from https://dashboard.razorpay.com/' : 'Check your Razorpay API credentials'
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(paymentId, orderId, signature) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Payment signature verification error:', error);
      return false;
    }
  }

  // Fetch payment details
  async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch payment details'
      };
    }
  }

  // Fetch order details
  async getOrderDetails(orderId) {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return {
        success: true,
        order
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order details'
      };
    }
  }

  // Refund a payment
  async createRefund(paymentId, amount = null, notes = {}) {
    try {
      const refundOptions = {
        payment_id: paymentId,
        notes: {
          reason: 'Budget adjustment',
          processed_by: 'Dine Tech System',
          ...notes
        }
      };

      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Amount in paisa
      }

      const refund = await razorpay.payments.refund(paymentId, refundOptions);
      return {
        success: true,
        refund
      };
    } catch (error) {
      console.error('Refund creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create refund'
      };
    }
  }

  // Get supported payment methods
  getSupportedMethods() {
    return {
      netbanking: [
        'HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'INDUSIND', 'YES', 'UNION',
        'BOB', 'BOI', 'PNB', 'CANARA', 'IOB', 'FEDERAL', 'IDBI', 'CUB',
        'SOUTH', 'KARNATAKA', 'ANDHRA', 'UCO', 'ORIENTAL', 'SYNDICATE'
      ],
      cards: ['visa', 'mastercard', 'amex', 'diners', 'rupay'],
      wallets: ['paytm', 'phonepe', 'amazonpay', 'freecharge', 'mobikwik'],
      upi: ['gpay', 'phonepe', 'paytm', 'bhim', 'amazon']
    };
  }

  // Verify webhook signature
  verifyWebhookSignature(body, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret')
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  // Format amount for display (paisa to rupees)
  formatAmount(amountInPaisa) {
    return (amountInPaisa / 100).toFixed(2);
  }

  // Convert rupees to paisa
  convertToPaisa(amountInRupees) {
    return Math.round(amountInRupees * 100);
  }
}

module.exports = new RazorpayService(); 