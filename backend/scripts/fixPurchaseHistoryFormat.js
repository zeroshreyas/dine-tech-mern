const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for purchase history format fix');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const fixPurchaseHistoryFormat = async () => {
  try {
    console.log('🔍 Finding employee EMP001...');
    
    // Find the employee with employeeId 'EMP001' (case insensitive)
    const employee = await User.findOne({ 
      employeeId: { $regex: '^emp001$', $options: 'i' },
      userType: 'employee' 
    });
    
    if (!employee) {
      console.log('❌ Employee EMP001 not found');
      return;
    }
    
    console.log(`✅ Found employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
    console.log(`📋 Current purchase history entries: ${employee.purchaseHistory.length}`);
    
    // Clear existing purchase history
    employee.purchaseHistory = [];
    
    // Create flattened purchase history for January 2024
    const flattenedPurchases = [
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
    
    console.log('📝 Adding properly formatted purchase history...');
    
    // Add each flattened purchase to the employee's history
    for (const purchase of flattenedPurchases) {
      employee.purchaseHistory.push(purchase);
      console.log(`✅ Added: ${purchase.productName} - ₹${purchase.price} (${purchase.category})`);
    }
    
    // Save the employee with updated purchase history
    await employee.save();
    
    console.log(`🎉 Successfully updated purchase history for ${employee.employeeId}`);
    console.log(`📊 Total individual items added: ${flattenedPurchases.length}`);
    console.log(`💰 Total amount: ₹${flattenedPurchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)}`);
    console.log(`📅 Month: January 2024`);
    console.log(`🏪 Categories: ${[...new Set(flattenedPurchases.map(p => p.category))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error fixing purchase history format:', error);
    throw error;
  }
};

const runFix = async () => {
  try {
    await connectDB();
    await fixPurchaseHistoryFormat();
    console.log('✅ Purchase history format fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

runFix(); 