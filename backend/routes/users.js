const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticateToken, requireEmployee, requireVendor } = require('../middleware/auth');

// Middleware to require admin access
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

const router = express.Router();

// @route   GET /api/users/employees
// @desc    Get all employees (for vendor search)
// @access  Private (Vendors only)
router.get('/employees', authenticateToken, requireVendor, async (req, res) => {
  try {
    const { search, department } = req.query;
    
    let query = { userType: 'employee', isActive: true };
    
    if (department) {
      query.department = department;
    }
    
    let employees = await User.find(query).select('-password -purchaseHistory');
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      employees = employees.filter(emp => 
        searchRegex.test(emp.firstName) ||
        searchRegex.test(emp.lastName) ||
        searchRegex.test(emp.employeeId) ||
        searchRegex.test(emp.department) ||
        searchRegex.test(emp.position)
      );
    }
    
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
});

// @route   GET /api/users/admin/employees
// @desc    Get all employees (for admin dashboard)
// @access  Private (Admin only)
router.get('/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Admin fetching all employees...');
    
    const employees = await User.find({ userType: 'employee', isActive: true })
      .select('employeeId firstName lastName email department position contactNumber')
      .sort({ firstName: 1, lastName: 1 });
    
    console.log(`✅ Found ${employees.length} employees for admin`);
    
    res.json({
      employees,
      count: employees.length
    });
  } catch (error) {
    console.error('❌ Error fetching employees for admin:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, (req, res) => {
  const userResponse = {
    id: req.user._id,
    employeeId: req.user.employeeId,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    userType: req.user.userType,
    department: req.user.department,
    position: req.user.position,
    contactNumber: req.user.contactNumber,
    location: req.user.location,
    pantryBudget: req.user.pantryBudget,
    purchaseHistory: req.user.purchaseHistory,
    secretPin: req.user.userType === 'employee' ? req.user.secretPin : undefined,
    isActive: req.user.isActive,
    createdAt: req.user.createdAt
  };

  res.json(userResponse);
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('contactNumber').optional().isMobilePhone(),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, contactNumber, department, position, location } = req.body;
    
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (contactNumber) updateFields.contactNumber = contactNumber;
    if (location) updateFields.location = location;
    
    // Only employees can update department and position
    if (req.user.userType === 'employee') {
      if (department) updateFields.department = department;
      if (position) updateFields.position = position;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        department: user.department,
        position: user.position,
        contactNumber: user.contactNumber,
        location: user.location,
        pantryBudget: user.pantryBudget,
        secretPin: user.userType === 'employee' ? user.secretPin : undefined
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   PUT /api/users/pin
// @desc    Update employee PIN
// @access  Private (Employees only)
router.put('/pin', authenticateToken, requireEmployee, [
  body('currentPin').isLength({ min: 4, max: 4 }).isNumeric(),
  body('newPin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPin, newPin } = req.body;

    // Verify current PIN
    if (req.user.secretPin !== currentPin) {
      return res.status(400).json({ message: 'Current PIN is incorrect' });
    }

    // Update PIN
    await User.findByIdAndUpdate(req.user._id, { secretPin: newPin });

    res.json({ message: 'PIN updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating PIN' });
  }
});

// @route   PUT /api/users/budget
// @desc    Update monthly budget limit
// @access  Private (Employees only)
router.put('/budget', authenticateToken, requireEmployee, [
  body('monthlyLimit').isFloat({ min: 0, max: 10000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { monthlyLimit } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'pantryBudget.monthlyLimit': monthlyLimit,
        'pantryBudget.lastUpdated': new Date()
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Budget limit updated successfully',
      pantryBudget: user.pantryBudget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating budget' });
  }
});

// @route   GET /api/users/purchase-history
// @desc    Get user purchase history with filtering
// @access  Private (Employees only)
router.get('/purchase-history', authenticateToken, requireEmployee, (req, res) => {
  try {
    const { month, category } = req.query;
    let purchases = req.user.purchaseHistory;

    // Filter by month
    if (month) {
      purchases = purchases.filter(purchase => {
        const purchaseMonth = new Date(purchase.purchaseDate).toISOString().slice(0, 7);
        return purchaseMonth === month;
      });
    }

    // Filter by category
    if (category && category !== 'All') {
      purchases = purchases.filter(purchase =>
        purchase.items.some(item => item.category === category)
      );
    }

    // Sort by date (newest first)
    purchases.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching purchase history' });
  }
});

// @route   POST /api/users/admin/vendors
// @desc    Create a new vendor (Admin only)
// @access  Private (Admin only)
router.post('/admin/vendors', 
  authenticateToken, 
  requireAdmin,
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('department').optional(),
    body('position').optional(),
    body('contactNumber').optional(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        firstName,
        lastName,
        email,
        employeeId,
        password,
        department,
        position,
        contactNumber
      } = req.body;

      // Check if user already exists with this email or employeeId
      const existingUser = await User.findOne({
        $or: [{ email }, { employeeId }]
      });

      if (existingUser) {
        return res.status(400).json({
          message: existingUser.email === email 
            ? 'User with this email already exists'
            : 'User with this employee ID already exists'
        });
      }

      // Create vendor user (password will be hashed by User model's pre-save hook)
      const newVendor = new User({
        firstName,
        lastName,
        email,
        employeeId,
        password: password, // Don't hash here - let the model handle it
        userType: 'vendor',
        department: department || 'Food Services',
        position: position || 'Vendor',
        contactNumber: contactNumber || '0000000000', // Use contactNumber or default
        isActive: true,
        pantryBudget: 0, // Vendors don't have budgets
        purchaseHistory: []
      });

      await newVendor.save();

      // Return vendor info without password
      const vendorResponse = {
        _id: newVendor._id,
        firstName: newVendor.firstName,
        lastName: newVendor.lastName,
        email: newVendor.email,
        employeeId: newVendor.employeeId,
        userType: newVendor.userType,
        department: newVendor.department,
        position: newVendor.position,
        contactNumber: newVendor.contactNumber,
        isActive: newVendor.isActive,
        createdAt: newVendor.createdAt
      };

      res.status(201).json({
        message: 'Vendor created successfully',
        vendor: vendorResponse
      });

    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ message: 'Server error creating vendor' });
    }
  }
);

// @route   GET /api/users/admin/vendors
// @desc    Get all vendors (Admin only)
// @access  Private (Admin only)
router.get('/admin/vendors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const vendors = await User.find({ userType: 'vendor' })
      .select('-password -purchaseHistory')
      .sort({ createdAt: -1 });

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Server error fetching vendors' });
  }
});

// @route   GET /api/users/search/:employeeId
// @desc    Search employee by ID (public access for menu page)
// @access  Public
router.get('/search/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find employee by employeeId (case-insensitive)
    const employee = await User.findOne({ 
      employeeId: { $regex: new RegExp(`^${employeeId}$`, 'i') },
      userType: 'employee',
      isActive: true
    }).select('-password -purchaseHistory');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error searching employee:', error);
    res.status(500).json({ message: 'Server error searching employee' });
  }
});

module.exports = router; 