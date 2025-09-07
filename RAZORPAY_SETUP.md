# 🏦 Razorpay Net Banking Integration Setup Guide

## 📋 Overview
This guide will help you set up real net banking payments using Razorpay in your Dine Tech application.

## 🔑 1. Razorpay Account Setup

### Step 1: Create Razorpay Account
1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a business account
3. Complete KYC verification
4. Get your account activated

### Step 2: Get API Keys
1. Go to Settings → API Keys
2. Generate **Test Mode** keys first:
   - `Key ID` (starts with `rzp_test_`)
   - `Key Secret`
3. For production, generate **Live Mode** keys:
   - `Key ID` (starts with `rzp_live_`)
   - `Key Secret`

### Step 3: Configure Webhooks
1. Go to Settings → Webhooks
2. Create webhook with URL: `https://your-domain.com/api/real-payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
4. Generate webhook secret

## 🔧 2. Environment Configuration

### Backend Environment Variables
Create/update `.env` file in `backend/` directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/dine-tech
JWT_SECRET=your-super-secure-jwt-secret-key

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Environment
NODE_ENV=development
PORT=5000

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables
Create `.env` file in `frontend/` directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Payment Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

## 🚀 3. Installation & Setup

### Backend Setup
```bash
cd dine-tech-mern/backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd dine-tech-mern/frontend
npm install
npm run dev
```

## 💳 4. Supported Payment Methods

### Net Banking Banks (22+ Banks)
- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank
- Punjab National Bank (PNB)
- Bank of India (BOI)
- Canara Bank
- Indian Overseas Bank (IOB)
- And 13+ more banks

### Other Payment Methods
- **UPI**: Google Pay, PhonePe, Paytm, BHIM
- **Credit/Debit Cards**: Visa, Mastercard, RuPay, AMEX
- **Digital Wallets**: Paytm, PhonePe, Amazon Pay, FreeCharge

## 🧪 5. Testing

### Test Card Details
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
OTP: 123456
```

### Test Net Banking
- Select any bank during payment
- Use test credentials provided by Razorpay
- All test transactions are automatically successful

### Test UPI
- Use any UPI ID format: `test@paytm`
- Simulate success/failure scenarios

## 🔒 6. Security Best Practices

### Backend Security
1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS Only**: Use SSL certificates in production
3. **Signature Verification**: Always verify payment signatures
4. **Rate Limiting**: Implement API rate limiting
5. **Input Validation**: Validate all payment inputs
6. **Webhook Security**: Verify webhook signatures
7. **Database Security**: Use MongoDB authentication

### Frontend Security
1. **API Key Protection**: Only expose Razorpay Key ID (public key)
2. **CSP Headers**: Implement Content Security Policy
3. **CORS Configuration**: Restrict origins in production
4. **XSS Protection**: Sanitize user inputs
5. **HTTPS Enforcement**: Redirect HTTP to HTTPS

## 🌐 7. Production Deployment

### Backend Deployment (Node.js)
```bash
# Build for production
npm run build

# Set environment variables
export NODE_ENV=production
export RAZORPAY_KEY_ID=rzp_live_your_live_key
export RAZORPAY_KEY_SECRET=your_live_secret

# Start production server
npm start
```

### Frontend Deployment (Vite)
```bash
# Build for production
npm run build

# Deploy to your hosting service
# Copy dist/ folder to your web server
```

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS EC2, Railway
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas

## 📊 8. Monitoring & Analytics

### Razorpay Dashboard
- Transaction monitoring
- Settlement tracking
- Dispute management
- Analytics and reports

### Application Monitoring
- Payment success/failure rates
- User transaction patterns
- Error logging and alerts
- Performance monitoring

## 🛠️ 9. Advanced Features

### Recurring Payments
```javascript
// For subscription-based services
const subscription = await razorpay.subscriptions.create({
  plan_id: 'plan_subscription_id',
  customer_notify: 1,
  quantity: 1,
  total_count: 12, // 12 months
});
```

### Partial Payments
```javascript
// Allow partial payment for large amounts
const order = await razorpay.orders.create({
  amount: 50000, // ₹500
  partial_payment: true,
  first_payment_min_amount: 10000, // Minimum ₹100
});
```

### Smart Collect (Virtual UPI IDs)
```javascript
// Generate virtual UPI ID for customers
const virtualAccount = await razorpay.virtualAccounts.create({
  receivers: {
    types: ['vpa']
  },
  description: 'Budget top-up for employee',
  customer_id: 'cust_customer_id'
});
```

## 🆘 10. Troubleshooting

### Common Issues

#### Payment Failures
```javascript
// Handle different failure reasons
const handlePaymentError = (error) => {
  switch (error.code) {
    case 'BAD_REQUEST_ERROR':
      // Invalid request parameters
      break;
    case 'GATEWAY_ERROR':
      // Bank/payment gateway issue
      break;
    case 'NETWORK_ERROR':
      // Network connectivity issue
      break;
    default:
      // Generic error handling
  }
};
```

#### Webhook Issues
- Check webhook URL accessibility
- Verify webhook signature validation
- Ensure proper error handling
- Monitor webhook delivery status

#### Integration Issues
- Verify API keys are correct
- Check CORS configuration
- Validate request/response formats
- Monitor server logs for errors

## 📞 11. Support

### Razorpay Support
- [Documentation](https://razorpay.com/docs/)
- [Support Portal](https://razorpay.com/support/)
- Email: support@razorpay.com
- Phone: +91-80-6144-6555

### Integration Support
- Check server logs for detailed errors
- Use Razorpay test mode for debugging
- Monitor webhook delivery in dashboard
- Implement proper error logging

## 🔄 12. Migration from Test to Production

### Checklist
- [ ] Complete KYC verification
- [ ] Generate live API keys
- [ ] Update environment variables
- [ ] Configure live webhooks
- [ ] Test with small amounts
- [ ] Monitor initial transactions
- [ ] Update frontend URLs
- [ ] Enable live mode in dashboard

### Important Notes
- Test mode and live mode are completely separate
- Transactions don't carry over between modes
- Always test thoroughly before going live
- Keep test environment for ongoing development

---

## 🎉 Congratulations!

You now have a fully functional real net banking integration that supports:
- ✅ 20+ Indian banks
- ✅ UPI payments
- ✅ Credit/Debit cards
- ✅ Digital wallets
- ✅ Secure payment processing
- ✅ Real-time verification
- ✅ Webhook handling
- ✅ Transaction history
- ✅ Refund capabilities

Your users can now add money to their pantry budget using real banking credentials and payment methods! 