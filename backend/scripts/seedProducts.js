const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dine-tech';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const products = [
  {
    name: "Organic Apples",
    category: "Fruits",
    price: 4.99,
    description: "Fresh organic red apples",
    isAvailable: true,
    stockQuantity: 50
  },
  {
    name: "Greek Yogurt",
    category: "Dairy",
    price: 1.75,
    description: "Plain Greek yogurt, high protein",
    isAvailable: true,
    stockQuantity: 30
  },
  {
    name: "Whole Grain Bread",
    category: "Bakery",
    price: 3.25,
    description: "100% whole grain bread",
    isAvailable: true,
    stockQuantity: 25
  },
  {
    name: "Coffee Beans",
    category: "Beverages",
    price: 12.99,
    description: "Premium dark roast coffee beans",
    isAvailable: true,
    stockQuantity: 40
  },
  {
    name: "Mixed Nuts",
    category: "Snacks",
    price: 8.75,
    description: "Assorted mixed nuts",
    isAvailable: true,
    stockQuantity: 35
  },
  {
    name: "Sparkling Water",
    category: "Beverages",
    price: 0.99,
    description: "Natural sparkling water",
    isAvailable: true,
    stockQuantity: 100
  },
  {
    name: "Bananas",
    category: "Fruits",
    price: 2.50,
    description: "Fresh yellow bananas",
    isAvailable: true,
    stockQuantity: 60
  },
  {
    name: "Protein Bars",
    category: "Snacks",
    price: 1.50,
    description: "Chocolate protein bars",
    isAvailable: true,
    stockQuantity: 45
  },
  {
    name: "Cheese Sticks",
    category: "Dairy",
    price: 0.75,
    description: "Mozzarella cheese sticks",
    isAvailable: true,
    stockQuantity: 80
  },
  {
    name: "Green Tea",
    category: "Beverages",
    price: 7.25,
    description: "Organic green tea bags",
    isAvailable: true,
    stockQuantity: 20
  },
  {
    name: "Avocados",
    category: "Fruits",
    price: 1.50,
    description: "Fresh ripe avocados",
    isAvailable: true,
    stockQuantity: 40
  },
  {
    name: "Almond Milk",
    category: "Dairy",
    price: 4.50,
    description: "Unsweetened almond milk",
    isAvailable: true,
    stockQuantity: 25
  },
  {
    name: "Energy Bars",
    category: "Snacks",
    price: 2.25,
    description: "Natural energy bars",
    isAvailable: true,
    stockQuantity: 30
  },
  {
    name: "Herbal Tea",
    category: "Beverages",
    price: 8.99,
    description: "Chamomile herbal tea",
    isAvailable: true,
    stockQuantity: 15
  },
  {
    name: "Fresh Sandwich",
    category: "Meals",
    price: 6.50,
    description: "Pre-made fresh sandwich",
    isAvailable: true,
    stockQuantity: 20
  },
  {
    name: "Orange Juice",
    category: "Beverages",
    price: 3.75,
    description: "Fresh squeezed orange juice",
    isAvailable: true,
    stockQuantity: 35
  },
  {
    name: "Croissant",
    category: "Bakery",
    price: 2.99,
    description: "Buttery croissant",
    isAvailable: true,
    stockQuantity: 20
  },
  {
    name: "Fresh Berries",
    category: "Fruits",
    price: 4.25,
    description: "Mixed fresh berries",
    isAvailable: true,
    stockQuantity: 25
  }
];

async function seedProducts() {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');

    // Insert new products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${createdProducts.length} products`);
    
    // Display the products
    console.log('\n📦 Seeded Products:');
    createdProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.category}) - ₹${product.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

seedProducts(); 