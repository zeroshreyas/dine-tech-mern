import { useState, useEffect, useRef } from 'react'
import { usersAPI, productsAPI, feedbackAPI, tokenUtils } from '../services/api'

function Menu() {
  const [employeeId, setEmployeeId] = useState('')
  const [budgetData, setBudgetData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [addedToCartMessage, setAddedToCartMessage] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [orderNotification, setOrderNotification] = useState('')
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false)
  const [secretKey, setSecretKey] = useState('')
  const [secretKeyError, setSecretKeyError] = useState('')
  const [validatedSecretPin, setValidatedSecretPin] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const cartRef = useRef(null)

  // Feedback local state
  const [fbForm, setFbForm] = useState({ category: 'Food Quality', rating: 5, vendorName: '', message: '', contactInfo: '' })
  const [fbLoading, setFbLoading] = useState(false)
  const [fbError, setFbError] = useState('')
  const [fbSuccess, setFbSuccess] = useState('')
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const feedbackSectionRef = useRef(null)
  const [fbCols, setFbCols] = useState(typeof window !== 'undefined' && window.innerWidth <= 768 ? 1 : 3)

  const isAuthenticated = tokenUtils?.isAuthenticated?.() || false

  useEffect(() => {
    const onResize = () => {
      setFbCols(window.innerWidth <= 768 ? 1 : 3)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleFbChange = (e) => {
    const { name, value } = e.target
    setFbForm(prev => ({ ...prev, [name]: value }))
    if (fbError) setFbError('')
    if (fbSuccess) setFbSuccess('')
  }

  const submitFeedback = async (e) => {
    e.preventDefault()
    if (!fbForm.message || fbForm.message.trim().length < 10) {
      setFbError('Please provide at least 10 characters in the message')
      return
    }
    try {
      setFbLoading(true)
      setFbError('')
      setFbSuccess('')
      await (tokenUtils.isAuthenticated() ? feedbackAPI.submit : feedbackAPI.submitPublic)({
        category: fbForm.category,
        vendorName: fbForm.vendorName.trim(),
        rating: Number(fbForm.rating),
        message: fbForm.message.trim(),
        contactInfo: (fbForm.contactInfo || '').trim(),
      })
      setFbSuccess('Thank you! Your feedback has been submitted.')
      setOrderNotification('🎉 Thank you! Your feedback has been submitted.')
      setFbForm({ category: 'Food Quality', rating: 5, vendorName: '', message: '', contactInfo: '' })
      // Hide form after 3 seconds (allow user to see notification)
      setTimeout(() => setShowFeedbackForm(false), 3000)
      // Auto-hide success and notification after 3 seconds
      setTimeout(() => setFbSuccess(''), 3000)
      setTimeout(() => setOrderNotification(''), 3000)
    } catch (err) {
      setFbError(err.message || 'Failed to submit feedback')
    } finally {
      setFbLoading(false)
    }
  }

  // Helper function to get category icons
  const getCategoryIcon = (category) => {
    const icons = {
      'Snacks': '🍿',
      'Beverages': '🥤',
      'Meals': '🍽️',
      'Fruits': '🍎',
      'Dairy': '🥛',
      'Bakery': '🥖'
    }
    return icons[category] || '🍴'
  }

  // Helper function to get unique categories from products
  const getUniqueCategories = () => {
    const categories = products.reduce((acc, product) => {
      if (product.category && !acc.find(cat => cat.name === product.category)) {
        const categoryProducts = products.filter(p => p.category === product.category)
        acc.push({
          name: product.category,
          icon: getCategoryIcon(product.category),
          count: categoryProducts.length,
          averagePrice: Math.round(categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length)
        })
      }
      return acc
    }, [])
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Helper function to get filtered products based on selected category
  const getFilteredProducts = () => {
    if (!selectedCategory) {
      return products
    }
    return products.filter(product => product.category === selectedCategory)
  }

  // Handler for category selection
  const handleCategoryClick = (categoryName) => {
    if (selectedCategory === categoryName) {
      // If same category is clicked, show all products
      setSelectedCategory(null)
    } else {
      // Filter by selected category
      setSelectedCategory(categoryName)
    }
  }

  // Handler to clear category filter
  const clearCategoryFilter = () => {
    setSelectedCategory(null)
  }

  // Handle click outside cart to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target) && showCart) {
        setShowCart(false)
      }
    }

    // Add event listener when cart is open
    if (showCart) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCart])

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        const allProducts = await productsAPI.getProducts()
        setProducts(allProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
        setError('Failed to load menu items')
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleEmployeeSearch = async (e) => {
    e.preventDefault()
    if (!employeeId.trim()) {
      setError('Please enter an employee ID')
      return
    }

    try {
      setLoading(true)
      setError('')
      setOrderNotification('') // Clear any existing order notification
      
      // Convert employee ID to uppercase and search
      const searchId = employeeId.trim().toUpperCase()
      const response = await fetch(`https://dine-tech-mern.onrender.com/api/users/search/${searchId}`)
      
      if (!response.ok) {
        throw new Error('Employee not found')
      }
      
      const employee = await response.json()
      setBudgetData(employee)
      
    } catch (error) {
      console.error('Error fetching employee data:', error)
      setError(error.message || 'Employee not found. Please check the ID and try again.')
      setBudgetData(null)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setEmployeeId('')
    setBudgetData(null)
    setError('')
    setCart([])
    setShowCart(false)
    setOrderNotification('') // Clear notification when clearing search
  }

  const dismissNotification = () => {
    setOrderNotification('')
  }

  const closeSecretKeyModal = () => {
    setShowSecretKeyModal(false)
    setSecretKey('')
    setSecretKeyError('')
  }

  const addToCart = (item) => {
    if (!budgetData) {
      setError('Please search for your employee ID first')
      return
    }

    const existingItem = cart.find(cartItem => cartItem.name === item.name)
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.name === item.name
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }

    // Show added to cart message
    setAddedToCartMessage(`${item.name} added to cart!`)
    setTimeout(() => setAddedToCartMessage(''), 2000)
  }

  const removeFromCart = (itemName) => {
    setCart(cart.filter(item => item.name !== itemName))
  }

  const updateQuantity = (itemName, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemName)
    } else {
      setCart(cart.map(item =>
        item.name === itemName
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    const totalAmount = getTotalAmount()
    const remainingBudget = (budgetData.pantryBudget?.monthlyLimit || 0) - (budgetData.pantryBudget?.currentSpent || 0)

    if (totalAmount > remainingBudget) {
      setError(`Insufficient budget. Available: ₹${remainingBudget.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}`)
      return
    }

    // Show secret key modal before proceeding
    setShowSecretKeyModal(true)
    setSecretKey('')
    setSecretKeyError('')
  }

  const handleSecretKeySubmit = async () => {
    if (!secretKey.trim()) {
      setSecretKeyError('Please enter the secret PIN')
      return
    }

    const trimmedPin = secretKey.trim()
    
    // Validate PIN format
    if (trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
      setSecretKeyError('PIN must be exactly 4 digits')
      return
    }

    console.log('🔐 PIN submitted and validated:', trimmedPin)
    
    // Pass the PIN directly to processOrder instead of setting state first
    setShowSecretKeyModal(false)
    setSecretKeyError('')
    
    // Continue with the original checkout logic, passing PIN directly
    await processOrder(trimmedPin)
  }

  const processOrder = async (directPin = null) => {
    const totalAmount = getTotalAmount()
    
    // Use the directly passed PIN or fall back to state
    const pinToUse = directPin || validatedSecretPin
    
    console.log('📦 Starting order process:', {
      directPin: directPin ? '****' : 'not provided',
      validatedSecretPin: validatedSecretPin ? '****' : 'not set',
      pinToUse: pinToUse ? '****' : 'missing',
      employeeId: budgetData.employeeId
    })

    if (!pinToUse) {
      setError('Secret PIN is required. Please try again.')
      setShowSecretKeyModal(true)
      return
    }

    try {
      setOrderLoading(true)
      setError('')

      // Create order items in the format expected by the backend
      const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: 'Food' // Default category for menu items
      }))

      // Create order data with employee ID and secret PIN
      const orderData = {
        items: orderItems,
        totalAmount: totalAmount,
        employeeId: budgetData.employeeId,
        secretPin: pinToUse // Use the PIN passed directly or from state
      }

      console.log('📦 Sending order data:', { 
        ...orderData, 
        secretPin: '****',
        actualPinLength: pinToUse.length,
        pinType: typeof pinToUse
      })

      // Make API call to create direct order
      const response = await fetch('https://dine-tech-mern.onrender.com/api/orders/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Order failed:', errorData)
        throw new Error(errorData.message || 'Failed to place order')
      }

      const result = await response.json()
      console.log('✅ Order successful:', { orderId: result.orderId })
      
      // Show success notification (persistent until dismissed)
      setOrderNotification(`Order placed successfully! Order ID: ${result.orderId}`)
      
      // Clear cart and close sidebar
      setCart([])
      setShowCart(false)
      
      // Store the validated PIN for future use in this session
      setValidatedSecretPin(pinToUse)
      
      // Scroll to top to show the order notification
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      
      // Refresh employee budget data to show updated spending
      const updatedEmployee = await fetch(`https://dine-tech-mern.onrender.com/api/users/search/${budgetData.employeeId}`)
      if (updatedEmployee.ok) {
        const updatedData = await updatedEmployee.json()
        setBudgetData(updatedData)
      }

    } catch (error) {
      console.error('Error placing order:', error)
      setError(error.message || 'Failed to place order. Please try again.')
      
      // If it's a PIN error, clear the validated PIN and show modal again
      if (error.message && error.message.toLowerCase().includes('pin')) {
        setValidatedSecretPin('') // Clear the stored PIN
        setSecretKey('') // Clear the input field
        setShowSecretKeyModal(true) // Show the modal again
        setSecretKeyError('Invalid PIN. Please try again.')
      }
    } finally {
      setOrderLoading(false)
    }
  }

  return (
    <div className="menu-page-container">
      <div className="menu-page-header">
        <h3>📝 How to Order:</h3>
        <ol className="simple-order-list">
          <li>Enter your Employee ID below to view your budget</li>
          <li>Browse our menu and add items to your cart</li>
          <li>Review your order and proceed to checkout</li>
          <li>Enter your 4-digit secret PIN to confirm your order</li>
        </ol>
        
        {addedToCartMessage && (
          <div className="added-to-cart-message">
            ✅ {addedToCartMessage}
          </div>
        )}
        
        {orderNotification && (
          <div className="order-notification">
            <span className="notification-content">
              🎉 {orderNotification}
            </span>
            <button 
              className="notification-close-btn"
              onClick={dismissNotification}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Employee Budget Search */}
      <div className="budget-search-section">
        <h2>🔍 Search Employee</h2>
        <p>Enter your employee ID to view your current pantry budget:</p>
        
        <form onSubmit={handleEmployeeSearch} className="budget-search-form">
          <div className="search-input-group">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleEmployeeSearch(e)
                  }
                }}
                placeholder="Enter Employee ID (e.g., EMP001)"
                className="employee-id-input"
                disabled={loading}
              />
              {employeeId && (
                <button 
                  type="button" 
                  onClick={clearSearch}
                  className="clear-search-icon"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              type="submit" 
              className="search-budget-btn"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {budgetData && (
              <button 
                type="button" 
                onClick={clearSearch}
                className="clear-search-btn desktop-only"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="budget-error">
            ❌ {error}
          </div>
        )}

        {budgetData && (
          <div className="budget-display">
            <div className="employee-info">
              <h3>👤 {budgetData.firstName} {budgetData.lastName}</h3>
              <p><strong>Employee ID:</strong> {budgetData.employeeId}</p>
              <p><strong>Department:</strong> {budgetData.department}</p>
              <p className="budget-highlight"><strong>Balance:</strong> ₹{((budgetData.pantryBudget?.monthlyLimit || 0) - (budgetData.pantryBudget?.currentSpent || 0)).toFixed(2)}</p>
            </div>
          </div>
        )}
             </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-sidebar" ref={cartRef}>
          <div className="cart-header">
            <h3>🛒 Your Cart</h3>
            <button 
              className="close-cart-btn"
              onClick={() => setShowCart(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cart.map(item => (
                <div key={item.name} className="cart-item">
                  <div className="cart-item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">₹{item.price}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button 
                      onClick={() => updateQuantity(item.name, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.name, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.name)}
                      className="remove-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <div className="total-amount">Total: ₹{getTotalAmount().toFixed(2)}</div>
                {budgetData && (
                  <div className="budget-check">
                    Remaining Budget: ₹{((budgetData.pantryBudget?.monthlyLimit || 0) - (budgetData.pantryBudget?.currentSpent || 0)).toFixed(2)}
                  </div>
                )}
              </div>
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={orderLoading}
              >
                {orderLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="menu-content">
        <div className="menu-layout">
          <div className="left-container">
            <div className="menu-section">
              <h2>🍽️ Food Categories</h2>
              
              {productsLoading ? (
                <div className="categories-loading">
                  <p>🔄 Loading categories...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="no-categories">
                  <p>😔 No categories available at the moment.</p>
                </div>
              ) : (
                <div className="food-categories">
                  {getUniqueCategories().map((category) => (
                    <div 
                      key={category.name} 
                      className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <h3>
                        <span className="category-icon">{category.icon}</span>
                        {category.name}
                      </h3>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="right-container">
            <div className="menu-section">
              <div className="menu-header-section">
                <h2>📋 Our Menu Items</h2>
                {selectedCategory && (
                  <div className="filter-info">
                    <span className="filter-text">
                      Showing: <strong>{selectedCategory}</strong> ({getFilteredProducts().length} items)
                    </span>
                    <button className="clear-filter-btn" onClick={clearCategoryFilter}>
                      ✕ Show All
                    </button>
                  </div>
                )}
              </div>
              <p className="menu-description">Browse our delicious selection of fresh, high-quality meals available for ordering.</p>
              
              {productsLoading ? (
                <div className="loading-products">
                  <p>🔄 Loading menu items...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="no-products">
                  <p>😔 No menu items available at the moment.</p>
                </div>
              ) : getFilteredProducts().length === 0 ? (
                <div className="no-products">
                  <p>😔 No items found in the {selectedCategory} category.</p>
                </div>
              ) : (
                <div className="menu-items-cards">
                  {getFilteredProducts().map((product) => (
                    <div key={product._id} className="menu-item-card">
                      <div className="menu-item-image">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="product-image"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className="menu-item-icon" style={{display: product.imageUrl ? 'none' : 'flex'}}>
                          {getCategoryIcon(product.category)}
                        </div>
                      </div>
                      <h4>{product.name}</h4>
                      <p className="menu-price">₹{product.price}</p>
                      <p className="menu-description">
                        {product.description || 'Delicious item from our kitchen'}
                      </p>
                      
                      {product.vendor && (
                        <p className="vendor-info">
                          by {product.vendor.firstName} {product.vendor.lastName}
                        </p>
                      )}
                      
                      {budgetData && (
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => addToCart({ 
                            name: product.name, 
                            price: product.price,
                            category: product.category,
                            vendor: product.vendor?.firstName + ' ' + product.vendor?.lastName || 'Unknown'
                          })}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="menu-section">
          <h2>📧 For feedback and suggestion</h2>
          <div className="contact-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0 }}><strong>Email:</strong> food@company.com</p>
            <button 
              type="button"
              className="save-button"
              style={{ padding: '6px 10px', fontSize: '0.9rem', lineHeight: 1, margin: '4px 0' }}
              onClick={() => {
                setShowFeedbackForm(true)
                setTimeout(() => feedbackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
              }}
            >
              Share Feedback
            </button>
          </div>
        </div>

        {/* Feedback Section - Bottom of Menu Portal */}
        {showFeedbackForm && (
          <div className="menu-section" ref={feedbackSectionRef}>
            <h2>📝 Share Your Feedback</h2>
            {fbSuccess && <div className="success-message">{fbSuccess}</div>}
            {fbError && <div className="error-message">{fbError}</div>}

            <form
              onSubmit={submitFeedback}
              className="profile-form"
              style={{
                marginTop: '10px',
                maxWidth: '520px',
                padding: '8px 12px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${fbCols}, 1fr)`, gap: '12px' }}>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label htmlFor="fbCategory" style={{ fontSize: '0.9rem' }}>Category</label>
                  <select
                    id="fbCategory"
                    name="category"
                    value={fbForm.category}
                    onChange={handleFbChange}
                    disabled={fbLoading}
                    style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                  >
                    <option>Food Quality</option>
                    <option>Hygiene</option>
                    <option>Service</option>
                    <option>Price</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label htmlFor="fbRating" style={{ fontSize: '0.9rem' }}>Rating</label>
                  <select
                    id="fbRating"
                    name="rating"
                    value={fbForm.rating}
                    onChange={handleFbChange}
                    disabled={fbLoading}
                    style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Terrible</option>
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label htmlFor="fbVendor" style={{ fontSize: '0.9rem' }}>Vendor (optional)</label>
                  <input
                    id="fbVendor"
                    name="vendorName"
                    value={fbForm.vendorName}
                    onChange={handleFbChange}
                    placeholder="Vendor name"
                    disabled={fbLoading}
                    style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                  />
                </div>
                <div className="form-group" style={{ width: '100%', gridColumn: fbCols > 1 ? '1 / -1' : 'auto' }}>
                  <label htmlFor="fbContact" style={{ fontSize: '0.9rem' }}>Contact (email or phone)</label>
                  <input
                    id="fbContact"
                    name="contactInfo"
                    value={fbForm.contactInfo}
                    onChange={handleFbChange}
                    placeholder="e.g., john.smith@company.com or +1-555-0123"
                    disabled={fbLoading}
                    style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                  />
                </div>
                <div className="form-group" style={{ width: '100%', gridColumn: fbCols > 1 ? '1 / -1' : 'auto' }}>
                  <label htmlFor="fbMessage" style={{ fontSize: '0.9rem' }}>Describe the issue</label>
                  <textarea
                    id="fbMessage"
                    name="message"
                    value={fbForm.message}
                    onChange={handleFbChange}
                    rows={3}
                    placeholder="Please include as many details as possible..."
                    disabled={fbLoading}
                    style={{ padding: '8px 10px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={fbLoading}
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                >
                  {fbLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}


      </div>
      
      {/* Floating Go to Cart Button - Only show when cart is closed */}
      {budgetData && cart.length > 0 && !showCart && (
        <button 
          className="floating-cart-btn"
          onClick={() => setShowCart(true)}
        >
          <span className="cart-icon">🛒</span>
          <div className="cart-info">
            <span className="cart-count">{getTotalItems()} <span className="count-text">items</span></span>
            <span className="cart-total">₹{getTotalAmount().toFixed(2)}</span>
          </div>
        </button>
      )}

      {/* Secret Key Modal */}
      {showSecretKeyModal && (
        <div className="secret-key-modal-overlay">
          <div className="secret-key-modal">
            <div className="modal-header">
              <h3>🔐 Security Verification</h3>
              <button 
                className="modal-close-btn"
                onClick={closeSecretKeyModal}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <p>Please enter your 4-digit secret PIN to proceed with your order:</p>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => {
                  // Only allow numeric input and limit to 4 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setSecretKey(value)
                  setSecretKeyError('') // Clear error when user types
                }}
                placeholder="Enter 4-digit PIN"
                className="secret-key-input"
                maxLength="4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && secretKey.trim().length === 4) {
                    handleSecretKeySubmit()
                  }
                }}
                autoFocus
              />
              {secretKeyError && (
                <div className="secret-key-error">
                  ❌ {secretKeyError}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={closeSecretKeyModal}
              >
                Cancel
              </button>
              <button 
                className="submit-secret-key-btn"
                onClick={handleSecretKeySubmit}
                disabled={secretKey.length !== 4}
              >
                Verify & Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu 