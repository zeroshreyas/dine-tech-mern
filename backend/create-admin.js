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
  isActive: { type: Boolean, default: true },
  department: { type: String },
  position: { type: String },
  location: { type: String }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const adminUser = new User({
      employeeId: 'ADMIN001',
      email: 'admin@company.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      userType: 'admin',
      contactNumber: '+1-555-ADMIN',
      department: 'IT',
      position: 'System Administrator',
      location: 'HQ'
    });

    // Try to save
    try {
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    } catch (saveError) {
      if (saveError.code === 11000) {
        // Duplicate key error - user already exists, let's update instead
        console.log('Admin user already exists, updating password...');
        
        const updateResult = await User.updateOne(
          { email: 'admin@company.com' },
          { 
            password: hashedPassword,
            userType: 'admin',
            firstName: 'System',
            lastName: 'Administrator'
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log('✅ Admin user updated successfully!');
        } else {
          console.log('⚠️ Admin user exists but no updates needed');
        }
      } else {
        throw saveError;
      }
    }

    console.log('📋 Admin credentials:');
    console.log('   Email: admin@company.com');
    console.log('   Password: admin123');
    console.log('   User Type: admin');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

createAdmin(); 