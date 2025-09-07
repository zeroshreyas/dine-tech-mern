import { useState, useEffect } from 'react'
import { ordersAPI, usersAPI, productsAPI, feedbackAPI } from '../services/api'

function AdminDashboard({ currentUser, loading, setLoading, error, setError, updateSuccess, setUpdateSuccess }) {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [summary, setSummary] = useState({})
  const [pagination, setPagination] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  
  // Filters and controls
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [employees, setEmployees] = useState([])
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeSearchResults, setEmployeeSearchResults] = useState([])
  const [showEmployeeResults, setShowEmployeeResults] = useState(false)
  
  // Vendor management state
  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [showVendorForm, setShowVendorForm] = useState(false)
  const [vendorFormData, setVendorFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    password: '',
    department: 'Food Services',
    position: 'Vendor',
    contactNumber: ''
  })

  // Product management state
  const [showProductForm, setShowProductForm] = useState(false)
  const [productSubTab, setProductSubTab] = useState('list') // 'list' or 'add'
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productFilters, setProductFilters] = useState({
    vendor: '',
    category: '',
    availability: '',
    priceMin: '',
    priceMax: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toastNotification, setToastNotification] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentProductPage, setCurrentProductPage] = useState(1)
  const [productsPerPage] = useState(10)
      const [productFormData, setProductFormData] = useState({
      name: '',
      category: 'Snacks',
      price: '',
      description: '',
      stockQuantity: '',
      vendor: '',
      imageUrl: '',
      isAvailable: true,
      nutritionalInfo: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      allergens: []
    })
  const [exportingOrders, setExportingOrders] = useState(false)

    // Feedback admin state
    const [feedbackList, setFeedbackList] = useState([])
    const [feedbackLoading, setFeedbackLoading] = useState(false)
    const [feedbackPagination, setFeedbackPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
    const [feedbackSearch, setFeedbackSearch] = useState('')
    const [feedbackCategory, setFeedbackCategory] = useState('')
    const [exportingFeedback, setExportingFeedback] = useState(false)

    const fetchAllFeedback = async (page = 1) => {
      try {
        setFeedbackLoading(true)
        setError('')
        const res = await feedbackAPI.adminAll({ page, limit: feedbackPagination.limit, search: feedbackSearch, category: feedbackCategory })
        setFeedbackList(res.feedbacks || [])
        setFeedbackPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      } catch (err) {
        setError(err.message || 'Failed to load feedback')
      } finally {
        setFeedbackLoading(false)
      }
    }

    const exportFeedbackCsv = async () => {
      try {
        setExportingFeedback(true)
        setError('')
        // Fetch all pages with current filters
        const pageLimit = 500
        let page = 1
        let all = []
        let hasNext = true
        while (hasNext) {
          const res = await feedbackAPI.adminAll({ page, limit: pageLimit, search: feedbackSearch, category: feedbackCategory })
          all = all.concat(res.feedbacks || [])
          const p = res.pagination || {}
          hasNext = !!p.hasNext
          page = (p.page || page) + 1
          if (!p.totalPages) hasNext = false
        }

        const header = ['Created At','Category','Rating','Employee ID','Source','Vendor','Order ID','Contact','Message']
        const rows = all.map(fb => [
          new Date(fb.createdAt).toISOString(),
          fb.category || '',
          fb.rating ?? '',
          fb.employeeId || '',
          (!fb.user || fb.employeeId === 'GUEST') ? 'Public' : 'Authenticated',
          fb.vendorName || '',
          fb.orderId || '',
          fb.contactInfo || '',
          fb.message || ''
        ])

        const escapeCsv = (val) => {
          const s = String(val).replace(/"/g, '""').replace(/\r?\n/g, '\\n')
          return `"${s}"`
        }

        const csv = [header, ...rows].map(r => r.map(escapeCsv).join(',')).join('\r\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `feedback_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err.message || 'Failed to export feedback')
      } finally {
        setExportingFeedback(false)
      }
    }

    const exportOrdersCsv = async () => {
      try {
        setExportingOrders(true)
        setError('')

        const pageLimit = 500
        let page = 1
        let allOrders = []
        let hasNext = true
        while (hasNext) {
          const res = await ordersAPI.getAllOrdersAdmin({
            page,
            limit: pageLimit,
            status: filterStatus,
            search: (searchTerm || '').trim(),
            sortBy,
            sortOrder,
          })
          allOrders = allOrders.concat(res.orders || [])
          const p = res.pagination || {}
          hasNext = !!p.hasNext
          page = (p.page || page) + 1
          if (!p.totalPages) hasNext = false
        }

        const header = [
          'Order ID','Order Date','Status','Payment Status','Employee Name','Employee ID','Vendor Name','Total Amount','Total Items','Items'
        ]
        const rows = allOrders.map(o => {
          const employeeName = o.employee ? `${o.employee.firstName || ''} ${o.employee.lastName || ''}`.trim() : ''
          const employeeId = o.employee ? (o.employee.employeeId || '') : ''
          const vendorName = o.vendor ? `${o.vendor.firstName || ''} ${o.vendor.lastName || ''}`.trim() : ''
          const items = Array.isArray(o.items) ? o.items.map(i => `${i.name} x ${i.quantity}`).join('; ') : ''
          return [
            o.orderId || '',
            o.orderDate ? new Date(o.orderDate).toISOString() : '',
            o.status || '',
            o.paymentStatus || '',
            employeeName,
            employeeId,
            vendorName,
            (Number(o.totalAmount) || 0).toFixed(2),
            o.totalItems ?? (Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.quantity || 0), 0) : ''),
            items
          ]
        })

        const escapeCsv = (val) => {
          const s = String(val).replace(/"/g, '""').replace(/\r?\n/g, '\\n')
          return `"${s}"`
        }
        const csv = [header, ...rows].map(r => r.map(escapeCsv).join(',')).join('\r\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err.message || 'Failed to export orders')
      } finally {
        setExportingOrders(false)
      }
    }

  useEffect(() => {
    fetchAllOrders()
  }, [currentPage, sortBy, sortOrder, filterStatus, searchTerm])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchAllFeedback(1)
    }
  }, [activeTab])

  const fetchAllOrders = async () => {
    try {
      setOrdersLoading(true)
      setError('')
      
      const params = {
        page: currentPage,
        limit: 20,
        status: filterStatus,
        search: searchTerm,
        sortBy,
        sortOrder
      }
      
      console.log('🔍 Fetching orders with params:', params)
      
      const response = await ordersAPI.getAllOrdersAdmin(params)
      
      console.log('✅ Orders response:', response)
      console.log(`📊 Received ${response.orders?.length || 0} orders`)
      
      setOrders(response.orders || [])
      setSummary(response.summary || {})
      setPagination(response.pagination || {})
    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      console.log('📋 Fetching employees from database...')
      const response = await usersAPI.getEmployeesAdmin()
      console.log('✅ Employees response:', response)
      
      // Handle different response formats
      const employeesData = response.employees || response
      console.log('📝 Employee data structure:', employeesData)
      
      if (Array.isArray(employeesData) && employeesData.length > 0) {
        console.log('🔍 First employee example:', employeesData[0])
        console.log('📋 All employee IDs:', employeesData.map(emp => emp.employeeId))
      }
      
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
      console.log(`📊 Loaded ${employeesData.length} employees`)
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
      setError('Failed to load employees. Please try again.')
    }
  }

  const fetchUserOrders = async (employeeId) => {
    try {
      setOrdersLoading(true)
      setError('')
      const response = await ordersAPI.getUserOrdersAdmin(employeeId)
      setOrders(response.orders)
      setSelectedEmployee(response.employee)
    } catch (error) {
      console.error('Error fetching user orders:', error)
      setError('Failed to load user orders. Please try again.')
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
    const numAmount = Number(amount) || 0;
    return `₹${numAmount.toFixed(2)}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'confirmed': return '#3b82f6'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'failed': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleEmployeeSelect = (employee) => {
    if (!employee) {
      setSelectedEmployee('')
      setEmployeeSearch('')
      setShowEmployeeResults(false)
      setCurrentPage(1)
      fetchAllOrders()
    } else {
      setSelectedEmployee(employee)
      setEmployeeSearch(`${employee.firstName} ${employee.lastName} (${employee.employeeId})`)
      setShowEmployeeResults(false)
      fetchUserOrders(employee.employeeId)
    }
  }

  const handleEmployeeSearchChange = (e) => {
    const searchValue = e.target.value
    setEmployeeSearch(searchValue)
    
    if (searchValue.length > 0) {
      console.log('🔍 Searching employees with term:', searchValue)
      console.log('📊 Available employees:', employees.length)
      
      const filteredEmployees = employees.filter(emp => {
        // Safe handling of potentially undefined fields
        const firstName = emp.firstName || ''
        const lastName = emp.lastName || ''
        const employeeId = emp.employeeId || ''
        const department = emp.department || ''
        const position = emp.position || ''
        const email = emp.email || ''
        
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const searchTerm = searchValue.toLowerCase()
        
        console.log(`Checking employee: ${fullName} (${employeeId})`)
        
        const matches = fullName.includes(searchTerm) ||
          employeeId.toLowerCase().includes(searchTerm) ||
          department.toLowerCase().includes(searchTerm) ||
          position.toLowerCase().includes(searchTerm) ||
          email.toLowerCase().includes(searchTerm) ||
          // Also try exact matches and partial matches without spaces
          employeeId.replace(/\s+/g, '').toLowerCase().includes(searchTerm.replace(/\s+/g, '')) ||
          fullName.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))
        
        if (matches) {
          console.log(`✓ Match found: ${fullName} (${employeeId})`)
        }
        
        return matches
      })
      
      console.log(`✅ Found ${filteredEmployees.length} matching employees`)
      console.log('Filtered employees:', filteredEmployees)
      setEmployeeSearchResults(filteredEmployees)
      setShowEmployeeResults(true)
    } else {
      setEmployeeSearchResults([])
      setShowEmployeeResults(false)
      setSelectedEmployee('')
    }
  }

  const handleEmployeeSearchFocus = () => {
    if (employeeSearch.length > 0 && employeeSearchResults.length > 0) {
      setShowEmployeeResults(true)
    }
  }

  const handleEmployeeSearchBlur = () => {
    // Delay hiding results to allow for clicks (increased for touchpad compatibility)
    setTimeout(() => setShowEmployeeResults(false), 500)
  }

  // Vendor management functions
  const fetchVendors = async () => {
    try {
      setVendorsLoading(true)
      setError('')
      const vendorsList = await usersAPI.getVendors()
      setVendors(vendorsList)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      showToast('Failed to load vendors. Please try again.', 'error')
    } finally {
      setVendorsLoading(false)
    }
  }

  // Product management functions
  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      setError('')
      const productsList = await productsAPI.getProducts()
      setProducts(productsList)
    } catch (error) {
      console.error('Error fetching products:', error)
      showToast('Failed to load products. Please try again.', 'error')
    } finally {
      setProductsLoading(false)
    }
  }

  const handleVendorFormSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      await usersAPI.createVendor(vendorFormData)
      
      showToast('Vendor created successfully!', 'success')
      setShowVendorForm(false)
      setVendorFormData({
        firstName: '',
        lastName: '',
        email: '',
        employeeId: '',
        password: '',
        department: 'Food Services',
        position: 'Vendor',
        contactNumber: ''
      })
      
      // Refresh vendors list
      fetchVendors()
      
    } catch (error) {
      console.error('Error creating vendor:', error)
      showToast(error.message || 'Failed to create vendor. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVendorFormChange = (e) => {
    const { name, value } = e.target
    setVendorFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Product management functions
  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      // Prepare product data
      const productData = {
        ...productFormData,
        price: parseFloat(productFormData.price),
        stockQuantity: productFormData.stockQuantity ? parseInt(productFormData.stockQuantity) : 0,
        nutritionalInfo: {
          calories: productFormData.nutritionalInfo.calories ? parseFloat(productFormData.nutritionalInfo.calories) : undefined,
          protein: productFormData.nutritionalInfo.protein ? parseFloat(productFormData.nutritionalInfo.protein) : undefined,
          carbs: productFormData.nutritionalInfo.carbs ? parseFloat(productFormData.nutritionalInfo.carbs) : undefined,
          fat: productFormData.nutritionalInfo.fat ? parseFloat(productFormData.nutritionalInfo.fat) : undefined,
        }
      }
      
      // Remove empty vendor field
      if (!productData.vendor || productData.vendor.trim() === '') {
        delete productData.vendor
      }
      
      // Remove empty nutritional info
      if (!productData.nutritionalInfo.calories && !productData.nutritionalInfo.protein && 
          !productData.nutritionalInfo.carbs && !productData.nutritionalInfo.fat) {
        delete productData.nutritionalInfo
      }
      
      await productsAPI.createProduct(productData)
      
      showToast('Product created successfully!', 'success')
      setProductSubTab('list') // Switch to list view after creation
      setProductFormData({
        name: '',
        category: 'Snacks',
        price: '',
        description: '',
        stockQuantity: '',
        vendor: '',
        imageUrl: '',
        isAvailable: true,
        nutritionalInfo: {
          calories: '',
          protein: '',
          carbs: '',
          fat: ''
        },
        allergens: []
      })
      
      // Refresh products list
      fetchProducts()
      
    } catch (error) {
      console.error('Error creating product:', error)
      showToast(error.message || 'Failed to create product. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('nutritionalInfo.')) {
      const field = name.split('.')[1]
      setProductFormData(prev => ({
        ...prev,
        nutritionalInfo: {
          ...prev.nutritionalInfo,
          [field]: value
        }
      }))
    } else {
      setProductFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleAllergenChange = (allergen) => {
    setProductFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Create a data URL for preview and set as imageUrl
      const reader = new FileReader()
      reader.onload = (event) => {
        setProductFormData(prev => ({
          ...prev,
          imageUrl: event.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Filter products based on all filter criteria
  const getFilteredProducts = () => {
    let filtered = [...products]
    
    // Vendor filter
    if (productFilters.vendor) {
      if (productFilters.vendor === 'no-vendor') {
        filtered = filtered.filter(product => !product.vendor)
      } else {
        filtered = filtered.filter(product => product.vendor?._id === productFilters.vendor)
      }
    }
    
    // Category filter
    if (productFilters.category) {
      filtered = filtered.filter(product => product.category === productFilters.category)
    }
    
    // Availability filter
    if (productFilters.availability) {
      const isAvailable = productFilters.availability === 'available'
      filtered = filtered.filter(product => product.isAvailable === isAvailable)
    }
    
    // Price range filter
    if (productFilters.priceMin) {
      filtered = filtered.filter(product => product.price >= parseFloat(productFilters.priceMin))
    }
    if (productFilters.priceMax) {
      filtered = filtered.filter(product => product.price <= parseFloat(productFilters.priceMax))
    }
    
    // Search filter (name and description)
    if (productFilters.search) {
      const searchTerm = productFilters.search.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      )
    }
    
    return filtered
  }

  const handleFilterChange = (field, value) => {
    setProductFilters(prev => ({
      ...prev,
      [field]: value
    }))
    setCurrentProductPage(1) // Reset to first page when filters change
  }

  const clearAllFilters = () => {
    setProductFilters({
      vendor: '',
      category: '',
      availability: '',
      priceMin: '',
      priceMax: '',
      search: ''
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(productFilters).filter(value => value !== '').length
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(products.map(product => product.category))]
    return categories.sort()
  }

  // Get paginated products
  const getPaginatedProducts = () => {
    const filteredProducts = getFilteredProducts()
    const startIndex = (currentProductPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }

  // Get total pages
  const getTotalProductPages = () => {
    const filteredProducts = getFilteredProducts()
    return Math.ceil(filteredProducts.length / productsPerPage)
  }

  // Handle page change
  const handleProductPageChange = (page) => {
    setCurrentProductPage(page)
  }

  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type })
    setTimeout(() => {
      setToastNotification(null)
    }, 5000) // Auto-dismiss after 5 seconds
  }

  // Product editing functions
  const handleEditProduct = (product) => {
    setEditingProduct(product._id)
    setEditFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      vendor: product.vendor?._id || '',
      isAvailable: product.isAvailable
    })
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setEditFormData({})
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async (productId) => {
    try {
      setError('')
      
      // Update product via API
      await productsAPI.updateProduct(productId, editFormData)
      
      // Update the local products state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { 
                ...product,
                ...editFormData,
                vendor: editFormData.vendor ? vendors.find(v => v._id === editFormData.vendor) : null
              }
            : product
        )
      )
      
      showToast('Product updated successfully!', 'success')
      setEditingProduct(null)
      setEditFormData({})
      
    } catch (error) {
      console.error('Error updating product:', error)
      showToast('Failed to update product. Please try again.', 'error')
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      setError('')
      
      // Delete product via API
      await productsAPI.deleteProduct(productId)
      
      // Remove from local state
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId))
      
      showToast('Product deleted successfully!', 'success')
      setDeleteConfirm(null)
      
    } catch (error) {
      console.error('Error deleting product:', error)
      showToast('Failed to delete product. Please try again.', 'error')
    }
  }

  // Fetch vendors and products when vendors or products tab is accessed
  useEffect(() => {
    if (activeTab === 'vendors' || activeTab === 'products') {
      fetchVendors()
    }
    if (activeTab === 'products') {
      fetchProducts()
    }
  }, [activeTab])

  const resetFilters = () => {
    console.log('🔄 Resetting all filters')
    setSearchTerm('')
    setFilterStatus('all')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
    setSelectedEmployee('')
    setEmployeeSearch('')
    setShowEmployeeResults(false)
    // Force refetch after state updates
    setTimeout(() => {
      fetchAllOrders()
    }, 100)
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Admin Header */}
        <div className="admin-header">
        <div className="admin-title">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Welcome, {currentUser.firstName}! You have admin access to view all system orders.</p>
        </div>
        <button 
          onClick={fetchAllOrders}
          disabled={ordersLoading}
          className="refresh-button"
          title="Refresh data"
        >
          {ordersLoading ? '🔄' : '🔃'} Refresh
        </button>
      </div>

      {/* Mobile Hamburger Menu Button */}
      <div className="mobile-menu-container">
        <button 
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <div className="mobile-current-tab">
          <span className="current-tab-icon">
            {activeTab === 'overview' ? '📊' : 
             activeTab === 'orders' ? '📦' : 
             activeTab === 'users' ? '👥' : 
             activeTab === 'vendors' ? '🏪' : 
             activeTab === 'products' ? '🍽️' : '📊'}
          </span>
          <span className="current-tab-text">
            {activeTab === 'overview' ? 'Overview' : 
             activeTab === 'orders' ? 'All Orders' : 
             activeTab === 'users' ? 'By User' : 
             activeTab === 'vendors' ? 'Vendors' : 
             activeTab === 'products' ? 'Products' : 'Overview'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav-container">
        <div className={`admin-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('overview')
            setMobileMenuOpen(false)
          }}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Overview</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders')
            setMobileMenuOpen(false)
          }}
        >
          <span className="nav-icon">📦</span>
          <span className="nav-text">All Orders</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users')
            setMobileMenuOpen(false)
          }}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-text">By User</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'vendors' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('vendors')
            setMobileMenuOpen(false)
          }}
        >
          <span className="nav-icon">🏪</span>
          <span className="nav-text">Vendors</span>
        </button>
                  <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('products')
              setMobileMenuOpen(false)
            }}
          >
            <span className="nav-icon">🍽️</span>
            <span className="nav-text">Products</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('feedback')
              setMobileMenuOpen(false)
            }}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Feedback</span>
          </button>
      </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="admin-section">
          <div className="section-header">
            <h2>📊 System Overview</h2>
          </div>

          {/* Summary Stats */}
          <div className="admin-stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{summary.totalOrders || 0}</div>
                <div className="stat-meta">All time</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Completed Orders</div>
                <div className="stat-value">{summary.completedOrders || 0}</div>
                <div className="stat-meta">Successfully processed</div>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-label">Pending Orders</div>
                <div className="stat-value">{summary.pendingOrders || 0}</div>
                <div className="stat-meta">Awaiting processing</div>
              </div>
            </div>
            
            <div className="stat-card info">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">{formatCurrency(summary.totalSpent || 0)}</div>
                <div className="stat-meta">All orders</div>
              </div>
            </div>
            

          </div>

          {/* Recent Orders Preview */}
          <div className="info-card">
            <div className="card-header">
              <h3>📋 Recent Orders</h3>
              <button 
                onClick={() => setActiveTab('orders')}
                className="view-all-button"
              >
                View All Orders →
              </button>
            </div>
            
            {orders.slice(0, 5).length > 0 ? (
              <div className="recent-orders-list">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="admin-order-preview">
                    <div className="order-info">
                      <div className="order-id">#{order.orderId}</div>
                      <div className="order-employee">
                        {order.employee ? `${order.employee.firstName} ${order.employee.lastName}` : 'Unknown Employee'}
                      </div>
                      <div className="order-date">{formatDate(order.orderDate)}</div>
                    </div>
                    <div className="order-summary">
                      <div className="order-amount">{formatCurrency(order.totalAmount)}</div>
                      <span 
                        className="order-status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recent-orders">
                <p>No recent orders found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Orders Tab */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>📦 All Orders</h2>
          </div>

          {/* Order Controls */}
          <div className="admin-controls-container">
            <div className="filters-header">
              <h3>Filter & Search Orders</h3>
              <button 
                onClick={resetFilters}
                className="clear-filters-button"
              >
                🗑️ Clear All Filters
              </button>

            </div>
            
            <div className="admin-controls">
              <div className="control-group">
                <label htmlFor="search">Search Orders:</label>
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value
                      console.log('🔍 Search term changed:', value)
                      setSearchTerm(value)
                    }}
                    placeholder="Search by Order ID, product name, employee name... (case-insensitive)"
                    className="search-input"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        console.log('🗑️ Clearing search term')
                        setSearchTerm('')
                      }}
                      className="clear-search-btn"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="search-info">
                    <small>🔍 Searching for: "{searchTerm}" (case-insensitive)</small>
                  </div>
                )}
              </div>
              
              <div className="control-group">
                <label htmlFor="status-filter">Filter by Status:</label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('📊 Status filter changed:', value)
                    setFilterStatus(value)
                  }}
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
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="sort-order">Order:</label>
                <select
                  id="sort-order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="sort-select"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="info-card">
            <div className="card-header">
              <h3>All Orders</h3>
              <button 
                onClick={exportOrdersCsv}
                className="refresh-button"
                disabled={exportingOrders || ordersLoading}
                title="Export all filtered orders"
              >
                {exportingOrders ? '⏳ Exporting...' : '⬇️ Export CSV'}
              </button>
            </div>
            {ordersLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order._id} className="admin-order-card">
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
                        <div className="order-main-info">
                          <div className="info-item">
                            <span className="info-label">Employee:</span>
                            <span className="info-value">
                              {order.employee ? 
                                `${order.employee.firstName} ${order.employee.lastName}` : 
                                'Unknown Employee'
                              }
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-label">Vendor:</span>
                            <span className="info-value">
                              {order.vendor ? 
                                `${order.vendor.firstName} ${order.vendor.lastName}` : 
                                'Unknown Vendor'
                              }
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-label">Total:</span>
                            <span className="info-value total-amount">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-label">Items:</span>
                            <span className="info-value">{order.totalItems} items</span>
                          </div>
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="pagination-button"
                    >
                      ← Previous
                    </button>
                    
                    <span className="pagination-info">
                      Page {pagination.currentPage} of {pagination.totalPages} 
                      ({pagination.totalOrders} total orders)
                    </span>
                    
                    <button 
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-orders">
                <div className="no-orders-icon">📦</div>
                <h3>No Orders Found</h3>
                <p>
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No orders have been placed yet.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* By User Tab */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>👥 Orders by User</h2>
          </div>

          {/* Employee Search */}
          <div className="info-card">
            <div className="card-header">
              <h3>Search Employee</h3>
              {selectedEmployee && (
                <button 
                  onClick={() => handleEmployeeSelect(null)}
                  className="clear-selection-button"
                >
                  Clear Selection
                </button>
              )}
            </div>
            
            <div className="employee-search-container">
              <label htmlFor="employee-search">Search by name, employee ID, or department:</label>
              <div className="search-wrapper">
                <input
                  type="text"
                  id="employee-search"
                  value={employeeSearch}
                  onChange={handleEmployeeSearchChange}
                  onFocus={handleEmployeeSearchFocus}
                  onBlur={handleEmployeeSearchBlur}
                  placeholder={employees.length > 0 ? "Type to search employees..." : "Loading employees..."}
                  className="employee-search-input"
                  disabled={employees.length === 0}
                />
                
                {showEmployeeResults && employeeSearchResults.length > 0 && (
                  <div className="employee-search-results">
                    {employeeSearchResults.slice(0, 10).map((employee) => (
                      <div
                        key={employee.employeeId}
                        className="employee-search-result"
                      >
                        <div className="employee-info">
                          <div className="employee-name">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="employee-details">
                            <span className="employee-id">ID: {employee.employeeId}</span>
                            {employee.department && (
                              <span className="employee-department">{employee.department}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="select-employee-btn"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🔘 Select button clicked for:', employee.firstName, employee.lastName)
                            handleEmployeeSelect(employee)
                          }}
                          type="button"
                          role="button"
                          tabIndex={0}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                    {employeeSearchResults.length > 10 && (
                      <div className="search-results-more">
                        +{employeeSearchResults.length - 10} more results...
                      </div>
                    )}
                  </div>
                )}
                
                {showEmployeeResults && employeeSearch.length > 0 && employeeSearchResults.length === 0 && (
                  <div className="employee-search-no-results">
                    <div className="no-results-message">
                      No employees found matching "{employeeSearch}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEmployee && (
              <div className="selected-employee-info">
                <h4>📊 {selectedEmployee.name} - Order Summary</h4>
                <div className="employee-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Orders:</span>
                    <span className="stat-value">{selectedEmployee.totalOrders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value">{selectedEmployee.completedOrders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Spent:</span>
                    <span className="stat-value">{formatCurrency(selectedEmployee.totalSpent)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Department:</span>
                    <span className="stat-value">{selectedEmployee.department}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Orders List */}
          {selectedEmployee && (
            <div className="info-card">
              <div className="card-header">
                <h3>📦 Orders for {selectedEmployee.name}</h3>
              </div>
              
              {ordersLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading user orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order._id} className="admin-order-card">
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
                        <div className="order-main-info">
                          <div className="info-item">
                            <span className="info-label">Vendor:</span>
                            <span className="info-value">
                              {order.vendor ? 
                                `${order.vendor.firstName} ${order.vendor.lastName}` : 
                                'Unknown Vendor'
                              }
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-label">Total:</span>
                            <span className="info-value total-amount">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-label">Items:</span>
                            <span className="info-value">{order.totalItems} items</span>
                          </div>
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
                  <p>This employee hasn't placed any orders yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vendor Management Tab */}
      {activeTab === 'vendors' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🏪 Vendor Management</h2>
            <button 
              onClick={() => setShowVendorForm(!showVendorForm)}
              className="add-vendor-btn"
            >
              {showVendorForm ? '❌ Cancel' : '➕ Add Vendor'}
            </button>
          </div>

          {/* Add Vendor Form */}
          {showVendorForm && (
            <div className="vendor-form-container">
              <form onSubmit={handleVendorFormSubmit} className="vendor-form">
                <h3>Create New Vendor</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={vendorFormData.firstName}
                      onChange={handleVendorFormChange}
                      required
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={vendorFormData.lastName}
                      onChange={handleVendorFormChange}
                      required
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={vendorFormData.email}
                      onChange={handleVendorFormChange}
                      required
                      placeholder="vendor@company.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="employeeId">Employee ID *</label>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      value={vendorFormData.employeeId}
                      onChange={handleVendorFormChange}
                      required
                      placeholder="EMP001"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={vendorFormData.password}
                      onChange={handleVendorFormChange}
                      required
                      minLength="6"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contactNumber">Phone Number</label>
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      value={vendorFormData.contactNumber}
                      onChange={handleVendorFormChange}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={vendorFormData.department}
                      onChange={handleVendorFormChange}
                      placeholder="Food Services"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="position">Position</label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={vendorFormData.position}
                      onChange={handleVendorFormChange}
                      placeholder="Vendor"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowVendorForm(false)}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vendors List */}
          <div className="vendors-section">
            <h3>Existing Vendors ({vendors.length})</h3>
            
            {vendorsLoading ? (
              <div className="loading">Loading vendors...</div>
            ) : vendors.length > 0 ? (
              <div className="vendors-grid">
                {vendors.map((vendor) => (
                  <div key={vendor._id} className="vendor-card">
                    <div className="vendor-header">
                      <div className="vendor-name">
                        {vendor.firstName} {vendor.lastName}
                      </div>
                      <div className="vendor-status">
                        <span className={`status-badge ${vendor.isActive ? 'active' : 'inactive'}`}>
                          {vendor.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="vendor-details">
                      <div className="detail-item">
                        <span className="label">Employee ID:</span>
                        <span className="value">{vendor.employeeId}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{vendor.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Department:</span>
                        <span className="value">{vendor.department}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Position:</span>
                        <span className="value">{vendor.position}</span>
                      </div>
                      {vendor.contactNumber && (
                        <div className="detail-item">
                          <span className="label">Phone:</span>
                          <span className="value">{vendor.contactNumber}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="label">Created:</span>
                        <span className="value">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-vendors">
                <div className="no-vendors-icon">🏪</div>
                <h3>No Vendors Found</h3>
                <p>No vendors have been added yet. Click "Add Vendor" to create the first one.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Management Tab */}
      {activeTab === 'products' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🍽️ Product Management</h2>
            <div className="product-sub-tabs">
              <button 
                className={`sub-tab-btn ${productSubTab === 'list' ? 'active' : ''}`}
                onClick={() => setProductSubTab('list')}
              >
                📋 Product List
              </button>
              <button 
                className={`sub-tab-btn ${productSubTab === 'add' ? 'active' : ''}`}
                onClick={() => setProductSubTab('add')}
              >
                ➕ Add Product
              </button>
            </div>
          </div>

          {/* Product List Sub-tab */}
          {productSubTab === 'list' && (
            <div className="products-list-container">
              <div className="products-header">
                <h3>🍽️ All Products</h3>
                <div className="products-actions">
                  <button 
                    className="filter-toggle-btn"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    🔍 Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                  </button>
                  {getActiveFiltersCount() > 0 && (
                    <button className="clear-all-filters-btn" onClick={clearAllFilters}>
                      ✕ Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Form */}
              {showFilters && (
                <div className="product-filters-container">
                  <div className="filters-header">
                    <h4>🔧 Filter Products</h4>
                    <div className="filter-results">
                      Showing {getFilteredProducts().length} of {products.length} products
                    </div>
                  </div>
                  
                  <div className="filters-form">
                    <div className="filter-row">
                      <div className="filter-group">
                        <label>Search</label>
                        <input
                          type="text"
                          placeholder="Name or description"
                          value={productFilters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          className="filter-input"
                        />
                      </div>
                      
                      <div className="filter-group">
                        <label>Category</label>
                        <select
                          value={productFilters.category}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">All Categories</option>
                          {getUniqueCategories().map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="filter-group">
                        <label>Vendor</label>
                        <select
                          value={productFilters.vendor}
                          onChange={(e) => handleFilterChange('vendor', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">All Vendors</option>
                          <option value="no-vendor">No Vendor</option>
                          {vendors.map((vendor) => (
                            <option key={vendor._id} value={vendor._id}>
                              {vendor.firstName} {vendor.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="filter-row">
                      <div className="filter-group">
                        <label>Status</label>
                        <select
                          value={productFilters.availability}
                          onChange={(e) => handleFilterChange('availability', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">All Status</option>
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>
                      
                      <div className="filter-group">
                        <label>Min Price</label>
                        <input
                          type="number"
                          placeholder="₹0"
                          min="0"
                          step="0.01"
                          value={productFilters.priceMin}
                          onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                          className="filter-input"
                        />
                      </div>
                      
                      <div className="filter-group">
                        <label>Max Price</label>
                        <input
                          type="number"
                          placeholder="₹1000"
                          min="0"
                          step="0.01"
                          value={productFilters.priceMax}
                          onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                          className="filter-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {productsLoading ? (
                <div className="loading-products">
                  <p>🔄 Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="no-products">
                  <div className="no-products-icon">🍽️</div>
                  <h3>No Products Found</h3>
                  <p>No products have been added yet. Click "Add Product" to create the first one.</p>
                </div>
              ) : (
                <>
                  <div className="products-table-container">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Vendor</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedProducts().map((product) => (
                          <tr key={product._id}>
                            <td className="product-name">
                              {editingProduct === product._id ? (
                                <input
                                  type="text"
                                  value={editFormData.name || ''}
                                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                                  className="edit-input"
                                />
                              ) : (
                                product.name
                              )}
                            </td>
                            <td className="product-category">
                              {editingProduct === product._id ? (
                                <select
                                  value={editFormData.category || ''}
                                  onChange={(e) => handleEditFormChange('category', e.target.value)}
                                  className="edit-select"
                                >
                                  {getUniqueCategories().map((category) => (
                                    <option key={category} value={category}>
                                      {category}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                product.category
                              )}
                            </td>
                            <td className="product-price">
                              {editingProduct === product._id ? (
                                <input
                                  type="number"
                                  value={editFormData.price || ''}
                                  onChange={(e) => handleEditFormChange('price', parseFloat(e.target.value))}
                                  className="edit-input"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                `₹${product.price}`
                              )}
                            </td>
                            <td className="product-vendor">
                              {editingProduct === product._id ? (
                                <select
                                  value={editFormData.vendor || ''}
                                  onChange={(e) => handleEditFormChange('vendor', e.target.value)}
                                  className="edit-select"
                                >
                                  <option value="">No Vendor</option>
                                  {vendors.map((vendor) => (
                                    <option key={vendor._id} value={vendor._id}>
                                      {vendor.firstName} {vendor.lastName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                product.vendor ? 
                                  `${product.vendor.firstName} ${product.vendor.lastName}` : 
                                  'No vendor assigned'
                              )}
                            </td>
                            <td className="product-status">
                              {editingProduct === product._id ? (
                                <select
                                  value={editFormData.isAvailable ? 'available' : 'unavailable'}
                                  onChange={(e) => handleEditFormChange('isAvailable', e.target.value === 'available')}
                                  className="edit-select"
                                >
                                  <option value="available">Available</option>
                                  <option value="unavailable">Unavailable</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${product.isAvailable ? 'available' : 'unavailable'}`}>
                                  {product.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                              )}
                            </td>
                            <td className="product-actions">
                              {editingProduct === product._id ? (
                                <div className="edit-actions">
                                  <button
                                    onClick={() => handleSaveEdit(product._id)}
                                    className="save-btn"
                                    title="Save changes"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="cancel-btn"
                                    title="Cancel edit"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="action-buttons">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="edit-btn"
                                    title="Edit product"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(product._id)}
                                    className="delete-btn"
                                    title="Delete product"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {getFilteredProducts().length > productsPerPage && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing {((currentProductPage - 1) * productsPerPage) + 1} to {Math.min(currentProductPage * productsPerPage, getFilteredProducts().length)} of {getFilteredProducts().length} products
                      </div>
                      <div className="pagination">
                        <button
                          onClick={() => handleProductPageChange(currentProductPage - 1)}
                          disabled={currentProductPage === 1}
                          className="pagination-btn"
                        >
                          ← Previous
                        </button>
                        
                        <div className="pagination-pages">
                          {Array.from({ length: getTotalProductPages() }, (_, index) => {
                            const page = index + 1
                            return (
                              <button
                                key={page}
                                onClick={() => handleProductPageChange(page)}
                                className={`pagination-page ${currentProductPage === page ? 'active' : ''}`}
                              >
                                {page}
                              </button>
                            )
                          })}
                        </div>
                        
                        <button
                          onClick={() => handleProductPageChange(currentProductPage + 1)}
                          disabled={currentProductPage === getTotalProductPages()}
                          className="pagination-btn"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="modal-overlay">
              <div className="delete-modal">
                <h3>🗑️ Delete Product</h3>
                <p>Are you sure you want to delete this product? This action cannot be undone.</p>
                <div className="modal-actions">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="cancel-modal-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(deleteConfirm)}
                    className="delete-modal-btn"
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Product Sub-tab */}
          {productSubTab === 'add' && (
            <div className="product-form-container">
              <h3>Add New Product</h3>
              <form onSubmit={handleProductSubmit} className="product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={productFormData.name}
                      onChange={handleProductFormChange}
                      required
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={productFormData.category}
                      onChange={handleProductFormChange}
                      required
                    >
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Meals">Meals</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Bakery">Bakery</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price (₹) *</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={productFormData.price}
                      onChange={handleProductFormChange}
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stockQuantity">Stock Quantity</label>
                    <input
                      type="number"
                      id="stockQuantity"
                      name="stockQuantity"
                      value={productFormData.stockQuantity}
                      onChange={handleProductFormChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={productFormData.description}
                    onChange={handleProductFormChange}
                    rows="3"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="imageUrl">Product Image</label>
                  <div className="image-upload-section">
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={productFormData.imageUrl}
                      onChange={handleProductFormChange}
                      placeholder="Enter image URL or upload a file below"
                    />
                    <div className="file-upload-option">
                      <label htmlFor="imageFile" className="file-upload-label">
                        📁 Choose Image File
                      </label>
                      <input
                        type="file"
                        id="imageFile"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="file-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="vendor">Vendor</label>
                  <select
                    id="vendor"
                    name="vendor"
                    value={productFormData.vendor}
                    onChange={handleProductFormChange}
                    disabled={vendorsLoading}
                  >
                    <option value="">
                      {vendorsLoading ? 'Loading vendors...' : 'Select Vendor (Optional)'}
                    </option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.firstName} {vendor.lastName} ({vendor.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="nutritional-info-section">
                  <h4>Nutritional Information (Optional)</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="calories">Calories</label>
                      <input
                        type="number"
                        id="calories"
                        name="nutritionalInfo.calories"
                        value={productFormData.nutritionalInfo.calories}
                        onChange={handleProductFormChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="protein">Protein (g)</label>
                      <input
                        type="number"
                        id="protein"
                        name="nutritionalInfo.protein"
                        value={productFormData.nutritionalInfo.protein}
                        onChange={handleProductFormChange}
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="carbs">Carbs (g)</label>
                      <input
                        type="number"
                        id="carbs"
                        name="nutritionalInfo.carbs"
                        value={productFormData.nutritionalInfo.carbs}
                        onChange={handleProductFormChange}
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="fat">Fat (g)</label>
                      <input
                        type="number"
                        id="fat"
                        name="nutritionalInfo.fat"
                        value={productFormData.nutritionalInfo.fat}
                        onChange={handleProductFormChange}
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>

                <div className="allergens-section">
                  <h4>Allergens</h4>
                  <div className="allergen-checkboxes">
                    {['Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Fish', 'Shellfish'].map(allergen => (
                      <label key={allergen} className="allergen-checkbox">
                        <input
                          type="checkbox"
                          checked={productFormData.allergens.includes(allergen)}
                          onChange={() => handleAllergenChange(allergen)}
                        />
                        {allergen}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={productFormData.isAvailable}
                      onChange={handleProductFormChange}
                    />
                    Product is available
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowProductForm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="submit-btn"
                  >
                    {loading ? 'Creating...' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
              )}
 
        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>📝 User Feedback</h2>
            </div>

            <div className="admin-controls">
              <div className="control-group">
                <label>Search</label>
                <input
                  type="text"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  placeholder="Search message, vendor, orderId, contact..."
                  className="search-input"
                />
              </div>
              <div className="control-group">
                <label>Category</label>
                <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} className="filter-select">
                  <option value="">All</option>
                  <option value="Food Quality">Food Quality</option>
                  <option value="Hygiene">Hygiene</option>
                  <option value="Service">Service</option>
                  <option value="Price">Price</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="control-group">
                <button className="refresh-button" onClick={() => fetchAllFeedback(1)} disabled={feedbackLoading}>
                  {feedbackLoading ? '🔄' : '🔃'} Apply
                </button>
              </div>
            </div>

            <div className="info-card">
              <div className="card-header">
                <h3>User Feedback</h3>
                <button 
                  onClick={exportFeedbackCsv}
                  className="refresh-button"
                  disabled={feedbackLoading || exportingFeedback}
                  title="Export all filtered feedback"
                >
                  {exportingFeedback ? '⏳ Exporting...' : '⬇️ Export CSV'}
                </button>
              </div>
              {feedbackLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading feedback...</p>
                </div>
              ) : feedbackList.length > 0 ? (
                <div className="orders-list">
                  {feedbackList.map((fb) => (
                    <div key={fb._id} className="admin-order-card">
                      <div className="order-header">
                        <div className="order-id-section">
                          <span className="order-id">{fb.category} {fb.rating ? `(${fb.rating}/5)` : ''}</span>
                          <span className="order-date">{new Date(fb.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="order-details">
                        <div className="order-main-info">
                          <div className="info-item">
                            <span className="info-label">Employee ID:</span>
                            <span className="info-value">{fb.employeeId}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Source:</span>
                            <span className="info-value">{(!fb.user || fb.employeeId === 'GUEST') ? 'Public' : 'Authenticated'}</span>
                          </div>
                          {fb.vendorName && (
                            <div className="info-item">
                              <span className="info-label">Vendor:</span>
                              <span className="info-value">{fb.vendorName}</span>
                            </div>
                          )}
                          {fb.orderId && (
                            <div className="info-item">
                              <span className="info-label">Order ID:</span>
                              <span className="info-value">{fb.orderId}</span>
                            </div>
                          )}
                          {fb.contactInfo && (
                            <div className="info-item">
                              <span className="info-label">Contact:</span>
                              <span className="info-value">{fb.contactInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="order-items">
                        <h4>Message</h4>
                        <div className="items-grid">
                          <div className="order-item">
                            <div className="item-name" style={{ whiteSpace: 'pre-wrap' }}>{fb.message}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-orders">
                  <div className="no-orders-icon">📝</div>
                  <h3>No Feedback Found</h3>
                  <p>Try adjusting search or category filters.</p>
                </div>
              )}

              {feedbackPagination.totalPages > 1 && (
                <div className="pagination">
                  <button className="pagination-button" disabled={!feedbackPagination.hasPrev} onClick={() => fetchAllFeedback(feedbackPagination.page - 1)}>← Previous</button>
                  <span className="pagination-info">Page {feedbackPagination.page} of {feedbackPagination.totalPages} ({feedbackPagination.total} total)</span>
                  <button className="pagination-button" disabled={!feedbackPagination.hasNext} onClick={() => fetchAllFeedback(feedbackPagination.page + 1)}>Next →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast Notification */}
      {toastNotification && (
        <div className={`toast-notification toast-${toastNotification.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toastNotification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="toast-message">{toastNotification.message}</span>
            <button 
              className="toast-close"
              onClick={() => setToastNotification(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminDashboard 