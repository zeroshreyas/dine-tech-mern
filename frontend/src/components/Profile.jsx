import { useState, useEffect } from 'react'
import { ordersAPI } from '../services/api'

function Profile({ currentUser, loading, setLoading, error, setError, updateSuccess, setUpdateSuccess }) {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [sortBy, setSortBy] = useState('date') // date, amount, status
  const [filterStatus, setFilterStatus] = useState('all') // all, pending, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      setError('')
      const response = await ordersAPI.getMyOrders()
      setOrders(response.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      setOrdersLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981' // green
      case 'pending': return '#f59e0b' // amber
      case 'confirmed': return '#3b82f6' // blue
      case 'cancelled': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981' // green
      case 'pending': return '#f59e0b' // amber
      case 'failed': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter(order => {
      // Filter by status
      if (filterStatus !== 'all' && order.status !== filterStatus) {
        return false
      }
      
      // Filter by search term (order ID, vendor name, or items)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesOrderId = order.orderId.toLowerCase().includes(searchLower)
        const matchesVendor = order.vendor && 
          `${order.vendor.firstName} ${order.vendor.lastName}`.toLowerCase().includes(searchLower)
        const matchesItems = order.items.some(item => 
          item.name.toLowerCase().includes(searchLower)
        )
        
        return matchesOrderId || matchesVendor || matchesItems
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.totalAmount - a.totalAmount
        case 'status':
          return a.status.localeCompare(b.status)
        case 'date':
        default:
          return new Date(b.orderDate) - new Date(a.orderDate)
      }
    })

  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrders = orders.length
  const completedOrders = orders.filter(order => order.status === 'completed').length

  return (
    <div className="profile-container">
      {/* Order Statistics Card */}
      <div className="info-card">
        <div className="card-header">
          <h2>📋 Order History</h2>
          <button 
            onClick={fetchOrders}
            disabled={ordersLoading}
            className="refresh-button"
            title="Refresh orders"
          >
            {ordersLoading ? '🔄' : '🔃'} Refresh
          </button>
        </div>

        {/* Order Statistics */}
        <div className="order-stats">
          <div className="stat-item">
            <div className="stat-number">{totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{completedOrders}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatCurrency(totalSpent)}</div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {formatCurrency(currentUser.pantryBudget?.monthlyLimit - currentUser.pantryBudget?.currentSpent || 0)}
            </div>
            <div className="stat-label">Budget Remaining</div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="info-card">

        {/* Controls */}
        <div className="order-controls">
          <div className="control-group">
            <label htmlFor="search">Search Orders:</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, vendor, or items..."
              className="search-input"
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Date (Newest First)</option>
              <option value="amount">Amount (Highest First)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {ordersLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredAndSortedOrders.length > 0 ? (
          <div className="orders-list">
            {filteredAndSortedOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id-section">
                    <span className="order-id">#{order.orderId}</span>
                    <span className="order-date">{formatDate(order.orderDate)}</span>
                  </div>
                  <div className="order-status-section">
                    <span 
                      className="order-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span 
                      className="payment-status"
                      style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) }}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="vendor-info">
                    <span className="vendor-label">Vendor:</span>
                    <span className="vendor-name">
                      {order.vendor ? 
                        `${order.vendor.firstName} ${order.vendor.lastName} (${order.vendor.employeeId})` : 
                        'Unknown Vendor'
                      }
                    </span>
                  </div>

                  <div className="order-summary">
                    <span className="summary-label">Total:</span>
                    <span className="summary-value">{formatCurrency(order.totalAmount)}</span>
                    <span className="summary-label">Items:</span>
                    <span className="summary-value">{order.totalItems}</span>
                  </div>
                </div>

                <div className="order-items">
                  <h4>Items Ordered:</h4>
                  <div className="items-grid">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-name">{item.name}</div>
                        <div className="item-details">
                          <div className="item-quantity">
                            <span className="label">Quantity</span>
                            <span className="value">{item.quantity}</span>
                          </div>
                          <div className="item-price">
                            <span className="label">Unit Price</span>
                            <span className="value">{formatCurrency(item.price)}</span>
                          </div>
                          <div className="item-subtotal">
                            <span className="label">Total</span>
                            <span className="value">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="order-notes">
                    <strong>Notes:</strong> {order.notes}
                  </div>
                )}

                {order.completedAt && (
                  <div className="order-completed">
                    <span className="completed-label">Completed:</span>
                    <span className="completed-date">{formatDate(order.completedAt)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>No Orders Found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'You haven\'t placed any orders yet. Visit a vendor to make your first purchase!'
              }
            </p>
            {(searchTerm || filterStatus !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                }}
                className="clear-filters-button"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile 