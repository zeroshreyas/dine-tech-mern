# 📊 Sample Data & Database Seeding Guide

This guide explains how to use the comprehensive sample data files and seeding commands to quickly set up your Dine Tech application with realistic data.

## 📁 Sample Data Files

The sample data is organized in JSON files located in `backend/data/`:

### 🗂️ Data Structure

```
backend/data/
├── users.sample.json      # 12 users (employees, vendors, admin)
├── products.sample.json   # 27 products across 6 categories
├── orders.sample.json     # 16 orders with realistic transaction history
└── payments.sample.json   # 11 payments with different methods & statuses
```

### 👥 Users Sample Data (12 users)

**Employees (8 users):**
- John Smith (Engineering) - john.smith@company.com / password123 (PIN: 1234)
- Sarah Johnson (Marketing) - sarah.johnson@company.com / password123 (PIN: 5678)
- Michael Brown (Finance) - michael.brown@company.com / password123 (PIN: 9012)
- Emily Davis (HR) - emily.davis@company.com / password123 (PIN: 3456)
- David Wilson (Finance Director) - david.wilson@company.com / password123 (PIN: 7890)
- Lisa Anderson (Design) - lisa.anderson@company.com / password123 (PIN: 2468)
- James Taylor (DevOps) - james.taylor@company.com / password123 (PIN: 1357)
- Amanda Martinez (Sales) - amanda.martinez@company.com / password123 (PIN: 9753)

**Vendors (2 users):**
- Alice Vendor (Kitchen Main) - alice.vendor@company.com / vendor123
- Bob Martinez (Kitchen West) - bob.martinez@company.com / vendor123

**Admin (1 user):**
- System Administrator - admin@dinetech.com / admin123

### 🛍️ Products Sample Data (27 products)

**Categories & Items:**
- **Snacks (4 items):** Chocolate Chip Cookies, Potato Chips, Mixed Nuts, Granola Bar
- **Beverages (5 items):** Coffee, Tea, Orange Juice, Mineral Water, Green Tea
- **Meals (5 items):** Sandwich, Pasta, Salad Bowl, Pizza Slice, Grilled Chicken Bowl
- **Fruits (5 items):** Apple, Banana, Orange, Mixed Berries, Avocado
- **Dairy (4 items):** Yogurt, Milk, Cheese Sticks, Cottage Cheese
- **Bakery (4 items):** Croissant, Muffin, Whole Grain Bread, Bagel

**Features:**
- Realistic pricing (₹12 - ₹140)
- Stock quantities (15-120 items)
- Nutritional information (calories, protein, carbs, fat)
- Allergen information (gluten, dairy, nuts, etc.)

### 📦 Orders Sample Data (16 orders)

**Order Types:**
- 15 completed orders with purchase history
- 1 pending order for testing
- Realistic order values (₹25 - ₹240)
- PIN verification status
- Order notes and timestamps

### 💳 Payments Sample Data (11 payments)

**Payment Methods:**
- Net Banking (SBI, HDFC, ICICI, Axis)
- Razorpay integration
- Card payments
- Digital wallets

**Payment Statuses:**
- 8 completed payments
- 1 failed payment
- 1 processing payment
- 1 pending payment

## 🚀 Seeding Commands

### Quick Start (Recommended)

```bash
# Navigate to backend directory
cd dine-tech-mern/backend

# Full database seeding with all sample data
npm run seed:full
```

This command will:
1. ✅ Clear all existing data
2. 👥 Seed 12 users (employees, vendors, admin)
3. 🛍️ Seed 27 products across 6 categories
4. 📦 Seed 16 orders with realistic data
5. 💳 Seed 11 payments with various methods
6. 📊 Display comprehensive statistics

### Individual Seeding Commands

```bash
# Seed only users
npm run seed:users

# Seed only products
npm run seed:products

# Seed only orders (requires users to exist)
npm run seed:orders

# Seed only payments (requires users to exist)
npm run seed:payments

# Legacy seeding (basic data only)
npm run seed
```

### Seeding Output Example

