const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const loadSampleData = (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
    return [];
  }
};

const seedUsers = async () => {
  console.log('🌱 Seeding users from sample data...');
  
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    const usersData = loadSampleData('users.sample.json');
    
    if (usersData.length === 0) {
      console.log('⚠️ No user data found in sample file');
      return;
    }

    for (const userData of usersData) {
      try {
        // Convert date strings to Date objects
        if (userData.pantryBudget && userData.pantryBudget.lastUpdated) {
          userData.pantryBudget.lastUpdated = new Date(userData.pantryBudget.lastUpdated);
        }
        
        // Convert purchase history dates
        if (userData.purchaseHistory && userData.purchaseHistory.length > 0) {
          userData.purchaseHistory = userData.purchaseHistory.map(purchase => ({
            ...purchase,
            purchaseDate: new Date(purchase.purchaseDate)
          }));
        }

        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.userType})`);
      } catch (userError) {
        console.error(`❌ Error creating user ${userData.email}:`, userError.message);
      }
    }

    console.log(`🎉 Successfully seeded ${usersData.length} users`);
  } catch (error) {
    console.error('❌ Error in seedUsers:', error.message);
  }
};

const seedProducts = async () => {
  console.log('🌱 Seeding products from sample data...');
  
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');

    const productsData = loadSampleData('products.sample.json');
    
    if (productsData.length === 0) {
      console.log('⚠️ No product data found in sample file');
      return;
    }

    const createdProducts = await Product.insertMany(productsData);
    console.log(`🎉 Successfully seeded ${createdProducts.length} products`);
    
    // Display products by category
    const categories = [...new Set(createdProducts.map(p => p.category))];
    console.log('\n📦 Products by Category:');
    categories.forEach(category => {
      const categoryProducts = createdProducts.filter(p => p.category === category);
      console.log(`  ${category}: ${categoryProducts.length} items`);
      categoryProducts.forEach(product => {
        console.log(`    - ${product.name} (₹${product.price})`);
      });
    });
  } catch (error) {
    console.error('❌ Error in seedProducts:', error.message);
  }
};

const seedOrders = async () => {
  console.log('🌱 Seeding orders from sample data...');
  
  try {
    // Clear existing orders
    await Order.deleteMany({});
    console.log('🗑️ Cleared existing orders');

    const ordersData = loadSampleData('orders.sample.json');
    
    if (ordersData.length === 0) {
      console.log('⚠️ No order data found in sample file');
      return;
    }

    const processedOrders = [];
    
    for (const orderData of ordersData) {
      try {
        // Find employee and vendor by email
        const employee = await User.findOne({ email: orderData.employee });
        const vendor = await User.findOne({ email: orderData.vendor });
        
        if (!employee) {
          console.log(`⚠️ Employee not found: ${orderData.employee}`);
          continue;
        }
        
        if (!vendor) {
          console.log(`⚠️ Vendor not found: ${orderData.vendor}`);
          continue;
        }

        // Convert dates
        const processedOrder = {
          ...orderData,
          employee: employee._id,
          vendor: vendor._id,
          orderDate: new Date(orderData.orderDate),
          completedAt: orderData.completedAt ? new Date(orderData.completedAt) : undefined
        };

        const order = new Order(processedOrder);
        await order.save();
        processedOrders.push(order);
        
        console.log(`✅ Created order: ${order.orderId} (${order.status})`);
      } catch (orderError) {
        console.error(`❌ Error creating order ${orderData.orderId}:`, orderError.message);
      }
    }

    console.log(`🎉 Successfully seeded ${processedOrders.length} orders`);
    
    // Display order statistics
    const completedOrders = processedOrders.filter(o => o.status === 'completed');
    const pendingOrders = processedOrders.filter(o => o.status === 'pending');
    const totalValue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    console.log('\n📊 Order Statistics:');
    console.log(`  Total Orders: ${processedOrders.length}`);
    console.log(`  Completed: ${completedOrders.length}`);
    console.log(`  Pending: ${pendingOrders.length}`);
    console.log(`  Total Value: ₹${totalValue}`);
  } catch (error) {
    console.error('❌ Error in seedOrders:', error.message);
  }
};

const seedPayments = async () => {
  console.log('🌱 Seeding payments from sample data...');
  
  try {
    // Clear existing payments
    await Payment.deleteMany({});
    console.log('🗑️ Cleared existing payments');

    const paymentsData = loadSampleData('payments.sample.json');
    
    if (paymentsData.length === 0) {
      console.log('⚠️ No payment data found in sample file');
      return;
    }

    const processedPayments = [];
    
    for (const paymentData of paymentsData) {
      try {
        // Find employee by email
        const employee = await User.findOne({ email: paymentData.employee });
        
        if (!employee) {
          console.log(`⚠️ Employee not found: ${paymentData.employee}`);
          continue;
        }

        // Convert dates and reference
        const processedPayment = {
          ...paymentData,
          employee: employee._id,
          transactionDate: new Date(paymentData.transactionDate),
          completedAt: paymentData.completedAt ? new Date(paymentData.completedAt) : undefined
        };

        const payment = new Payment(processedPayment);
        await payment.save();
        processedPayments.push(payment);
        
        console.log(`✅ Created payment: ${payment.paymentId} (₹${payment.amount} - ${payment.status})`);
      } catch (paymentError) {
        console.error(`❌ Error creating payment ${paymentData.paymentId}:`, paymentError.message);
      }
    }

    console.log(`🎉 Successfully seeded ${processedPayments.length} payments`);
    
    // Display payment statistics
    const completedPayments = processedPayments.filter(p => p.status === 'completed');
    const totalAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentMethods = [...new Set(processedPayments.map(p => p.paymentMethod))];
    
    console.log('\n💳 Payment Statistics:');
    console.log(`  Total Payments: ${processedPayments.length}`);
    console.log(`  Completed: ${completedPayments.length}`);
    console.log(`  Total Amount: ₹${totalAmount}`);
    console.log(`  Payment Methods: ${paymentMethods.join(', ')}`);
  } catch (error) {
    console.error('❌ Error in seedPayments:', error.message);
  }
};

const seedData = async () => {
  try {
    console.log('🚀 Starting comprehensive database seeding from sample files...');
    console.log('📁 Loading data from: backend/data/ directory\n');
    
    await connectDB();
    
    // Seed in order (users first, then products, then orders/payments)
    await seedUsers();
    console.log(''); // Empty line for readability
    
    await seedProducts();
    console.log(''); // Empty line for readability
    
    await seedOrders();
    console.log(''); // Empty line for readability
    
    await seedPayments();
    console.log(''); // Empty line for readability
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Users: ${await User.countDocuments()}`);
    console.log(`  - Products: ${await Product.countDocuments()}`);
    console.log(`  - Orders: ${await Order.countDocuments()}`);
    console.log(`  - Payments: ${await Payment.countDocuments()}`);
    
    console.log('\n🔑 Demo Credentials:');
    console.log('  Employee: john.smith@company.com / password123 (PIN: 1234)');
    console.log('  Vendor: alice.vendor@company.com / vendor123');
    console.log('  Admin: admin@dinetech.com / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, seedUsers, seedProducts, seedOrders, seedPayments }; 