const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple user schema
const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userType: { type: String, enum: ['employee', 'vendor', 'admin'], default: 'employee' },
  contactNumber: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function updateAdmin() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update existing admin user
    const result = await User.updateOne(
      { email: 'admin@company.com' },
      { 
        password: hashedPassword,
        userType: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      }
    );

    if (result.matchedCount > 0) {
      console.log('Admin user updated successfully!');
      console.log('Email: admin@company.com');
      console.log('Password: admin123');
      console.log('User Type: admin');
    } else {
      console.log('Admin user not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}

updateAdmin(); 