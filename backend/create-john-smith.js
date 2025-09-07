const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

async function createJohnSmith() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'john.smith@company.com' });
    if (existingUser) {
      console.log('👤 User john.smith@company.com already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Type:', existingUser.userType);
      console.log('🔐 Try password: admin123 or password123');
      mongoose.connection.close();
      return;
    }

    // Create John Smith user
    const userData = {
      employeeId: 'EMP001',
      email: 'john.smith@company.com',
      password: 'password123', // You can change this
      firstName: 'John',
      lastName: 'Smith',
      userType: 'employee', // Change to 'admin' or 'vendor' if needed
      department: 'IT',
      position: 'Software Developer',
      contactNumber: '+1-555-0123',
      location: 'New York',
      secretPin: '1234' // 4-digit PIN for employee
    };

    const user = new User(userData);
    await user.save();

    console.log('✅ User created successfully!');
    console.log('📧 Email: john.smith@company.com');
    console.log('🔐 Password: password123');
    console.log('👤 Type:', userData.userType);
    console.log('🆔 Employee ID:', userData.employeeId);
    console.log('📍 Department:', userData.department);
    console.log('🔢 Secret PIN:', userData.secretPin);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    mongoose.connection.close();
  }
}

createJohnSmith(); 