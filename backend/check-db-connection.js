const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database configuration...\n');
    
    // Show environment variables
    console.log('📋 Environment Configuration:');
    console.log('━'.repeat(50));
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('PORT:', process.env.PORT || 'not set');
    
    // Show MongoDB URI (hide password for security)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    const maskedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('MONGODB_URI:', maskedURI);
    
    console.log('\n🔗 Attempting to connect...');
    
    // Connect to database
    await mongoose.connect(mongoURI);
    
    // Get connection details
    const connection = mongoose.connection;
    console.log('\n✅ Connection successful!');
    console.log('━'.repeat(50));
    console.log('Database Name:', connection.db.databaseName);
    console.log('Host:', connection.host);
    console.log('Port:', connection.port);
    console.log('Connection State:', connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Determine database type
    console.log('\n🏢 Database Type:');
    console.log('━'.repeat(50));
    
    if (mongoURI.includes('mongodb+srv://') || mongoURI.includes('mongodb.net')) {
      console.log('🌐 MONGODB ATLAS (Cloud Database)');
      console.log('   ✅ You are using MongoDB Atlas cloud database');
    } else if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
      console.log('💻 LOCAL MONGODB');
      console.log('   ✅ You are using local MongoDB database');
    } else {
      console.log('🔧 CUSTOM MONGODB INSTANCE');
      console.log('   ✅ You are using a custom MongoDB instance');
    }
    
    // Check collections
    console.log('\n📊 Database Statistics:');
    console.log('━'.repeat(50));
    
    const collections = await connection.db.listCollections().toArray();
    console.log('Collections found:', collections.length);
    
    collections.forEach(collection => {
      console.log(`   📁 ${collection.name}`);
    });
    
    // Check user count
    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
    const userCount = await User.countDocuments();
    console.log('\n👥 Users in database:', userCount);
    
    if (userCount > 0) {
      const sampleUsers = await User.find({}).limit(3).select('email userType');
      console.log('\n📋 Sample users:');
      sampleUsers.forEach(user => {
        console.log(`   👤 ${user.email} (${user.userType})`);
      });
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Internet connection problem');
      console.log('   - Wrong MongoDB Atlas URL');
      console.log('   - DNS resolution issue');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Wrong username/password in connection string');
      console.log('   - User not authorized for this database');
    }
    
    mongoose.connection.close();
  }
}

checkDatabaseConnection(); 