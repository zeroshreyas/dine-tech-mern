const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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

async function testAdminAPI() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@company.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      mongoose.connection.close();
      return;
    }

    console.log('✅ Admin user found:', adminUser.firstName, adminUser.lastName);
    console.log('   User Type:', adminUser.userType);
    console.log('   Email:', adminUser.email);

    // Test the employees query that the API endpoint uses
    const employees = await User.find({ userType: 'employee', isActive: true })
      .select('employeeId firstName lastName email department position contactNumber')
      .sort({ firstName: 1, lastName: 1 });
    
    console.log('\n📊 Direct DB Query Results:');
    console.log(`Found ${employees.length} employees:`);
    
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
      console.log(`   Department: ${emp.department || 'N/A'}`);
      console.log(`   Position: ${emp.position || 'N/A'}`);
    });

    // Test JWT token generation
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: adminUser._id,
        userType: adminUser.userType,
        employeeId: adminUser.employeeId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Generated JWT token for admin user');
    console.log('Token preview:', token.substring(0, 50) + '...');

    mongoose.connection.close();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

testAdminAPI(); 