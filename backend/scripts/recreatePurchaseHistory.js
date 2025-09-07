const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for purchase history recreation');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const recreatePurchaseHistory = async () => {
  try {
    console.log('🔍 Finding employee EMP001...');
    
    const employee = await User.findOne({ 
      employeeId: /^emp001$/i,
      userType: 'employee' 
    });
    
    if (!employee) {
      console.log('❌ Employee EMP001 not found');
      return;
    }
    
    console.log(`✅ Found employee: ${employee.firstName} ${employee.lastName}`);
    console.log(`📋 Current purchase history count: ${employee.purchaseHistory.length}`);
    
    // Clear existing purchase history and recreate with proper structure
    employee.purchaseHistory = [];
    
    // Properly structured purchase history for January 2024
    const newPurchaseHistory = [
      // Purchase 1 - January 5th
      {
        id: 'flat_purchase_jan_01_1',
        productName: 'Chicken Sandwich',
        price: 12.99,
        category: 'Meals',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-05T12:30:00Z'),
        vendorName: 'Cafe Corner'
      },
      {
        id: 'flat_purchase_jan_01_2',
        productName: 'Coca Cola',
        price: 2.50,
        category: 'Beverages',
        quantity: 1,
        unit: 'bottle',
        month: '2024-01',
        purchaseDate: new Date('2024-01-05T12:30:00Z'),
        vendorName: 'Cafe Corner'
      },
      // Purchase 2 - January 8th
      {
        id: 'flat_purchase_jan_02_1',
        productName: 'Greek Yogurt',
        price: 4.99,
        category: 'Dairy',
        quantity: 1,
        unit: 'cup',
        month: '2024-01',
        purchaseDate: new Date('2024-01-08T09:15:00Z'),
        vendorName: 'Fresh Market'
      },
      {
        id: 'flat_purchase_jan_02_2',
        productName: 'Greek Yogurt',
        price: 4.99,
        category: 'Dairy',
        quantity: 1,
        unit: 'cup',
        month: '2024-01',
        purchaseDate: new Date('2024-01-08T09:15:00Z'),
        vendorName: 'Fresh Market'
      },
      // Purchase 3 - January 12th
      {
        id: 'flat_purchase_jan_03_1',
        productName: 'Caesar Salad',
        price: 8.99,
        category: 'Meals',
        quantity: 1,
        unit: 'bowl',
        month: '2024-01',
        purchaseDate: new Date('2024-01-12T14:45:00Z'),
        vendorName: 'Garden Bistro'
      },
      {
        id: 'flat_purchase_jan_03_2',
        productName: 'Green Tea',
        price: 1.99,
        category: 'Beverages',
        quantity: 1,
        unit: 'cup',
        month: '2024-01',
        purchaseDate: new Date('2024-01-12T14:45:00Z'),
        vendorName: 'Garden Bistro'
      },
      {
        id: 'flat_purchase_jan_03_3',
        productName: 'Chocolate Chip Cookie',
        price: 2.99,
        category: 'Bakery',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-12T14:45:00Z'),
        vendorName: 'Garden Bistro'
      },
      {
        id: 'flat_purchase_jan_03_4',
        productName: 'Chocolate Chip Cookie',
        price: 2.99,
        category: 'Bakery',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-12T14:45:00Z'),
        vendorName: 'Garden Bistro'
      },
      // Purchase 4 - January 18th
      {
        id: 'flat_purchase_jan_04_1',
        productName: 'Apple',
        price: 1.50,
        category: 'Fruits',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-18T11:20:00Z'),
        vendorName: 'Fruit Stand'
      },
      {
        id: 'flat_purchase_jan_04_2',
        productName: 'Apple',
        price: 1.50,
        category: 'Fruits',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-18T11:20:00Z'),
        vendorName: 'Fruit Stand'
      },
      {
        id: 'flat_purchase_jan_04_3',
        productName: 'Apple',
        price: 1.50,
        category: 'Fruits',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-18T11:20:00Z'),
        vendorName: 'Fruit Stand'
      },
      {
        id: 'flat_purchase_jan_04_4',
        productName: 'Banana',
        price: 0.99,
        category: 'Fruits',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-18T11:20:00Z'),
        vendorName: 'Fruit Stand'
      },
      {
        id: 'flat_purchase_jan_04_5',
        productName: 'Banana',
        price: 0.99,
        category: 'Fruits',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-18T11:20:00Z'),
        vendorName: 'Fruit Stand'
      },
      // Purchase 5 - January 25th
      {
        id: 'flat_purchase_jan_05_1',
        productName: 'Protein Bar',
        price: 3.49,
        category: 'Snacks',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-25T16:00:00Z'),
        vendorName: 'Health Hub'
      },
      {
        id: 'flat_purchase_jan_05_2',
        productName: 'Protein Bar',
        price: 3.49,
        category: 'Snacks',
        quantity: 1,
        unit: 'piece',
        month: '2024-01',
        purchaseDate: new Date('2024-01-25T16:00:00Z'),
        vendorName: 'Health Hub'
      },
      {
        id: 'flat_purchase_jan_05_3',
        productName: 'Orange Juice',
        price: 3.99,
        category: 'Beverages',
        quantity: 1,
        unit: 'bottle',
        month: '2024-01',
        purchaseDate: new Date('2024-01-25T16:00:00Z'),
        vendorName: 'Health Hub'
      }
    ];
    
    console.log('🔧 Creating properly structured purchase history...');
    
    // Add each purchase using direct assignment instead of addPurchase method
    employee.purchaseHistory = newPurchaseHistory;
    
    // Save the updated employee
    await employee.save();
    
    console.log(`💾 Saved ${newPurchaseHistory.length} properly structured purchase records`);
    
    // Verify the structure
    console.log('\n🎉 Verification - Sample records:');
    for (let i = 0; i < Math.min(3, employee.purchaseHistory.length); i++) {
      const purchase = employee.purchaseHistory[i];
      console.log(`${i + 1}. ${purchase.productName} - ₹${purchase.price} (${purchase.category}) - ${purchase.month} - ${purchase.unit}`);
    }
    
    // Check available months and categories
    const months = [...new Set(employee.purchaseHistory.map(p => p.month))].filter(Boolean);
    const categories = [...new Set(employee.purchaseHistory.map(p => p.category))].filter(Boolean);
    
    console.log(`\n📊 Available months: ${months.join(', ')}`);
    console.log(`📊 Available categories: ${categories.join(', ')}`);
    console.log(`💰 Total amount: ₹${employee.purchaseHistory.reduce((sum, p) => sum + p.price, 0).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

const runRecreate = async () => {
  try {
    await connectDB();
    await recreatePurchaseHistory();
    console.log('✅ Purchase history recreation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Recreation failed:', error);
    process.exit(1);
  }
};

runRecreate(); 