const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback - submit feedback (employee)
router.post('/', authenticateToken, [
  body('message').isString().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('category').optional().isString(),
  body('vendorName').optional().isString(),
  body('orderId').optional().isString(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('contactInfo').optional().isString().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const feedback = new Feedback({
      employeeId: user.employeeId,
      user: user._id,
      category: req.body.category || 'Other',
      vendorName: req.body.vendorName || '',
      orderId: req.body.orderId || '',
      rating: req.body.rating,
      message: req.body.message.trim(),
      contactInfo: req.body.contactInfo || ''
    });

    const saved = await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: saved });
  } catch (error) {
    console.error('Feedback submit error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// POST /api/feedback/public - submit feedback (no auth)
router.post('/public', [
  body('message').isString().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('category').optional().isString(),
  body('vendorName').optional().isString(),
  body('orderId').optional().isString(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('employeeId').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('contactInfo').optional().isString().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const feedback = new Feedback({
      employeeId: req.body.employeeId || 'GUEST',
      user: undefined,
      category: req.body.category || 'Other',
      vendorName: req.body.vendorName || '',
      orderId: req.body.orderId || '',
      rating: req.body.rating,
      message: req.body.message.trim(),
      contactInfo: req.body.contactInfo || ''
    });

    const saved = await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: saved });
  } catch (error) {
    console.error('Public feedback submit error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// GET /api/feedback/my - my feedbacks (employee)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
});

// GET /api/feedback/admin/all - list all feedback (admin only)
router.get('/admin/all', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
], async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.category) filters.category = req.query.category;

    const search = (req.query.search || '').trim();
    const searchFilter = search ? {
      $or: [
        { message: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { contactInfo: { $regex: search, $options: 'i' } },
      ]
    } : {};

    const queryObj = Object.keys(searchFilter).length ? { $and: [filters, searchFilter] } : filters;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(queryObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(queryObj)
    ]);

    res.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasPrev: page > 1,
        hasNext: page * limit < total
      }
    });
  } catch (error) {
    console.error('Admin feedback fetch error:', error);
    res.status(500).json({ message: 'Server error fetching feedback list' });
  }
});

module.exports = router; 