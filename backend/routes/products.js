const express = require('express');
const Product = require('../models/Product');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = { isAvailable: true };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    let products = await Product.find(query).populate('vendor', 'firstName lastName employeeId');
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      products = products.filter(product =>
        searchRegex.test(product.name) ||
        searchRegex.test(product.description)
      );
    }
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// @route   GET /api/products/categories
// @desc    Get available categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('vendor', 'firstName lastName employeeId');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    console.error('Error fetching product by id:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const {
      name,
      category,
      price,
      description,
      stockQuantity,
      nutritionalInfo,
      allergens,
      vendor,
      imageUrl,
      isAvailable
    } = req.body;

    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    // Validate category
    const validCategories = ['Snacks', 'Beverages', 'Meals', 'Fruits', 'Dairy', 'Bakery'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Create new product
    const productData = {
      name: name.trim(),
      category,
      price: parseFloat(price),
      description: description?.trim(),
      stockQuantity: stockQuantity || 0,
      allergens: allergens || [],
      imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    };

    // Only add vendor if it's provided and not empty
    if (vendor && vendor.trim() !== '') {
      productData.vendor = vendor;
    }

    // Only add nutritional info if it has values
    if (nutritionalInfo && Object.values(nutritionalInfo).some(value => value !== undefined && value !== null && value !== '')) {
      productData.nutritionalInfo = nutritionalInfo;
    }

    const product = new Product(productData);

    const savedProduct = await product.save();
    await savedProduct.populate('vendor', 'firstName lastName employeeId');

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error creating product' });
    }
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Sanitize fields
    if (Object.prototype.hasOwnProperty.call(updateData, 'name') && typeof updateData.name === 'string') {
      updateData.name = updateData.name.trim();
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'category') && typeof updateData.category === 'string') {
      updateData.category = updateData.category.trim();
      const validCategories = ['Snacks', 'Beverages', 'Meals', 'Fruits', 'Dairy', 'Bakery'];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'price')) {
      const priceNum = Number(updateData.price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: 'Invalid price' });
      }
      updateData.price = priceNum;
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'stockQuantity')) {
      const qty = Number(updateData.stockQuantity);
      if (Number.isNaN(qty) || qty < 0) {
        return res.status(400).json({ message: 'Invalid stockQuantity' });
      }
      updateData.stockQuantity = qty;
    }
    // Prevent ObjectId cast error if vendor is empty string
    if (Object.prototype.hasOwnProperty.call(updateData, 'vendor') && (updateData.vendor === '' || updateData.vendor === null)) {
      delete updateData.vendor;
    }

    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('vendor', 'firstName lastName employeeId');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'CastError') {
      if (error.path === '_id') {
        return res.status(400).json({ message: 'Invalid product id' });
      }
      if (error.path === 'vendor') {
        return res.status(400).json({ message: 'Invalid vendor id' });
      }
      return res.status(400).json({ message: 'Invalid field value' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product deleted successfully',
      product: deletedProduct
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router; 