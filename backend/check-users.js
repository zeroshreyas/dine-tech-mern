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

async function checkUsers() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('employeeId firstName lastName email userType department isActive');
    
    console.log(`\n📊 Total users in database: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   ID: ${user.employeeId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.userType}`);
      console.log(`   Department: ${user.department || 'N/A'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('   ───────────────────');
    });

    const employees = users.filter(u => u.userType === 'employee' && u.isActive);
    console.log(`\n✅ Active employees: ${employees.length}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}

checkUsers(); 