```
🚀 Starting comprehensive database seeding from sample files...
📁 Loading data from: backend/data/ directory

🌱 Seeding users from sample data...
🗑️ Cleared existing users
✅ Created user: John Smith (employee)
✅ Created user: Sarah Johnson (employee)
...
🎉 Successfully seeded 12 users

🌱 Seeding products from sample data...
🗑️ Cleared existing products
🎉 Successfully seeded 27 products

📦 Products by Category:
  Snacks: 4 items
    - Chocolate Chip Cookies (₹25)
    - Potato Chips (₹15)
    ...

🌱 Seeding orders from sample data...
🗑️ Cleared existing orders
✅ Created order: ORD1641234567001 (completed)
...
🎉 Successfully seeded 16 orders

📊 Order Statistics:
  Total Orders: 16
  Completed: 15
  Pending: 1
  Total Value: ₹1425

🌱 Seeding payments from sample data...
🗑️ Cleared existing payments
✅ Created payment: PAY1641234567001 (₹500 - completed)
...
🎉 Successfully seeded 11 payments

💳 Payment Statistics:
  Total Payments: 11
  Completed: 8
  Total Amount: ₹3480
  Payment Methods: net_banking, card, razorpay, wallet

🎉 Database seeding completed successfully!
📊 Summary:
  - Users: 12
  - Products: 27
  - Orders: 16
  - Payments: 11

🔑 Demo Credentials:
  Employee: john.smith@company.com / password123 (PIN: 1234)
  Vendor: alice.vendor@company.com / vendor123
  Admin: admin@dinetech.com / admin123
```

## 🛠️ Setup Instructions

### 1. Prerequisites

```bash
# Ensure MongoDB is running
# Windows: mongod
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Ensure environment is configured
cd dine-tech-mern/backend
cp env.example .env
# Edit .env with your settings
```

### 2. Install Dependencies

```bash
cd dine-tech-mern/backend
npm install
```

### 3. Seed the Database

```bash
# Full seeding (recommended)
npm run seed:full
```

### 4. Start the Application

```bash
# Start backend
npm run dev

# Start frontend (in new terminal)
cd ../frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

## 🎯 Testing Different User Types

### Employee Testing
```
Email: john.smith@company.com
Password: password123
PIN: 1234
Features: Budget management, purchase history, payments
```

### Vendor Testing
```
Email: alice.vendor@company.com
Password: vendor123
Features: Employee search, order processing, PIN verification
```

### Admin Testing
```
Email: admin@dinetech.com
Password: admin123
Features: User management, system administration, analytics
```

## 📊 Data Relationships

The sample data is carefully designed with realistic relationships:

1. **Users ↔ Orders:** Orders reference actual users as employees and vendors
2. **Users ↔ Payments:** Payments belong to specific employees
3. **Users ↔ Purchase History:** Embedded purchase records in user documents
4. **Orders ↔ Products:** Order items reference product catalog
5. **Consistent Timestamps:** All dates are realistic and properly sequenced

## 🔧 Customizing Sample Data

### Adding New Users
Edit `backend/data/users.sample.json`:
```json
{
  "employeeId": "EMP009",
  "email": "new.user@company.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "userType": "employee",
  "department": "IT",
  "position": "Developer",
  "contactNumber": "+1-555-0131",
  "location": "Remote",
  "isActive": true,
  "secretPin": "4567",
  "pantryBudget": {
    "monthlyLimit": 400,
    "currentSpent": 0,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  },
  "purchaseHistory": []
}
```

### Adding New Products
Edit `backend/data/products.sample.json`:
```json
{
  "name": "New Product",
  "category": "Snacks",
  "price": 30,
  "description": "Description here",
  "isAvailable": true,
  "stockQuantity": 50,
  "nutritionalInfo": {
    "calories": 150,
    "protein": 5,
    "carbs": 20,
    "fat": 8
  },
  "allergens": ["gluten"]
}
```

## 🚨 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh
# or
mongo

# If connection fails, start MongoDB:
# Windows: mongod
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Seeding Errors
```bash
# Clear database manually if needed
mongosh
use dine-tech
db.dropDatabase()

# Then re-run seeding
npm run seed:full
```

### Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📈 Benefits of Sample Data

1. **Instant Demo:** Ready-to-use application with realistic data
2. **Testing:** Multiple user types and scenarios for thorough testing
3. **Development:** No need to manually create test data
4. **Presentations:** Professional-looking data for demos
5. **Learning:** Understanding data relationships and structure

## 🔄 Updating Sample Data

When you modify the sample JSON files:

```bash
# Re-seed with updated data
npm run seed:full
```

The seeding script will:
- Clear existing data
- Load fresh data from JSON files
- Validate relationships
- Display comprehensive statistics

---

**🎉 You're all set!** Your Dine Tech application now has comprehensive sample data and you can start exploring all features immediately. 