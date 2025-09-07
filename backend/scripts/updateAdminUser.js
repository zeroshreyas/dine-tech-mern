const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update user function
const updateAdminUser = async () => {
  try {
    console.log('🔄 Updating emp002 to admin user...');
    
    // Find the user by employeeId
    const user = await User.findOne({ employeeId: 'emp002' });
    
    if (!user) {
      console.error('❌ User with employeeId "emp002" not found');
      return;
    }
    
    console.log(`📋 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the user
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      userType: 'admin'
    });
    
    console.log('✅ Successfully updated user:');
    console.log(`   - Password changed to: admin123`);
    console.log(`   - User type changed to: admin`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Employee ID: ${user.employeeId}`);
    
    // Verify the update
    const updatedUser = await User.findById(user._id);
    console.log(`🔍 Verification - User type is now: ${updatedUser.userType}`);
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateAdminUser();
  
  console.log('🏁 Script completed. You can now login with:');
  console.log('   Email: (emp002 user email)');
  console.log('   Password: admin123');
  console.log('   User Type: admin');
  
  mongoose.connection.close();
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 