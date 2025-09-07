import { useState, useEffect } from 'react'
import { usersAPI, authAPI } from '../services/api'

function Vendor({ 
  currentUser, 
  allProducts,
  onPurchaseComplete, 
  loading, 
  error, 
  setError, 
  updateSuccess, 
  setUpdateSuccess 
}) {
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')
  const [showEmployeeResults, setShowEmployeeResults] = useState(false)
  const [employeePin, setEmployeePin] = useState('')
  const [isPinVerified, setIsPinVerified] = useState(false)
  const [pinError, setPinError] = useState('')
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [updateSuccess, setUpdateSuccess])
  
  // Get the currently selected employee - use stored data if available, otherwise search in current employees
  const selectedEmployee = selectedEmployeeData || employees.find(emp => emp._id === selectedEmployeeId)

  // Load employees when component mounts or search term changes
  useEffect(() => {
    const loadEmployees = async () => {
      if (employeeSearchTerm.trim().length > 0) {
        setLoadingEmployees(true)
        try {
          const employeeData = await usersAPI.getEmployees(employeeSearchTerm)
          setEmployees(employeeData)
        } catch (error) {
          console.error('Failed to load employees:', error)
          setEmployees([])
        }
        setLoadingEmployees(false)
      } else {
        setEmployees([])
      }
    }

    const debounceTimer = setTimeout(loadEmployees, 300)
    return () => clearTimeout(debounceTimer)
  }, [employeeSearchTerm])

  const getFilteredEmployees = () => {
    return employees
  }

  const handleEmployeeSearchChange = (e) => {
    const value = e.target.value
    setEmployeeSearchTerm(value)
    setShowEmployeeResults(value.trim().length > 0)
    
    if (!value.trim()) {
      setSelectedEmployeeId('')
      setSelectedEmployeeData(null) // Clear stored employee data
      clearEmployeeState()
    }
  }

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployeeId(employee._id)
    setSelectedEmployeeData(employee) // Store the complete employee data
    setEmployeeSearchTerm(`${employee.firstName} ${employee.lastName} (${employee.employeeId})`)
    setShowEmployeeResults(false)
    clearEmployeeState()
  }

  const clearEmployeeState = () => {
    setCart([])
    setEmployeePin('')
    setIsPinVerified(false)
    setPinError('')
    if (error) setError('')
    if (updateSuccess) setUpdateSuccess('')
  }

  const handleEmployeeSearchFocus = () => {
    if (employeeSearchTerm.trim()) {
      setShowEmployeeResults(true)
    }
  }

  const handleEmployeeSearchBlur = () => {
    setTimeout(() => setShowEmployeeResults(false), 200)
  }



  const getFilteredProducts = () => {
    let filtered = allProducts

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      )
    }

    return filtered.filter(product => product.isAvailable)
  }

  const addToCart = (product) => {
    // Clear any existing messages
    if (error) setError('')
    if (updateSuccess) setUpdateSuccess('')

    if (!selectedEmployee) {
      setError('Please select an employee first')
      return
    }

    // Check budget before adding
    const currentTotal = getCartTotal()
    const newItemCost = product.price
    const projectedTotal = currentTotal + newItemCost
    const availableBudget = selectedEmployee.pantryBudget.monthlyLimit - selectedEmployee.pantryBudget.currentSpent
    
    if (projectedTotal > availableBudget) {
      setError(`Cannot add ${product.name}. This would exceed the available budget of ₹${availableBudget.toFixed(2)}`)
      return
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id)
      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        setUpdateSuccess(`Added another ${product.name} to cart (Qty: ${existingItem.quantity + 1})`)
        return updatedCart
      } else {
        setUpdateSuccess(`${product.name} added to cart successfully!`)
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    )
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const checkBudgetSufficiency = () => {
    if (!selectedEmployee) return false
    const total = getCartTotal()
    const availableBudget = selectedEmployee.pantryBudget.monthlyLimit - selectedEmployee.pantryBudget.currentSpent
    return availableBudget >= total
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    if (!selectedEmployee) {
      setError('Please select an employee')
      return
    }

    if (!checkBudgetSufficiency()) {
      setError('Insufficient budget for this purchase')
      return
    }

    // Verify PIN at checkout
    if (!employeePin || employeePin.length !== 4) {
      setError('Please enter the employee\'s 4-digit PIN to complete purchase')
      return
    }

    try {
      // Verify PIN before processing purchase
      await authAPI.verifyPin(selectedEmployee.employeeId, employeePin)
      
      const purchaseData = {
        employeeId: selectedEmployee.employeeId, // Use the employee ID string, not MongoDB _id
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        items: cart.map(item => ({
          id: item._id, // Backend expects 'id' not '_id'
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        })),
        total: getCartTotal(),
        totalItems: getCartItemCount(),
        vendorName: `${currentUser.firstName} ${currentUser.lastName}`,
        pin: employeePin
      }

      console.log('🚀 Sending purchase data:', purchaseData)
      const response = await onPurchaseComplete(purchaseData)
      
      // Store order details and show success message
      if (response && response.order && response.order.orderId) {
        setLastOrder({
          orderId: response.order.orderId,
          items: purchaseData.items,
          total: purchaseData.total,
          totalItems: purchaseData.totalItems,
          employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
          timestamp: new Date()
        })
        
        // Auto-scroll to order confirmation section
        setTimeout(() => {
          const orderSection = document.getElementById('order-confirmation')
          if (orderSection) {
            orderSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            })
          }
        }, 100)
        
        setUpdateSuccess(`🎉 Order #${response.order.orderId} completed successfully! ${purchaseData.totalItems} items purchased for ${selectedEmployee.firstName} ${selectedEmployee.lastName}. Total: ₹${purchaseData.total.toFixed(2)}`)
      } else {
        setUpdateSuccess('🎉 Purchase completed successfully!')
      }
      
      setCart([])
      setEmployeePin('')
      setIsPinVerified(false)
      setPinError('')
    } catch (error) {
      console.error('Checkout error:', error)
      setError('Purchase failed. Please check PIN and try again.')
      setPinError('Invalid PIN')
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const categories = ['All', 'Snacks', 'Beverages', 'Meals', 'Fruits', 'Dairy', 'Bakery']

  const filteredProducts = getFilteredProducts()
  const filteredEmployees = getFilteredEmployees()

  return (
    <div className="vendor-container">
      <div className="vendor-header">
        <h2>🏪 Vendor Store Interface</h2>
        <p>Shop for employees and manage their pantry purchases</p>
      </div>

      {/* Smart Notification System - Show only most relevant */}
      {(() => {
        // Priority: Error > Success > Contextual Help
        if (error) {
          return (
            <div className="vendor-message error-message">
              <span className="message-icon">⚠️</span>
              <span className="message-text">{error}</span>
              <button 
                className="message-close" 
                onClick={() => setError('')}
                aria-label="Close error message"
              >
                ✕
              </button>
            </div>
          )
        }

        if (updateSuccess) {
          return (
            <div className="vendor-message success-message">
              <span className="message-icon">✅</span>
              <span className="message-text">{updateSuccess}</span>
              <button 
                className="message-close" 
                onClick={() => setUpdateSuccess('')}
                aria-label="Close success message"
              >
                ✕
              </button>
            </div>
          )
        }

        // Contextual help messages when no errors/success
        if (!selectedEmployee) {
          return (
            <div className="vendor-message info-message">
              <span className="message-icon">💡</span>
              <span className="message-text">Start by searching and selecting an employee to shop for</span>
            </div>
          )
        }

        if (selectedEmployee && cart.length === 0) {
          return (
            <div className="vendor-message info-message">
              <span className="message-icon">🛒</span>
              <span className="message-text">Browse products below and add items to cart for {selectedEmployee.firstName} {selectedEmployee.lastName}</span>
            </div>
          )
        }

        if (cart.length > 0 && getCartTotal() > (selectedEmployee.pantryBudget.monthlyLimit - selectedEmployee.pantryBudget.currentSpent)) {
          return (
            <div className="vendor-message warning-message">
              <span className="message-icon">⚠️</span>
              <span className="message-text">Cart total exceeds available budget. Remove some items before checkout.</span>
            </div>
          )
        }

        if (cart.length > 0) {
          return (
            <div className="vendor-message info-message">
              <span className="message-icon">🎯</span>
              <span className="message-text">Cart ready! Scroll down to checkout and enter PIN to complete purchase.</span>
            </div>
          )
        }

        return null
      })()}

      {/* Employee Selection Section */}
      <div className="employee-selection-section">
        <h3>👤 Select Employee</h3>
        <div className="employee-search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search employee by name, ID, department, or position..."
              value={employeeSearchTerm}
              onChange={handleEmployeeSearchChange}
              onFocus={handleEmployeeSearchFocus}
              onBlur={handleEmployeeSearchBlur}
              className="employee-search-input"
            />
            {employeeSearchTerm && (
              <button 
                className="clear-search-icon"
                onClick={() => {
                  setEmployeeSearchTerm('')
                  setSelectedEmployeeId('')
                  setSelectedEmployeeData(null)
                  setShowEmployeeResults(false)
                  clearEmployeeState()
                }}
                type="button"
              >
                ✕
              </button>
            )}
            {loadingEmployees && <div className="search-loading">🔍</div>}
          </div>
          
          {showEmployeeResults && (
            <div className="employee-search-results">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(employee => (
                  <div
                    key={employee._id}
                    className="employee-search-result"
                  >
                    <div className="employee-info">
                      <div className="employee-name">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="employee-details">
                        ID: {employee.employeeId} | {employee.department} | {employee.position}
                      </div>
                      <div className="employee-budget">
                        Budget: ₹{(employee.pantryBudget.monthlyLimit - employee.pantryBudget.currentSpent).toFixed(2)} available
                      </div>
                    </div>
                    <button
                      className="select-employee-button"
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      Select
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  {loadingEmployees ? 'Searching...' : 'No employees found'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Employee Card */}
        {selectedEmployee && (
          <div className="selected-employee-card">
            <div className="employee-card-header">
              <h4>Selected Employee</h4>
            </div>
            <div className="employee-card-content">
              <div className="employee-basic-info">
                <div className="employee-name-section">
                  <span className="employee-name">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                  <span className="employee-id">({selectedEmployee.employeeId})</span>
                </div>
                <div className="employee-dept-pos">
                  {selectedEmployee.department} - {selectedEmployee.position}
                </div>
              </div>
              
              <div className="employee-budget-info">
                <span className="budget-inline">
                  <span className="budget-label">Limit:</span>
                  <span className="budget-value">₹{selectedEmployee.pantryBudget.monthlyLimit.toFixed(2)}</span>
                  <span className="budget-separator">|</span>
                  <span className="budget-label">Spent:</span>
                  <span className="budget-value spent">₹{selectedEmployee.pantryBudget.currentSpent.toFixed(2)}</span>
                  <span className="budget-separator">|</span>
                  <span className="budget-label">Available:</span>
                  <span className={`budget-value ${(selectedEmployee.pantryBudget.monthlyLimit - selectedEmployee.pantryBudget.currentSpent) < 50 ? 'low' : 'available'}`}>
                    ₹{(selectedEmployee.pantryBudget.monthlyLimit - selectedEmployee.pantryBudget.currentSpent).toFixed(2)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Order Confirmation Section - Top Content */}
      {lastOrder && (
        <div className="order-confirmation-section" id="order-confirmation">
          <div className="order-confirmation-header">
            <h3>✅ Order Completed Successfully!</h3>
            <button 
              className="dismiss-order-button"
              onClick={() => setLastOrder(null)}
              aria-label="Dismiss order confirmation"
            >
              ✕
            </button>
          </div>
          
          <div className="order-details">
            <div className="order-id-display">
              <span className="order-label">Order ID:</span>
              <span className="order-id">{lastOrder.orderId}</span>
              
              <div className="order-summary">
                <div className="order-info-item">
                  <span className="label">Customer:</span>
                  <span className="value">{lastOrder.employeeName}</span>
                </div>
                <div className="order-info-item">
                  <span className="label">Items:</span>
                  <span className="value">{lastOrder.totalItems} items</span>
                </div>
                <div className="order-info-item">
                  <span className="label">Total:</span>
                  <span className="value total-amount">₹{lastOrder.total.toFixed(2)}</span>
                </div>
                <div className="order-info-item">
                  <span className="label">Date & Time:</span>
                  <span className="value">{lastOrder.timestamp.toLocaleDateString()} {lastOrder.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div className="order-items-list">
                <h4>Items Purchased:</h4>
                <div className="items-grid">
                  {lastOrder.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-details">
                        {item.quantity}x ₹{item.price.toFixed(2)} = ₹{(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Section */}
      <div className="product-selection-section">
        <h3>🛒 Product Selection</h3>
        
        {cart.length === 0 && (
          <div className="vendor-workflow-helper">
            <div className="workflow-steps">
              <div className={`workflow-step ${selectedEmployee ? 'completed' : 'current'}`}>
                <span className="step-number">1</span>
                <span className="step-text">Select Employee</span>
                {selectedEmployee && <span className="step-check">✅</span>}
              </div>
              <div className={`workflow-step ${selectedEmployee && cart.length === 0 ? 'current' : cart.length > 0 ? 'completed' : 'pending'}`}>
                <span className="step-number">2</span>
                <span className="step-text">Add Products</span>
                {cart.length > 0 && <span className="step-check">✅</span>}
              </div>
              <div className={`workflow-step ${cart.length > 0 ? 'current' : 'pending'}`}>
                <span className="step-number">3</span>
                <span className="step-text">Checkout & Pay</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="product-filters">
          <div className="filter-group">
            <label htmlFor="categoryFilter">Category:</label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="productSearch">Search Products:</label>
            <input
              type="text"
              id="productSearch"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-info">
                  <h4 className="product-name">{product.name}</h4>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  <div className="product-price">₹{product.price.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={!selectedEmployee}
                  className="add-to-cart-button"
                  title={
                    !selectedEmployee 
                      ? "Please select an employee first" 
                      : "Add to cart"
                  }
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <div className="no-products">
              <p>No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="shopping-cart-section">
        <div className="cart-header">
          <h3>🛍️ Shopping Cart</h3>
          {cart.length > 0 && (
            <button onClick={clearCart} className="clear-cart-button">
              Clear Cart
            </button>
          )}
        </div>

        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">₹{item.price.toFixed(2)} each</span>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="quantity-button"
                    >
                      −
                    </button>
                    <span className="cart-item-quantity">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="quantity-button"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="remove-item-button"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="cart-item-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-totals">
                <div className="total-items">Total Items: {getCartItemCount()}</div>
                <div className="total-amount">Total Amount: ₹{getCartTotal().toFixed(2)}</div>
                {selectedEmployee && (
                  <div className={`budget-check ${checkBudgetSufficiency() ? 'sufficient' : 'insufficient'}`}>
                    {checkBudgetSufficiency() ? 
                      '✅ Budget sufficient' : 
                      '⚠️ Insufficient budget'
                    }
                  </div>
                )}
              </div>
              
              {/* PIN Verification at Checkout */}
              <div className="checkout-pin-section">
                <h4>🔐 Enter Employee PIN to Complete Purchase</h4>
                <div className="pin-input-container">
                  <input
                    type="password"
                    placeholder="Employee's 4-digit PIN"
                    value={employeePin}
                    onChange={(e) => {
                      setEmployeePin(e.target.value)
                      setPinError('')
                    }}
                    maxLength="4"
                    className={`pin-input ${pinError ? 'error' : ''}`}
                  />
                  {pinError && (
                    <div className="pin-status">
                      <span className="pin-error">❌ {pinError}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || !checkBudgetSufficiency() || !employeePin || employeePin.length !== 4}
                className="checkout-button"
              >
                {loading ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <p>Cart is empty. Add some products to get started!</p>
            {!selectedEmployee && (
              <p className="cart-help">💡 Select an employee first, then verify their PIN to start shopping.</p>
            )}
            {selectedEmployee && !isPinVerified && (
              <p className="cart-help">🔐 Verify the employee's PIN to start adding items.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Vendor 