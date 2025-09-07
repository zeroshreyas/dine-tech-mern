const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for debug');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const debugAndFixPurchaseHistory = async () => {
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
    console.log(`📋 Purchase history count: ${employee.purchaseHistory.length}`);
    
    // Debug the first few records
    console.log('\n🔎 Debugging first 3 purchase records:');
    for (let i = 0; i < Math.min(3, employee.purchaseHistory.length); i++) {
      const purchase = employee.purchaseHistory[i];
      console.log(`Record ${i + 1}:`, {
        id: purchase.id,
        productName: purchase.productName,
        month: purchase.month,
        purchaseDate: purchase.purchaseDate,
        hasMonthField: purchase.hasOwnProperty('month')
      });
    }
    
    // Check if any records have month field
    const recordsWithMonth = employee.purchaseHistory.filter(p => p.month);
    const recordsWithoutMonth = employee.purchaseHistory.filter(p => !p.month);
    
    console.log(`\n📊 Records with month field: ${recordsWithMonth.length}`);
    console.log(`📊 Records without month field: ${recordsWithoutMonth.length}`);
    
    if (recordsWithoutMonth.length > 0) {
      console.log('\n🔧 Fixing missing month fields...');
      
      // Fix records without month field
      for (let purchase of employee.purchaseHistory) {
        if (!purchase.month && purchase.purchaseDate) {
          const date = new Date(purchase.purchaseDate);
          purchase.month = date.toISOString().slice(0, 7); // Format: YYYY-MM
          console.log(`✅ Set month for ${purchase.productName || purchase.id}: ${purchase.month}`);
        }
      }
      
      // Save the updated employee
      await employee.save();
      console.log('💾 Saved updated purchase history');
    }
    
    // Show final state
    const months = [...new Set(employee.purchaseHistory.map(p => p.month))].filter(Boolean);
    console.log(`\n🎉 Available months after fix: ${months.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

const runDebug = async () => {
  try {
    await connectDB();
    await debugAndFixPurchaseHistory();
    console.log('✅ Debug and fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
};

runDebug(); 