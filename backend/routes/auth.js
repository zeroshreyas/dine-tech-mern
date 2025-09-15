const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

app.use((ret, res) => {
  res.status(200).send("return getting")
})

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('contactNumber').isMobilePhone(),
  body('userType').isIn(['employee', 'vendor']),
  body('secretPin').optional().isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      userType, 
      department, 
      position, 
      contactNumber, 
      location,
      secretPin 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate employee ID
    const userCount = await User.countDocuments();
    const employeeId = `EMP${String(userCount + 1).padStart(3, '0')}`;

    // Create new user
    const userData = {
      employeeId,
      email,
      password,
      firstName,
      lastName,
      userType,
      contactNumber,
      location
    };

    if (userType === 'employee') {
      userData.department = department;
      userData.position = position;
      userData.secretPin = secretPin || Math.floor(1000 + Math.random() * 9000).toString();
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userResponse = {
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
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    console.log('🚀 Login request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('🔍 Looking for user with email:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', { 
      id: user._id, 
      email: user.email, 
      userType: user.userType,
      isActive: user.isActive 
    });

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    console.log('🔐 Checking password for user:', user.email);
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('✅ Password valid for user:', user.email);

    // Generate token
    console.log('🎫 Generating token for user:', user._id);
    const token = generateToken(user._id);
    console.log('✅ Token generated successfully');

    // Return user data without password
    const userResponse = {
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
      purchaseHistory: user.purchaseHistory,
      secretPin: user.userType === 'employee' ? user.secretPin : undefined
    };

    console.log('🎉 Login successful for user:', user.email);
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, (req, res) => {
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
    secretPin: req.user.userType === 'employee' ? req.user.secretPin : undefined
  };

  res.json(userResponse);
});

// @route   POST /api/auth/verify-pin
// @desc    Verify employee PIN
// @access  Private
router.post('/verify-pin', authenticateToken, [
  body('employeeId').exists(),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, pin } = req.body;

    // Find employee
    const employee = await User.findOne({ employeeId, userType: 'employee' });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify PIN
    if (employee.secretPin !== pin) {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    res.json({ message: 'PIN verified successfully', verified: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during PIN verification' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send password reset email
    try {
      const emailResult = await sendPasswordResetEmail(user, resetToken);
      console.log(`✅ Password reset email sent to ${user.email}`);
      
      // If using test email service, log the preview URL
      if (emailResult.previewUrl) {
        console.log('📧 Preview email: %s', emailResult.previewUrl);
      }
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Still return success for security (don't reveal if email exists)
      // But log the actual error for debugging
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    user.password = password; // Will be hashed by pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

module.exports = router; 