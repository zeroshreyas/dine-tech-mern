const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  console.log('🌱 Seeding users...');
  
  const users = [
    {
      employeeId: 'EMP001',
      email: 'john.smith@company.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Smith',
      userType: 'employee',
      department: 'Engineering',
      position: 'Senior Developer',
      contactNumber: '+1234567890',
      location: 'New York',
      secretPin: '1234',
      pantryBudget: {
        monthlyLimit: 500,
        currentSpent: 250,
        lastUpdated: new Date()
      }
    },
    {
      employeeId: 'EMP002',
      email: 'sarah.johnson@company.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      userType: 'employee',
      department: 'Marketing',
      position: 'Marketing Manager',
      contactNumber: '+1234567891',
      location: 'California',
      secretPin: '5678',
      pantryBudget: {
        monthlyLimit: 400,
        currentSpent: 150,
        lastUpdated: new Date()
      }
    },
    {
      employeeId: 'EMP003',
      email: 'michael.brown@company.com',
      password: 'password123',
      firstName: 'Michael',
      lastName: 'Brown',
      userType: 'employee',
      department: 'Finance',
      position: 'Financial Analyst',
      contactNumber: '+1234567892',
      location: 'Texas',
      secretPin: '9012',
      pantryBudget: {
        monthlyLimit: 300,
        currentSpent: 100,
        lastUpdated: new Date()
      }
    },
    {
      employeeId: 'VEN001',
      email: 'alice.vendor@company.com',
      password: 'vendor123',
      firstName: 'Alice',
      lastName: 'Vendor',
      userType: 'vendor',
      contactNumber: '+1234567893',
      location: 'Kitchen'
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.firstName} ${userData.lastName}`);
    }
  }
};

const seedProducts = async () => {
  console.log('🌱 Seeding products...');
  
  const products = [
    // Snacks
    { name: 'Chocolate Chip Cookies', category: 'Snacks', price: 25, description: 'Freshly baked chocolate chip cookies' },
    { name: 'Potato Chips', category: 'Snacks', price: 15, description: 'Crispy salted potato chips' },
    { name: 'Mixed Nuts', category: 'Snacks', price: 35, description: 'Healthy mixed nuts assortment' },
    { name: 'Granola Bar', category: 'Snacks', price: 20, description: 'Oats and honey granola bar' },
    
    // Beverages
    { name: 'Coffee', category: 'Beverages', price: 30, description: 'Fresh brewed coffee' },
    { name: 'Tea', category: 'Beverages', price: 25, description: 'Assorted tea varieties' },
    { name: 'Orange Juice', category: 'Beverages', price: 40, description: 'Fresh orange juice' },
    { name: 'Mineral Water', category: 'Beverages', price: 20, description: 'Pure mineral water' },
    
    // Meals
    { name: 'Sandwich', category: 'Meals', price: 80, description: 'Club sandwich with fries' },
    { name: 'Pasta', category: 'Meals', price: 120, description: 'Italian pasta with sauce' },
    { name: 'Salad Bowl', category: 'Meals', price: 90, description: 'Fresh mixed vegetable salad' },
    { name: 'Pizza Slice', category: 'Meals', price: 70, description: 'Cheese pizza slice' },
    
    // Fruits
    { name: 'Apple', category: 'Fruits', price: 15, description: 'Fresh red apple' },
    { name: 'Banana', category: 'Fruits', price: 12, description: 'Ripe yellow banana' },
    { name: 'Orange', category: 'Fruits', price: 18, description: 'Juicy orange' },
    
    // Dairy
    { name: 'Yogurt', category: 'Dairy', price: 35, description: 'Greek yogurt cup' },
    { name: 'Milk', category: 'Dairy', price: 25, description: 'Fresh milk bottle' },
    
    // Bakery
    { name: 'Croissant', category: 'Bakery', price: 45, description: 'Buttery croissant' },
    { name: 'Muffin', category: 'Bakery', price: 40, description: 'Blueberry muffin' }
  ];

  for (const productData of products) {
    const existingProduct = await Product.findOne({ name: productData.name });
    if (!existingProduct) {
      const product = new Product({
        ...productData,
        isAvailable: true,
        stockQuantity: Math.floor(Math.random() * 50) + 10
      });
      await product.save();
      console.log(`✅ Created product: ${productData.name}`);
    }
  }
};

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting database seeding...');
    
    await seedUsers();
    await seedProducts();
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData(); 