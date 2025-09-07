# Dine Tech - Professional Workplace Food Order Management

To run in local
# Clone the repository
clone <repository-url>

# Navigate to the project directory
cd Dine-Tech

# Install dependencies
npm install

# Start the development server
npm run dev

**Open your browser:**
   - The application will be available at: `http://localhost:5173`
   - The terminal will show the exact URL
```

If more instructions required to run see below:

A comprehensive employee pantry management system built with React and Vite. This application enables employees to manage their food budgets, view purchase history, and allows vendors to process orders with secure PIN verification.

## 🚀 Features

- **Employee Dashboard**: Budget management, purchase history, profile settings
- **Vendor Interface**: Employee search, product ordering, secure PIN verification
- **Payment Integration**: Net banking simulation for budget top-ups
- **Real-time Updates**: Budget tracking and transaction history
- **Email Notifications**: Purchase confirmations and order details
- **Mobile Responsive**: Optimized for all device sizes
- **Interactive Flowchart**: Visual system workflow guide

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (version 16.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`
- **Git** (optional, for cloning)
  - Download from: https://git-scm.com/

## 🛠️ Installation & Setup

### Option 1: Clone the Repository
```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd Dine-Tech

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Option 2: Download and Setup
```bash

## 🚀 Running the Application

1. **Navigate to the correct directory:**
   ```bash
   cd Dine-Tech
   ```

2. **Install dependencies (first time only):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The application will be available at: `http://localhost:5173`
   - The terminal will show the exact URL

5. **To stop the application:**
   - Press `Ctrl + C` in the terminal

## 🔐 Demo Credentials

### Employee Access
- **Email:** `john.smith@company.com`
- **Password:** `password123`
- **Features:** Budget management, purchase history, profile settings, payment integration

### Vendor Access
- **Email:** `alice.vendor@company.com`
- **Password:** `vendor123`
- **Features:** Employee search, product ordering, PIN verification

### Employee PINs (for vendor orders)
- **John Smith:** `1234`
- **Sarah Johnson:** `5678`
- **Michael Brown:** `9012`

## 📱 Application Structure

### Login Page
- **Login Tab**: User authentication form
- **System Flow Tab**: Interactive flowchart showing system workflow

### Employee Dashboard
- **💰 Budget**: View and manage monthly pantry budget
- **💳 Add Funds**: Net banking integration for budget top-ups
- **📦 Purchases**: Purchase history with filtering options
- **👤 Profile**: Personal information and PIN management

### Vendor Interface
- **Employee Search**: Find employees by name, ID, or department
- **Product Selection**: Browse and add items to cart
- **PIN Verification**: Secure order authorization
- **Order Processing**: Complete transactions with email notifications

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Technical Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS3 with custom components
- **State Management**: React Hooks (useState, useEffect)
- **Icons**: Emoji-based iconography
- **Responsive**: Mobile-first design approach

## 📊 System Workflow

1. **User Login**: Authentication with role-based access
2. **Employee Flow**: Budget management → Purchase history → Profile settings
3. **Vendor Flow**: Employee search → Product selection → PIN verification → Order completion
4. **Integration**: Real-time budget updates → Email notifications → Transaction logging

## 🔧 Troubleshooting

### Common Issues

**1. "npm run dev" not working:**
```bash
# Make sure you're in the correct directory
cd Dine-Tech
# Try installing dependencies again
npm install
```

**2. Port already in use:**
```bash
# Kill the process using the port
npx kill-port 5173
# Or use a different port
npm run dev -- --port 3000
```

**3. Module not found errors:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. Browser not opening automatically:**
- Manually navigate to `http://localhost:5173`
- Check terminal for the correct URL

## 🌐 Browser Compatibility

- **Recommended**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet

## 📁 Project Structure

```
Dine-Tech/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── BudgetManager.jsx
│   │   ├── Payment.jsx
│   │   └── Vendor.jsx
│   ├── services/          # Service utilities
│   │   └── emailService.js
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application styles
│   ├── main.jsx           # Application entry point
│   ├── users.json         # Mock user database
│   └── products.json      # Product catalog
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes.

## 📞 Support

For setup issues or questions:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Verify you're in the correct directory (`Dine-Tech`)
4. Try clearing cache and reinstalling dependencies

---

**Happy Coding! 🎉**
