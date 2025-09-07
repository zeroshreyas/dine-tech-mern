require('dotenv').config();
const Razorpay = require('razorpay');

console.log('🔍 Testing Razorpay Configuration...');
console.log('🔑 Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('🔐 Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing');

try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  console.log('✅ Razorpay instance created successfully');

  // Test creating a simple order
  razorpay.orders.create({
    amount: 10000, // ₹100 in paisa
    currency: 'INR',
    receipt: 'test_receipt_' + Date.now()
  }).then(order => {
    console.log('🎉 SUCCESS! Order created:', order.id);
    console.log('✅ Your Razorpay keys are working correctly!');
  }).catch(error => {
    console.log('❌ ERROR creating order:', error);
  });

} catch (error) {
  console.log('❌ ERROR initializing Razorpay:', error);
} 