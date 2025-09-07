const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  employeeId: String,
  firstName: String,
  lastName: String,
  email: String,
  userType: String,
  department: String,
  position: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function listAllUsers() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('employeeId firstName lastName email userType department isActive');
    
    console.log(`\n📊 Total users in database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n🔧 Solutions:');
      console.log('1. Run: node create-admin.js');
      console.log('2. Run: npm run seed');
      console.log('3. Register a new user through the frontend');
      return;
    }

    // Group users by type
    const usersByType = users.reduce((acc, user) => {
      if (!acc[user.userType]) acc[user.userType] = [];
      acc[user.userType].push(user);
      return acc;
    }, {});

    // Display users by type
    Object.keys(usersByType).forEach(userType => {
      console.log(`\n👥 ${userType.toUpperCase()} USERS:`);
      console.log('━'.repeat(50));
      
      usersByType[userType].forEach(user => {
        const status = user.isActive ? '✅' : '❌';
        console.log(`${status} ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 ID: ${user.employeeId}`);
        if (user.department) console.log(`   🏢 Dept: ${user.department}`);
        console.log('');
      });
    });

    // Show login instructions
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('━'.repeat(50));
    
    users.forEach(user => {
      if (user.isActive) {
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔐 Password: Use the password you set for this user`);
        console.log(`👤 Type: ${user.userType}`);
        console.log('');
      }
    });

    console.log('\n💡 If you forgot passwords:');
    console.log('- For admin: Password is likely "admin123" if created with create-admin.js');
    console.log('- For other users: Check your seeding scripts or create new users');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

listAllUsers(); 