const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireVendor } = require('../middleware/auth');

// Middleware to require admin access
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};
const { sendPurchaseConfirmationEmail } = require('../services/emailService');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Vendors only)
router.post('/', authenticateToken, requireVendor, [
  body('employeeId').exists(),
  body('items').isArray({ min: 1 }),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    console.log('📥 Received order request:', {
      employeeId: req.body.employeeId,
      itemsCount: req.body.items?.length,
      pin: req.body.pin ? '****' : 'missing',
      vendor: req.user?.employeeId
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, items, pin } = req.body;

    // Find employee
    console.log(`🔍 Looking for employee with ID: ${employeeId}`);
    const employee = await User.findOne({ employeeId, userType: 'employee' });
    if (!employee) {
      console.error(`❌ Employee not found with ID: ${employeeId}`);
      const allEmployees = await User.find({ userType: 'employee' }).select('employeeId firstName lastName');
      console.log('📋 Available employees:', allEmployees);
      return res.status(404).json({ message: 'Employee not found' });
    }
    console.log(`✅ Found employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);

    // Verify PIN
    console.log(`🔐 Verifying PIN for employee ${employeeId}`);
    if (employee.secretPin !== pin) {
      console.error(`❌ Invalid PIN for employee ${employeeId}`);
      return res.status(400).json({ message: 'Invalid PIN' });
    }
    console.log(`✅ PIN verified for employee ${employeeId}`);

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(`💰 Order total: ₹${totalAmount}`);

    // Check budget
    const remainingBudget = employee.getRemainingBudget();
    console.log(`💳 Employee budget - Limit: ₹${employee.pantryBudget.monthlyLimit}, Spent: ₹${employee.pantryBudget.currentSpent}, Remaining: ₹${remainingBudget}`);
    
    if (remainingBudget < totalAmount) {
      console.error(`❌ Insufficient budget. Required: ₹${totalAmount}, Available: ₹${remainingBudget}`);
      return res.status(400).json({ message: 'Insufficient budget' });
    }

    // Create order
    console.log(`📦 Creating order with ${items.length} items`);
    
    // Process items and calculate totals
    const processedItems = items.map(item => {
      const productId = item.id || item._id;
      console.log(`📋 Processing item: ${item.name} (ID: ${productId})`);
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid product ID format: ${productId}`);
      }
      
      return {
        product: productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      };
    });

    const calculatedTotalItems = processedItems.reduce((sum, item) => sum + item.quantity, 0);
    const calculatedTotalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    console.log(`📊 Calculated totals - Items: ${calculatedTotalItems}, Amount: ₹${calculatedTotalAmount}`);

    // Validate employee and vendor ObjectIds
    console.log(`👤 Employee ObjectId: ${employee._id}`);
    console.log(`🏪 Vendor ObjectId: ${req.user._id}`);
    
    if (!mongoose.Types.ObjectId.isValid(employee._id)) {
      throw new Error(`Invalid employee ObjectId: ${employee._id}`);
    }
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      throw new Error(`Invalid vendor ObjectId: ${req.user._id}`);
    }

    // Generate orderId explicitly
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderId = `ORD${timestamp}${random}`;
    console.log(`🆔 Generated order ID: ${orderId}`);

    const orderData = {
      orderId: orderId, // Explicitly set orderId
      employee: employee._id,
      vendor: req.user._id,
      items: processedItems,
      totalItems: calculatedTotalItems, // Explicitly set totalItems
      totalAmount: calculatedTotalAmount, // Use calculated amount
      pinVerified: true,
      status: 'completed',
      paymentStatus: 'paid',
      completedAt: new Date()
    };

    console.log('📊 Order data structure:', JSON.stringify(orderData, null, 2));
    
    try {
      const order = new Order(orderData);
      
      // Validate the order before saving
      console.log('🔍 Validating order data...');
      const validationError = order.validateSync();
      if (validationError) {
        console.error('❌ Order validation failed:', validationError.message);
        console.error('📋 Validation errors:', validationError.errors);
        throw validationError;
      }
      
      console.log('💾 Saving order to database...');
      await order.save();
      console.log(`✅ Order saved successfully with ID: ${order.orderId}`);
      
      // Store the order reference for later use  
      var savedOrder = order;
    } catch (saveError) {
      console.error('❌ Error saving order:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('📋 Validation error details:');
        Object.keys(saveError.errors).forEach(field => {
          console.error(`  - ${field}: ${saveError.errors[field].message}`);
        });
      }
      throw saveError;
    }

    // Update employee budget and history
    console.log('💳 Updating employee budget and purchase history...');
    try {
      employee.updateBudgetAfterPurchase(totalAmount);
      console.log(`✅ Budget updated. New spent amount: ₹${employee.pantryBudget.currentSpent}`);
      
      // Add individual items to purchase history (flattened structure)
      items.forEach((item, index) => {
        console.log(`📝 Adding item ${index + 1} to purchase history: ${item.name}`);
        employee.addPurchase({
          id: savedOrder._id.toString(),
          productName: item.name,
          price: item.price,
          category: item.category,
          quantity: item.quantity,
          unit: 'piece', // Default unit
          month: new Date().toISOString().substring(0, 7), // YYYY-MM format
          purchaseDate: new Date(),
          vendorName: `${req.user.firstName} ${req.user.lastName}`,
          orderId: savedOrder.orderId,
          // Legacy fields for backward compatibility
          items: [item],
          total: item.price * item.quantity
        });
      });

          console.log('💾 Saving employee data...');
    await employee.save();
    console.log('✅ Employee data saved successfully');
  } catch (error) {
    console.error('❌ Error updating employee data:', error);
    throw error; // Re-throw to be caught by outer catch block
  }

  // Send purchase confirmation email
  try {
    console.log('📧 Sending purchase confirmation email...');
    const emailData = {
      orderId: savedOrder.orderId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      purchaseDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      totalItems: totalItems,
      total: totalAmount.toFixed(2),
      vendorName: `${req.user.firstName} ${req.user.lastName}`,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    await sendPurchaseConfirmationEmail(employee, emailData);
    console.log('✅ Purchase confirmation email sent successfully');
  } catch (emailError) {
    console.error('❌ Failed to send purchase confirmation email:', emailError);
    // Don't fail the order if email fails - just log it
  }

  res.status(201).json({
    message: 'Order created successfully',
    order: savedOrder,
    orderId: savedOrder.orderId
  });
  } catch (error) {
    console.error('Order creation error:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      message: 'Server error creating order',
      error: error.message 
    });
  }
});

// @route   POST /api/orders/direct
// @desc    Create direct order (employee self-order from menu page)
// @access  Public (with employee ID verification)
router.post('/direct', [
  body('items').isArray({ min: 1 }),
  body('totalAmount').isNumeric(),
  body('secretPin').isLength({ min: 4, max: 4 })
], async (req, res) => {
  try {
    console.log('📥 Received direct order request from menu page');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, totalAmount, employeeId, secretPin } = req.body;
    
    // Find employee by employeeId (passed in request body for menu orders)
    const employee = await User.findOne({ 
      employeeId: employeeId,
      userType: 'employee',
      isActive: true
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify secret PIN
    if (employee.secretPin !== secretPin) {
      console.log(`❌ Invalid PIN for ${employeeId}. Expected: ${employee.secretPin}, Received: ${secretPin}`);
      return res.status(400).json({ message: 'Invalid secret PIN' });
    }

    console.log(`✅ PIN verified for ${employeeId}`);
    

    console.log('💰 Checking employee budget...');
    const remainingBudget = employee.getRemainingBudget();
    console.log(`Budget check: ₹${totalAmount} requested, ₹${remainingBudget} available`);

    if (totalAmount > remainingBudget) {
      return res.status(400).json({ 
        message: `Insufficient budget. Available: ₹${remainingBudget.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}` 
      });
    }

    // Create order
    console.log('📝 Creating direct order...');
    
    // Format items with subtotal for direct orders
    const formattedItems = items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      // product field is optional for direct orders
      category: item.category || 'Food'
    }));
    
    // Calculate total items
    const totalItems = formattedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const order = new Order({
      employee: employee._id,
      vendor: null, // No vendor for direct orders
      items: formattedItems,
      totalAmount: totalAmount,
      totalItems: totalItems, // Add calculated total items
      status: 'confirmed', // Direct orders are auto-confirmed
      paymentStatus: 'paid', // Assume paid from budget
      orderType: 'direct' // Mark as direct order
    });

    console.log('💾 Saving direct order to database...');
    const savedOrder = await order.save();
    console.log(`✅ Direct order saved with ID: ${savedOrder.orderId}`);

    // Update employee budget and history
    console.log('💳 Updating employee budget and purchase history...');
    employee.updateBudgetAfterPurchase(totalAmount);
    console.log(`✅ Budget updated. New spent amount: ₹${employee.pantryBudget.currentSpent}`);
    
    // Add individual items to purchase history
    items.forEach((item, index) => {
      console.log(`📝 Adding item ${index + 1} to purchase history: ${item.name || 'Unknown item'}`);
      employee.addPurchase({
        id: savedOrder._id.toString(),
        productName: item.name || 'Direct Order Item',
        price: item.price,
        category: item.category || 'Food',
        quantity: item.quantity,
        unit: 'piece',
        month: new Date().toISOString().substring(0, 7),
        purchaseDate: new Date(),
        vendorName: 'Direct Order',
        orderId: savedOrder.orderId,
        items: [item],
        total: item.price * item.quantity
      });
    });

    console.log('💾 Saving employee data...');
    await employee.save();
    console.log('✅ Employee data saved successfully');

    res.status(201).json({
      message: 'Direct order created successfully',
      order: savedOrder,
      orderId: savedOrder.orderId
    });

  } catch (error) {
    console.error('Direct order creation error:', error);
    res.status(500).json({ 
      message: 'Server error creating direct order',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/user/:employeeId
// @desc    Get orders for a specific employee
// @access  Private
router.get('/user/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Find the user first to get their ObjectId
    const user = await User.findOne({ employeeId, userType: 'employee' });
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if the requesting user is either the employee themselves or a vendor
    if (req.user.userType === 'employee' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own orders.' });
    }
    
    // Find orders for this employee
    const orders = await Order.find({ employee: user._id })
      .populate('vendor', 'firstName lastName employeeId')
      .populate('items.product', 'name category')
      .sort({ orderDate: -1 }); // Most recent first
    
    console.log(`📦 Found ${orders.length} orders for employee ${employeeId}`);
    
    res.json({
      orders,
      totalOrders: orders.length,
      employee: {
        employeeId: user.employeeId,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      message: 'Server error fetching orders',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get orders for the currently logged-in employee
// @access  Private (Employee only)
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    if (req.user.userType !== 'employee') {
      return res.status(403).json({ message: 'Access denied. Only employees can access this endpoint.' });
    }
    
    // Find orders for the current user
    const orders = await Order.find({ employee: req.user._id })
      .populate('vendor', 'firstName lastName employeeId')
      .populate('items.product', 'name category')
      .sort({ orderDate: -1 }); // Most recent first
    
    console.log(`📦 Found ${orders.length} orders for current employee ${req.user.employeeId}`);
    
    res.json({
      orders,
      totalOrders: orders.length,
      employee: {
        employeeId: req.user.employeeId,
        name: `${req.user.firstName} ${req.user.lastName}`
      }
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ 
      message: 'Server error fetching orders',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders for admin view
// @access  Private (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Build search query
    let searchFilter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find users that match the search term (improved logic for full names)
      const searchTerms = search.trim().split(/\s+/);
      let userMatchConditions = [
        { employeeId: searchRegex } // Always search by employee ID
      ];
      
      if (searchTerms.length === 1) {
        // Single term - search in firstName, lastName, or full name
        userMatchConditions.push(
          { firstName: searchRegex },
          { lastName: searchRegex }
        );
      } else if (searchTerms.length === 2) {
        // Two terms - likely "firstName lastName"
        const firstRegex = new RegExp(searchTerms[0], 'i');
        const lastRegex = new RegExp(searchTerms[1], 'i');
        userMatchConditions.push(
          { $and: [{ firstName: firstRegex }, { lastName: lastRegex }] },
          { $and: [{ firstName: lastRegex }, { lastName: firstRegex }] }, // Handle reversed order
          { firstName: searchRegex }, // Still allow single field matches
          { lastName: searchRegex }
        );
      } else {
        // Multiple terms - search in firstName, lastName
        userMatchConditions.push(
          { firstName: searchRegex },
          { lastName: searchRegex }
        );
      }
      
      console.log('🔍 Search term:', search);
      console.log('📋 User search conditions:', JSON.stringify(userMatchConditions, null, 2));
      
      const matchingUsers = await User.find({
        $or: userMatchConditions
      }).select('_id firstName lastName employeeId');
      
      console.log('👥 Matching users found:', matchingUsers.length);
      console.log('📝 Users:', matchingUsers.map(u => `${u.firstName} ${u.lastName} (${u.employeeId})`));
      
      const matchingUserIds = matchingUsers.map(user => user._id);
      
      searchFilter = {
        $or: [
          { orderId: searchRegex },
          { 'items.name': searchRegex },
          { notes: searchRegex },
          { employee: { $in: matchingUserIds } },
          { vendor: { $in: matchingUserIds } }
        ]
      };
    }
    
    // Combine filters
    const finalFilter = { ...filter, ...searchFilter };
    
    // Build sort object
    const sortOptions = {};
    switch (sortBy) {
      case 'amount':
        sortOptions.totalAmount = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'status':
        sortOptions.status = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'date':
      default:
        sortOptions.orderDate = sortOrder === 'desc' ? -1 : 1;
        break;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get orders with pagination
    const orders = await Order.find(finalFilter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('vendor', 'firstName lastName employeeId')
      .populate('items.product', 'name category')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(finalFilter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    // Calculate summary statistics
    const allOrders = await Order.find({});
    const totalSpent = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const completedOrders = allOrders.filter(order => order.status === 'completed').length;
    const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
    
    console.log(`📊 Admin fetched ${orders.length} orders (page ${page}/${totalPages})`);
    
    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      summary: {
        totalOrders: allOrders.length,
        totalSpent,
        completedOrders,
        pendingOrders,
        averageOrderValue: allOrders.length > 0 ? totalSpent / allOrders.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ 
      message: 'Server error fetching orders',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/admin/users/:employeeId
// @desc    Get all orders for a specific user (admin view)
// @access  Private (Admin only)
router.get('/admin/users/:employeeId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Find the user first
    const user = await User.findOne({ employeeId, userType: 'employee' });
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get all orders for this user
    const orders = await Order.find({ employee: user._id })
      .populate('vendor', 'firstName lastName employeeId')
      .populate('items.product', 'name category')
      .sort({ orderDate: -1 });
    
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    console.log(`📊 Admin fetched ${orders.length} orders for employee ${employeeId}`);
    
    res.json({
      orders,
      employee: {
        employeeId: user.employeeId,
        name: `${user.firstName} ${user.lastName}`,
        department: user.department,
        totalSpent,
        totalOrders: orders.length,
        completedOrders
      }
    });
  } catch (error) {
    console.error('Error fetching user orders for admin:', error);
    res.status(500).json({ 
      message: 'Server error fetching user orders',
      error: error.message 
    });
  }
});

module.exports = router; 