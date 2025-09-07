const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for purchase history update');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const updatePurchaseHistory = async () => {
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
    
    // Define 5 products for January purchases
    const januaryPurchases = [
      {
        id: 'purchase_jan_01',
        items: [
          {
            name: 'Chicken Sandwich',
            price: 12.99,
            quantity: 1,
            category: 'Meals'
          },
          {
            name: 'Coca Cola',
            price: 2.50,
            quantity: 1,
            category: 'Beverages'
          }
        ],
        total: 15.49,
        purchaseDate: new Date('2024-01-05T12:30:00Z'),
        vendorName: 'Cafe Corner',
        orderId: 'ORD1704459000001'
      },
      {
        id: 'purchase_jan_02',
        items: [
          {
            name: 'Greek Yogurt',
            price: 4.99,
            quantity: 2,
            category: 'Dairy'
          }
        ],
        total: 9.98,
        purchaseDate: new Date('2024-01-08T09:15:00Z'),
        vendorName: 'Fresh Market',
        orderId: 'ORD1704718500002'
      },
      {
        id: 'purchase_jan_03',
        items: [
          {
            name: 'Caesar Salad',
            price: 8.99,
            quantity: 1,
            category: 'Meals'
          },
          {
            name: 'Green Tea',
            price: 1.99,
            quantity: 1,
            category: 'Beverages'
          },
          {
            name: 'Chocolate Chip Cookie',
            price: 2.99,
            quantity: 2,
            category: 'Bakery'
          }
        ],
        total: 16.96,
        purchaseDate: new Date('2024-01-12T14:45:00Z'),
        vendorName: 'Garden Bistro',
        orderId: 'ORD1705064700003'
      },
      {
        id: 'purchase_jan_04',
        items: [
          {
            name: 'Apple',
            price: 1.50,
            quantity: 3,
            category: 'Fruits'
          },
          {
            name: 'Banana',
            price: 0.99,
            quantity: 2,
            category: 'Fruits'
          }
        ],
        total: 6.48,
        purchaseDate: new Date('2024-01-18T11:20:00Z'),
        vendorName: 'Fruit Stand',
        orderId: 'ORD1705582800004'
      },
      {
        id: 'purchase_jan_05',
        items: [
          {
            name: 'Protein Bar',
            price: 3.49,
            quantity: 2,
            category: 'Snacks'
          },
          {
            name: 'Orange Juice',
            price: 3.99,
            quantity: 1,
            category: 'Beverages'
          }
        ],
        total: 10.97,
        purchaseDate: new Date('2024-01-25T16:00:00Z'),
        vendorName: 'Health Hub',
        orderId: 'ORD1706198400005'
      }
    ];
    
    console.log('📝 Adding January purchase history...');
    
    // Add each purchase to the employee's history
    for (const purchase of januaryPurchases) {
      employee.addPurchase(purchase);
      console.log(`✅ Added purchase: ${purchase.orderId} - $${purchase.total} on ${purchase.purchaseDate.toDateString()}`);
    }
    
    // Save the employee with updated purchase history
    await employee.save();
    
    console.log(`🎉 Successfully updated purchase history for ${employee.employeeId}`);
    console.log(`📊 Total purchases added: ${januaryPurchases.length}`);
    console.log(`💰 Total amount: $${januaryPurchases.reduce((sum, p) => sum + p.total, 0).toFixed(2)}`);
    console.log(`📅 Purchase dates: January 2024`);
    
  } catch (error) {
    console.error('❌ Error updating purchase history:', error);
    throw error;
  }
};

const runUpdate = async () => {
  try {
    await connectDB();
    await updatePurchaseHistory();
    console.log('✅ Purchase history update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
};

runUpdate(); 