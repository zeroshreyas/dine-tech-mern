# 🚀 Quick Setup Guide - Fix "Failed to create payment order"

## 🔧 Problem
Getting "Failed to create payment order" error? You need to configure Razorpay API keys.

## ⚡ Quick Fix (5 minutes)

### Step 1: Get FREE Razorpay Test Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up with your email (it's free!)
3. Skip business details for now (use for testing)
4. Go to **Settings** → **API Keys**
5. Click **Generate Test Keys**
6. Copy your:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

### Step 2: Configure Backend
1. Open `dine-tech-mern/backend/.env` file
2. Replace these lines:
```bash
RAZORPAY_KEY_ID=your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_key_secret_here
```

### Step 3: Restart Backend Server
```bash
cd dine-tech-mern/backend
npm run dev
```

## ✅ Test Payment
1. Go to **Real Banking** mode in your app
2. Enter any amount (₹100)
3. Click **Pay**
4. You'll see Razorpay checkout with test options
5. Use test card: `4111 1111 1111 1111`, any future expiry, CVV: `123`

## 🎉 Success!
You now have real payment processing with test mode. No real money will be charged in test mode.

---

## 📧 Need Help?
- Razorpay is completely free for testing
- No KYC required for test mode
- Test transactions are unlimited
- You can go live later with proper business verification

## 🔄 Demo Mode Fallback
If you don't want to set up Razorpay right now, use **Demo Mode** 🧪 which simulates the payment process without real integration. 