const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for product name fix');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const fixProductNames = async () => {
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
    
    // Map of IDs to product names (from our original data)
    const productNameMap = {
      'flat_purchase_jan_01_1': 'Chicken Sandwich',
      'flat_purchase_jan_01_2': 'Coca Cola',
      'flat_purchase_jan_02_1': 'Greek Yogurt',
      'flat_purchase_jan_02_2': 'Greek Yogurt',
      'flat_purchase_jan_03_1': 'Caesar Salad',
      'flat_purchase_jan_03_2': 'Green Tea',
      'flat_purchase_jan_03_3': 'Chocolate Chip Cookie',
      'flat_purchase_jan_03_4': 'Chocolate Chip Cookie',
      'flat_purchase_jan_04_1': 'Apple',
      'flat_purchase_jan_04_2': 'Apple',
      'flat_purchase_jan_04_3': 'Apple',
      'flat_purchase_jan_04_4': 'Banana',
      'flat_purchase_jan_04_5': 'Banana',
      'flat_purchase_jan_05_1': 'Protein Bar',
      'flat_purchase_jan_05_2': 'Protein Bar',
      'flat_purchase_jan_05_3': 'Orange Juice'
    };
    
    console.log('🔧 Fixing missing product names...');
    let fixedCount = 0;
    
    for (let purchase of employee.purchaseHistory) {
      if (!purchase.productName && productNameMap[purchase.id]) {
        purchase.productName = productNameMap[purchase.id];
        console.log(`✅ Set productName for ${purchase.id}: ${purchase.productName}`);
        fixedCount++;
      }
    }
    
    if (fixedCount > 0) {
      await employee.save();
      console.log(`💾 Saved ${fixedCount} updated product names`);
    } else {
      console.log('ℹ️ No product names needed fixing');
    }
    
    // Verify the fix
    const recordsWithProductName = employee.purchaseHistory.filter(p => p.productName);
    const recordsWithoutProductName = employee.purchaseHistory.filter(p => !p.productName);
    
    console.log(`\n📊 Records with productName: ${recordsWithProductName.length}`);
    console.log(`📊 Records without productName: ${recordsWithoutProductName.length}`);
    
    // Show sample of fixed data
    console.log('\n🎉 Sample of fixed records:');
    for (let i = 0; i < Math.min(3, employee.purchaseHistory.length); i++) {
      const purchase = employee.purchaseHistory[i];
      console.log(`${i + 1}. ${purchase.productName} - ₹${purchase.price} (${purchase.category}) - ${purchase.month}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

const runFix = async () => {
  try {
    await connectDB();
    await fixProductNames();
    console.log('✅ Product name fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

runFix(); 