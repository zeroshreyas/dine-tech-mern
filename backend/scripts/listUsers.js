const mongoose = require('mongoose');
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

// List all users
const listUsers = async () => {
  try {
    console.log('📋 Fetching all users from database...\n');
    
    const users = await User.find({}).select('employeeId firstName lastName email userType department');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Employee ID: ${user.employeeId}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User Type: ${user.userType}`);
      console.log(`   Department: ${user.department || 'N/A'}`);
      console.log('   ─────────────────────────────');
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await listUsers();
  
  mongoose.connection.close();
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 