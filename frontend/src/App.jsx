import { useState, useEffect, useRef } from 'react'
import './App.css'
import BudgetManager from './components/BudgetManager'
import Vendor from './components/Vendor'
import Payment from './components/Payment'
import RealPayment from './components/RealPayment'
import Profile from './components/Profile'
import AdminDashboard from './components/AdminDashboard'
import Menu from './components/Menu'
import AutoLogoutWarning from './components/AutoLogoutWarning'
import useAutoLogout from './hooks/useAutoLogout'
import { authAPI, usersAPI, productsAPI, ordersAPI, tokenUtils } from './services/api'
import Feedback from './components/Feedback'

function App() {
  console.log('🚀 App component loaded')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    position: '',
    phoneNumber: '',
    location: ''
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({})
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('2024-01') // Default to January 2024
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [activeTab, setActiveTab] = useState('budget')
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  })
  const [isPinEditing, setIsPinEditing] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')

  const [paymentHistory, setPaymentHistory] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loginPageTab, setLoginPageTab] = useState('menu')
  const [paymentMode, setPaymentMode] = useState('real') // 'real' or 'simulated'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  // Auto-logout functionality
  const [showLogoutWarning, setShowLogoutWarning] = useState(false)
  const [logoutWarningTime, setLogoutWarningTime] = useState(120) // 2 minutes default
  
  const mobileMenuRef = useRef(null)

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (tokenUtils.isAuthenticated()) {
          const userData = await authAPI.getCurrentUser()
          setCurrentUser(userData)
          setProfileData(userData)
          
          // Set appropriate default tab based on user type
          if (userData.userType === 'vendor') {
            setActiveTab('store')
          } else if (userData.userType === 'admin') {
            setActiveTab('admin')
          } else {
            setActiveTab('budget')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        authAPI.logout()
      }
      setInitialLoading(false)
    }

    checkAuthStatus()
  }, [])

  // Set selected month to January 2024 if purchase history contains that month
  useEffect(() => {
    if (currentUser?.purchaseHistory) {
      const availableMonths = [...new Set(currentUser.purchaseHistory.map(p => p.month))]
      console.log('🔄 Purchase history updated:', {
        historyLength: currentUser.purchaseHistory.length,
        availableMonths,
        currentSelectedMonth: selectedMonth
      })
      if (availableMonths.includes('2024-01')) {
        console.log('✅ Setting month to 2024-01')
        setSelectedMonth('2024-01')
      } else {
        console.log('❌ 2024-01 not found in available months')
      }
    }
  }, [currentUser?.purchaseHistory])

  // Load products only when a vendor logs in
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await productsAPI.getProducts()
        setAllProducts(products)
      } catch (error) {
        console.error('Failed to load products:', error)
      }
    }

    // Only load products if user is logged in and is a vendor
    if (currentUser && currentUser.userType === 'vendor') {
      loadProducts()
    }
  }, [currentUser])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    const trimmedValue = (name === 'email' || name === 'password') ? value.trim() : value
    
    setFormData(prevState => ({
      ...prevState,
      [name]: trimmedValue
    }))
    if (error) setError('')
  }

  const handleSignupChange = (e) => {
    const { name, value } = e.target
    const trimmedValue = (name === 'email' || name === 'password' || name === 'confirmPassword') ? value.trim() : value
    
    setSignupData(prevState => ({
      ...prevState,
      [name]: trimmedValue
    }))
    if (error) setError('')
    if (updateSuccess) setUpdateSuccess('')
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prevState => ({
      ...prevState,
      [name]: value
    }))
    if (updateSuccess) setUpdateSuccess('')
  }

  const handlePinChange = (e) => {
    const { name, value } = e.target
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    setPinData(prevState => ({
      ...prevState,
      [name]: numericValue
    }))
    if (updateSuccess) setUpdateSuccess('')
  }

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value)
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
  }

  const refreshUserData = async () => {
    try {
      setLoading(true)
      const userData = await authAPI.getCurrentUser()
      setCurrentUser(userData)
      setProfileData(userData)
      setError('')
      setUpdateSuccess('✅ Purchase history refreshed!')
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      setError('Failed to refresh data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateSignupForm = () => {
    const trimmedEmail = signupData.email.trim()
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address')
      return false
    }

    const trimmedPassword = signupData.password.trim()
    const trimmedConfirmPassword = signupData.confirmPassword.trim()
    
    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (signupData.phoneNumber) {
      const phoneRegex = /^\+1-\d{3}-\d{4}$/
      if (!phoneRegex.test(signupData.phoneNumber)) {
        setError('Phone number must be in format: +1-555-0123')
        return false
      }
    }

    if (!signupData.firstName || !signupData.lastName || !signupData.department || !signupData.position) {
      setError('Please fill in all required fields')
      return false
    }

    return true
  }

  const validatePinChange = () => {
    if (pinData.currentPin !== currentUser.secretPin) {
      setError('Current PIN is incorrect')
      return false
    }

    if (pinData.newPin.length !== 4) {
      setError('New PIN must be exactly 4 digits')
      return false
    }

    if (pinData.newPin !== pinData.confirmPin) {
      setError('New PIN and confirmation do not match')
      return false
    }

    if (pinData.newPin === currentUser.secretPin) {
      setError('New PIN must be different from current PIN')
      return false
    }

    return true
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUpdateSuccess('')

    if (!validateSignupForm()) {
      setLoading(false)
      return
    }

    try {
      const userData = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email.trim(),
        password: signupData.password.trim(),
        department: signupData.department,
        position: signupData.position,
        contactNumber: signupData.phoneNumber || '+1234567890',
        location: signupData.location || 'Remote',
        userType: 'employee'
      }

      const response = await authAPI.register(userData)
      
      setUpdateSuccess('Account created successfully! You can now log in.')
      setIsSignupMode(false)
      
      setSignupData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        position: '',
        phoneNumber: '',
        location: ''
      })
      
      console.log('New user created:', response.user)
    } catch (error) {
      console.error('Signup error:', error)
      setError(error.message || 'Registration failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login(formData.email, formData.password)
      
      setCurrentUser(response.user)
      setProfileData(response.user)
      
      if (response.user.userType === 'vendor') {
        setActiveTab('store')
      } else if (response.user.userType === 'admin') {
        setActiveTab('admin')
      } else {
        setActiveTab('budget')
      }
      
      console.log('Login successful:', response.user)
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    console.log('🚀 Forgot password form submitted')
    setForgotPasswordLoading(true)
    setForgotPasswordMessage('')
    setError('')

    try {
      console.log('🔄 Sending forgot password request for:', forgotPasswordEmail)
      const response = await authAPI.forgotPassword(forgotPasswordEmail)
      console.log('✅ Forgot password response:', response)
      
      setForgotPasswordMessage(response.message || 'Password reset email has been sent successfully!')
      setForgotPasswordEmail('')
      
      // Auto-dismiss the message after 8 seconds
      setTimeout(() => {
        setForgotPasswordMessage('')
      }, 8000)
      
    } catch (error) {
      console.error('❌ Forgot password error:', error)
      setError(error.message || 'Failed to send reset email. Please try again.')
    }
    
    setForgotPasswordLoading(false)
    console.log('🏁 Forgot password process completed')
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUpdateSuccess('')

    const phoneRegex = /^\+1-\d{3}-\d{4}$/
    if (profileData.contactNumber && !phoneRegex.test(profileData.contactNumber)) {
      setError('Phone number must be in format: +1-555-0123')
      setLoading(false)
      return
    }

    try {
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        contactNumber: profileData.contactNumber,
        department: profileData.department,
        position: profileData.position,
        location: profileData.location
      }

      const response = await usersAPI.updateProfile(updateData)
      
      setCurrentUser(response.user)
      setProfileData(response.user)
      setIsEditing(false)
      setUpdateSuccess('Profile updated successfully!')
      
      console.log('Profile updated:', response.user)
    } catch (error) {
      console.error('Profile update error:', error)
      setError(error.message || 'Profile update failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handlePinUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUpdateSuccess('')

    if (!validatePinChange()) {
      setLoading(false)
      return
    }

    try {
      await usersAPI.updatePin(pinData.currentPin, pinData.newPin)
      
      const updatedCurrentUser = { ...currentUser, secretPin: pinData.newPin }
      setCurrentUser(updatedCurrentUser)
      setProfileData(updatedCurrentUser)
      setIsPinEditing(false)
      setPinData({ currentPin: '', newPin: '', confirmPin: '' })
      setUpdateSuccess('PIN updated successfully!')
      
      console.log('PIN updated for user:', updatedCurrentUser.email)
    } catch (error) {
      console.error('PIN update error:', error)
      setError(error.message || 'PIN update failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handleLogout = () => {
    authAPI.logout()
    setCurrentUser(null)
    setFormData({ email: '', password: '' })
    setError('')
    setEmailStatus('')
    setIsEditing(false)
    setIsPinEditing(false)
    setProfileData({})
    setPinData({ currentPin: '', newPin: '', confirmPin: '' })
    setUpdateSuccess('')
    setShowLogoutWarning(false) // Hide warning if shown
    console.log('👋 User logged out')
  }

  // Auto-logout handlers
  const handleAutoLogoutWarning = (remainingSeconds) => {
    console.log('⚠️ Auto-logout warning triggered, remaining time:', remainingSeconds, 'seconds')
    setLogoutWarningTime(remainingSeconds)
    setShowLogoutWarning(true)
  }

  const handleStayLoggedIn = () => {
    console.log('🔄 User chose to stay logged in')
    setShowLogoutWarning(false)
    // The hook will automatically reset the timer when this is called
  }

  const handleLogoutNow = () => {
    console.log('🚪 User chose to logout immediately')
    handleLogout()
  }

  // Initialize auto-logout hook
  useAutoLogout({
    isAuthenticated: !!currentUser,
    onLogout: handleLogout,
    onWarning: handleAutoLogoutWarning,
    idleTime: 15 * 60 * 1000, // 15 minutes
    warningTime: 2 * 60 * 1000  // 2 minutes warning
  })

  const handleBudgetUpdate = async (budgetData) => {
    setLoading(true)
    setError('')
    setUpdateSuccess('')

    try {
      const response = await usersAPI.updateBudget(budgetData.monthlyLimit)
      
      // Update current user with new budget
      const updatedUser = { 
        ...currentUser, 
        pantryBudget: {
          ...currentUser.pantryBudget,
          monthlyLimit: budgetData.monthlyLimit
        }
      }
      setCurrentUser(updatedUser)
      setUpdateSuccess('Pantry budget updated successfully!')
      
      console.log('Budget updated:', response.pantryBudget)
    } catch (error) {
      console.error('Budget update error:', error)
      setError(error.message || 'Budget update failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handlePurchaseComplete = async (purchaseData) => {
    setLoading(true)
    setError('')
    setUpdateSuccess('')
    setEmailStatus('')

    try {
      setEmailStatus('📧 Processing order...')
      
      // For vendor purchases, use the orders API
      if (currentUser.userType === 'vendor') {
        const response = await ordersAPI.createOrder(
          purchaseData.employeeId,
          purchaseData.items,
          purchaseData.pin
        )
        
        setEmailStatus('✅ Order completed successfully!')
        setUpdateSuccess(`🎉 Order #${response.order.orderId} completed! Bought ${purchaseData.totalItems} items for ₹${purchaseData.total.toFixed(2)} for ${purchaseData.employeeName}. Email confirmation sent!`)
        
        setLoading(false)
        return response // Return the response to the caller
      } else {
        // For employee self-purchases, update budget directly
        const updatedUser = {
          ...currentUser,
          pantryBudget: {
            ...currentUser.pantryBudget,
            currentSpent: currentUser.pantryBudget.currentSpent + purchaseData.total
          }
        }
        setCurrentUser(updatedUser)
        setUpdateSuccess(`🎉 Purchase completed! Bought ${purchaseData.totalItems} items for ₹${purchaseData.total.toFixed(2)}`)
        setActiveTab('history')
        
        setLoading(false)
        return { success: true }
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setError(error.message || 'Purchase failed. Please try again.')
      setEmailStatus('⚠️ Purchase failed')
      setLoading(false)
      throw error // Re-throw so Vendor component can handle it
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setProfileData(currentUser)
      setError('')
      setUpdateSuccess('')
    }
    setIsEditing(!isEditing)
  }

  const handlePinEditToggle = () => {
    if (isPinEditing) {
      setPinData({ currentPin: '', newPin: '', confirmPin: '' })
      setError('')
      setUpdateSuccess('')
    }
    setIsPinEditing(!isPinEditing)
  }

  const handleModeToggle = () => {
    setIsSignupMode(!isSignupMode)
    setError('')
    setUpdateSuccess('')
    setFormData({ email: '', password: '' })
    setSignupData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      position: '',
      phoneNumber: '',
      location: ''
    })
  }

  const handleTabChange = (tabName) => {
    console.log('🔄 Tab Change:', { from: activeTab, to: tabName, isVendor, userType: currentUser?.userType })
    setActiveTab(tabName)
    setIsMobileMenuOpen(false)
    if (emailStatus) setEmailStatus('')
    if (updateSuccess) setUpdateSuccess('')
    if (error) setError('')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleNotify = (type, message) => {
    if (type === 'success') {
      setUpdateSuccess(message)
      setError('')
      setEmailStatus('')
    } else if (type === 'error') {
      setError(message)
      // Keep existing success/email messages separate
    }
  }

  const handlePaymentComplete = (paymentData) => {
    const newPayment = {
      ...paymentData,
      employeeId: currentUser.id,
      employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
      id: paymentData.paymentId
    }
    
    setPaymentHistory(prev => [newPayment, ...prev])

    const updatedBudget = {
      ...currentUser.pantryBudget,
      monthlyLimit: currentUser.pantryBudget.monthlyLimit + paymentData.amount,
      lastUpdated: new Date().toISOString().slice(0, 10)
    }

    const updatedUser = {
      ...currentUser,
      pantryBudget: updatedBudget
    }

    setCurrentUser(updatedUser)

    setUpdateSuccess(`Payment successful! ₹${paymentData.amount.toFixed(2)} added to your budget. Payment ID: ${paymentData.paymentId}`)
    setActiveTab('payment')
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    setError('Payment processing failed. Please try again.')
  }



  const getFilteredPurchases = () => {
    if (!currentUser?.purchaseHistory) return []
    
    // Debug logging
    console.log('🔍 Debug Filter Info:', {
      selectedMonth,
      totalPurchases: currentUser.purchaseHistory.length,
      samplePurchase: currentUser.purchaseHistory[0],
      availableMonths: [...new Set(currentUser.purchaseHistory.map(p => p.month))],
      selectedCategory
    })
    
    let filtered = currentUser.purchaseHistory.filter(purchase => {
      const matches = purchase.month === selectedMonth
      if (!matches) {
        console.log(`❌ Month mismatch: "${purchase.month}" !== "${selectedMonth}" for ${purchase.productName}`)
      }
      return matches
    })

    console.log(`✅ Filtered results: ${filtered.length} purchases for month ${selectedMonth}`)

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(purchase => purchase.category === selectedCategory)
      console.log(`✅ After category filter: ${filtered.length} purchases`)
    }

    return filtered.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
  }

  const getMonthlyPurchaseSummary = () => {
    const purchases = getFilteredPurchases()
    const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.price, 0)
    const totalItems = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0)
    const categories = [...new Set(purchases.map(p => p.category))]
    
    return {
      totalSpent,
      totalItems,
      totalPurchases: purchases.length,
      categories: categories.length
    }
  }

  const getAvailableMonths = () => {
    if (!currentUser?.purchaseHistory) return []
    
    const months = [...new Set(currentUser.purchaseHistory.map(p => p.month))]
    return months.sort().reverse()
  }

  const getAvailableCategories = () => {
    if (!currentUser?.purchaseHistory) return ['All']
    
    const categories = [...new Set(currentUser.purchaseHistory.map(p => p.category))]
    return ['All', ...categories.sort()]
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

  const formatMonthName = (monthString) => {
    const date = new Date(monthString + '-01')
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Show loading spinner during initial auth check
  if (initialLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, show dashboard
  if (currentUser) {
    const filteredPurchases = getFilteredPurchases()
    const purchaseSummary = getMonthlyPurchaseSummary()
    const availableMonths = getAvailableMonths()
    const availableCategories = getAvailableCategories()
    const isVendor = currentUser.userType === 'vendor'
    const isAdmin = currentUser.userType === 'admin'

    console.log('🎯 User Check:', { 
      userType: currentUser?.userType, 
      isVendor, 
      activeTab,
      employeeId: currentUser?.employeeId,
      firstName: currentUser?.firstName 
    })

  return (
      <div className="app">

        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Welcome, {currentUser.firstName}! {isVendor && '(Vendor)'} {isAdmin && '(Admin)'}</h1>
            <div className="header-buttons">
              {!isVendor && !isAdmin && activeTab === 'profile' && (
                <button onClick={handleEditToggle} className="edit-button">
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {emailStatus && <div className="email-status-message">{emailStatus}</div>}
          
          {/* Low Budget Alert for Employees */}
          {!isVendor && currentUser?.pantryBudget && 
           (currentUser.pantryBudget.monthlyLimit - currentUser.pantryBudget.currentSpent) < 10 &&
           (currentUser.pantryBudget.monthlyLimit - currentUser.pantryBudget.currentSpent) > 0 && (
            <div className="low-budget-warning dashboard-warning">
              <div className="warning-icon">💰</div>
              <div className="warning-content">
                <strong>Budget Running Low!</strong>
                <p>You have ₹{((Number(currentUser.pantryBudget.monthlyLimit) || 0) - (Number(currentUser.pantryBudget.currentSpent) || 0)).toFixed(2)} remaining this month. Consider adjusting your budget or planning purchases carefully.</p>
              </div>
            </div>
          )}


          
          {/* Navigation - Only show for employees */}
          {!isVendor && !isAdmin && (
            <>
              {/* Desktop Navigation Tabs */}
              <div className="tab-navigation desktop-nav">
                <button 
                  className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`}
                  onClick={() => {
                    console.log('🎯 Budget tab clicked!');
                    setActiveTab('budget');
                  }}
                  style={{cursor: 'pointer'}}
                >
                  💰 Budget
                </button>
                <button 
                  className={`tab-button ${activeTab === 'payment' ? 'active' : ''}`}
                  onClick={() => {
                    console.log('🎯 Add Funds tab clicked!');
                    setActiveTab('payment');
                  }}
                  style={{cursor: 'pointer'}}
                >
                  💳 Add Funds
                </button>
                <button 
                  className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => {
                    console.log('🎯 Purchases tab clicked!');
                    setActiveTab('history');
                  }}
                  style={{cursor: 'pointer'}}
                >
                  📦 Purchases
                </button>
                <button 
                  className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => {
                    console.log('🎯 Orders tab clicked!');
                    setActiveTab('orders');
                  }}
                  style={{cursor: 'pointer'}}
                >
                  📋 Orders
                </button>
                <button 
                  className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => {
                    console.log('🎯 User Profile tab clicked!');
                    setActiveTab('profile');
                  }}
                  style={{cursor: 'pointer'}}
                >
                  👤 User Profile
                </button>
                <button 
                  className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
                  onClick={() => {
                    console.log('🎯 Feedback tab clicked!');
                    setActiveTab('feedback');
                  }}
                  style={{cursor: 'pointer'}}
                >
                  📝 Feedback
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="mobile-nav" ref={mobileMenuRef}>
                <div className="mobile-nav-header">
                  <div className="current-tab-indicator">
                    <span className="current-tab-icon">
                      {activeTab === 'budget' && '💰'}
                      {activeTab === 'payment' && '💳'}
                      {activeTab === 'history' && '📦'}
                      {activeTab === 'orders' && '📋'}
                      {activeTab === 'profile' && '👤'}
                      {activeTab === 'feedback' && '📝'}
                    </span>
                    <span className="current-tab-name">
                      {activeTab === 'budget' && 'Budget'}
                      {activeTab === 'payment' && 'Add Funds'}
                      {activeTab === 'history' && 'Purchases'}
                      {activeTab === 'orders' && 'Orders'}
                      {activeTab === 'profile' && 'Profile'}
                      {activeTab === 'feedback' && 'Feedback'}
                    </span>
                  </div>
                  <button 
                    className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                  >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                  </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <div className={`mobile-menu-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
                  <button 
                    className={`mobile-menu-item ${activeTab === 'budget' ? 'active' : ''}`}
                    onClick={() => handleTabChange('budget')}
                  >
                    <span className="menu-icon">💰</span>
                    <span className="menu-text">Budget</span>
                  </button>
                  <button 
                    className={`mobile-menu-item ${activeTab === 'payment' ? 'active' : ''}`}
                    onClick={() => handleTabChange('payment')}
                  >
                    <span className="menu-icon">💳</span>
                    <span className="menu-text">Add Funds</span>
                  </button>
                  <button 
                    className={`mobile-menu-item ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => handleTabChange('history')}
                  >
                    <span className="menu-icon">📦</span>
                    <span className="menu-text">Purchases</span>
                  </button>
                  <button 
                    className={`mobile-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => handleTabChange('orders')}
                  >
                    <span className="menu-icon">📋</span>
                    <span className="menu-text">Orders</span>
                  </button>
                  <button 
                    className={`mobile-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => handleTabChange('profile')}
                  >
                    <span className="menu-icon">👤</span>
                    <span className="menu-text">User Profile</span>
                  </button>
                  <button 
                    className={`mobile-menu-item ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => handleTabChange('feedback')}
                  >
                    <span className="menu-icon">📝</span>
                    <span className="menu-text">Feedback</span>
                  </button>
                </div>
              </div>
            </>
          )}
          
          <div className="user-info">
            {/* Admin Interface */}
            {isAdmin && activeTab === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
                updateSuccess={updateSuccess}
                setUpdateSuccess={setUpdateSuccess}
              />
            )}

            {/* Vendor Interface */}
            {isVendor && (
              <div className="info-card">
                <Vendor
                  currentUser={currentUser}
                  allProducts={allProducts}
                  onPurchaseComplete={handlePurchaseComplete}
                  loading={loading}
                  error={error}
                  setError={setError}
                  updateSuccess={updateSuccess}
                  setUpdateSuccess={setUpdateSuccess}
                />
              </div>
            )}

            {/* Employee Interface - Tab-based content */}
            {activeTab === 'budget' && !isVendor && (
              <BudgetManager
                currentUser={currentUser}
                onBudgetUpdate={handleBudgetUpdate}
                loading={loading}
                error={error}
                setError={setError}
                updateSuccess={updateSuccess}
                setUpdateSuccess={setUpdateSuccess}
              />
            )}

            {activeTab === 'payment' && !isVendor && (
              <div className="info-card">
                <RealPayment
                  currentUser={currentUser}
                  onPaymentComplete={handlePaymentComplete}
                  onPaymentError={handlePaymentError}
                />
              </div>
            )}

            {activeTab === 'orders' && !isVendor && (
              <Profile
                currentUser={currentUser}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
                updateSuccess={updateSuccess}
                setUpdateSuccess={setUpdateSuccess}
              />
            )}

            {activeTab === 'feedback' && !isVendor && (
              <Feedback currentUser={currentUser} onNotify={handleNotify} />
            )}

            {console.log('🔍 Tab Check:', { activeTab, isVendor, shouldShowHistory: activeTab === 'history' && !isVendor })}
            {activeTab === 'history' && !isVendor && (
              <div className="info-card">
                <div className="card-header">
                  <h2>Purchase History</h2>
                </div>
                
                <div className="purchase-filters">
                  <div className="filter-group">
                    <label htmlFor="monthFilter">Select Month:</label>
                    <select
                      id="monthFilter"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                    >
                      {availableMonths.map(month => (
                        <option key={month} value={month}>
                          {formatMonthName(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="categoryFilter">Category:</label>
                    <select
                      id="categoryFilter"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                    >
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <button 
                      className="refresh-button"
                      onClick={refreshUserData}
                      disabled={loading}
                      title="Refresh purchase history"
                    >
                      {loading ? '🔄' : '🔃'} Refresh
                    </button>
                  </div>
                </div>

                {/* Monthly Summary */}
                <div className="purchase-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Spent:</span>
                    <span className="summary-value">₹{purchaseSummary.totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Items:</span>
                    <span className="summary-value">{purchaseSummary.totalItems}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Purchases:</span>
                    <span className="summary-value">{purchaseSummary.totalPurchases}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Categories:</span>
                    <span className="summary-value">{purchaseSummary.categories}</span>
                  </div>
                </div>

                {/* Purchase List */}
                <div className="purchase-list">

                  {filteredPurchases.length > 0 ? (
                    <>
                      <h3>Purchases for {formatMonthName(selectedMonth)}</h3>
                      <div className="purchases-grid">
                        {filteredPurchases.map((purchase) => (
                          <div key={purchase.id} className="purchase-item">
                            <div className="purchase-header">
                              <span className="product-name">{purchase.productName}</span>
                              <span className="purchase-price">₹{purchase.price.toFixed(2)}</span>
                            </div>
                            <div className="purchase-details">
                              <span className="purchase-category">{purchase.category}</span>
                              <span className="purchase-quantity">
                                {purchase.quantity} {purchase.unit}
                              </span>
                            </div>
                            <div className="purchase-date">
                              {formatDate(purchase.purchaseDate)}
                              {purchase.vendorName && (
                                <div className="vendor-info">
                                  Purchased by: {purchase.vendorName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="no-purchases">
                      <p>No purchases found for {formatMonthName(selectedMonth)}</p>
                      {selectedCategory !== 'All' && (
                        <p>Try selecting "All" categories or a different month.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && !isVendor && (
              <div className="info-card">
                <h2>{isEditing ? 'Edit Profile' : 'Employee Information'}</h2>
                
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name:</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName || ''}
                          onChange={handleProfileChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="lastName">Last Name:</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName || ''}
                          onChange={handleProfileChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profileData.email || ''}
                          onChange={handleProfileChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="contactNumber">Phone Number:</label>
                        <input
                          type="tel"
                          id="contactNumber"
                          name="contactNumber"
                          value={profileData.contactNumber || ''}
                          onChange={handleProfileChange}
                          placeholder="+1-555-0123"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="department">Department:</label>
                        <select
                          id="department"
                          name="department"
                          value={profileData.department || ''}
                          onChange={handleProfileChange}
                          required
                          disabled={loading}
                        >
                          <option value="">Select Department</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Sales">Sales</option>
                          <option value="Operations">Operations</option>
                          <option value="Design">Design</option>
                          <option value="Customer Support">Customer Support</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="position">Position:</label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={profileData.position || ''}
                          onChange={handleProfileChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="location">Location:</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={profileData.location || ''}
                          onChange={handleProfileChange}
                          placeholder="City, State"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="save-button" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="info-grid">
                      <div className="info-item">
                        <strong>Employee ID:</strong> {currentUser.employeeId}
                      </div>
                      <div className="info-item">
                        <strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}
                      </div>
                      <div className="info-item">
                        <strong>Email:</strong> {currentUser.email}
                      </div>
                      <div className="info-item">
                        <strong>Department:</strong> {currentUser.department}
                      </div>
                      <div className="info-item">
                        <strong>Position:</strong> {currentUser.position}
                      </div>
                      <div className="info-item">
                        <strong>Location:</strong> {currentUser.location}
                      </div>
                      <div className="info-item">
                        <strong>Phone:</strong> {currentUser.contactNumber}
                      </div>
                      <div className="info-item">
                        <strong>User Type:</strong> {currentUser.userType}
                      </div>
                    </div>

                    {/* PIN Management Section */}
                    <div className="pin-management-section">
                      <div className="card-header">
                        <h3>🔐 Security PIN Management</h3>
                        <button onClick={handlePinEditToggle} className="edit-button small">
                          {isPinEditing ? 'Cancel' : 'Change PIN'}
                        </button>
                      </div>

                      {isPinEditing ? (
                        <form onSubmit={handlePinUpdate} className="pin-form">
                          <div className="pin-form-section">
                            <div className="form-group">
                              <label htmlFor="currentPin">Current PIN:</label>
                              <input
                                type="password"
                                id="currentPin"
                                name="currentPin"
                                value={pinData.currentPin}
                                onChange={handlePinChange}
                                placeholder="Enter current PIN"
                                maxLength="4"
                                required
                                disabled={loading}
                                className="pin-input-small"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="newPin">New PIN:</label>
                              <input
                                type="password"
                                id="newPin"
                                name="newPin"
                                value={pinData.newPin}
                                onChange={handlePinChange}
                                placeholder="Enter new 4-digit PIN"
                                maxLength="4"
                                required
                                disabled={loading}
                                className="pin-input-small"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="confirmPin">Confirm New PIN:</label>
                              <input
                                type="password"
                                id="confirmPin"
                                name="confirmPin"
                                value={pinData.confirmPin}
                                onChange={handlePinChange}
                                placeholder="Confirm new PIN"
                                maxLength="4"
                                required
                                disabled={loading}
                                className="pin-input-small"
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="save-button" disabled={loading}>
                              {loading ? 'Updating...' : 'Update PIN'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="pin-display">
                          <div className="pin-info-card">
                            <div className="pin-current">
                              <span className="pin-label">Current PIN:</span>
                              <span className="pin-value">••••</span>
                            </div>
                            <div className="pin-description">
                              <p>Your 4-digit PIN is used to authorize purchases when vendors shop on your behalf. Keep it secure and change it regularly.</p>
                            </div> 
                          </div>
                        </div>
                      )} 
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <span className="laptop-icon">💻</span>
                <span className="coffee-icon">☕</span>
              </div>
              <div className="logo-text">
                <span className="logo-primary">Dine</span>
                <span className="logo-secondary">Tech</span>
              </div>
            </div>
            
            {/* Top-right corner buttons */}
            <div className="header-buttons">
              <button 
                className={`header-button ${loginPageTab === 'menu' ? 'active' : ''}`}
                onClick={() => setLoginPageTab('menu')}
                onTouchStart={(e) => e.preventDefault()}
                title="Menu / Home"
                type="button"
              >
                🍽️ Menu
              </button>
              <button 
                className={`header-button ${loginPageTab === 'login' ? 'active' : ''}`}
                onClick={() => setLoginPageTab('login')}
                onTouchStart={(e) => e.preventDefault()}
                title="Login / Sign Up"
                type="button"
              >
                🔐 {isSignupMode ? 'Sign Up' : 'Login'}
              </button>
              <button 
                className={`header-button ${loginPageTab === 'flowchart' ? 'active' : ''}`}
                onClick={() => setLoginPageTab('flowchart')}
                onTouchStart={(e) => e.preventDefault()}
                title="System Flow Chart"
                type="button"
              >
                📊 Flow
              </button>
            </div>
          </div>
          
          {loginPageTab === 'login' && (
            <div className="login-mode-header">
              <h2>{isSignupMode ? 'Create Account' : 'Employee Login'}</h2>
              <button 
                onClick={handleModeToggle} 
                onTouchStart={(e) => e.preventDefault()}
                className="mode-toggle-button"
                type="button"
              >
                {isSignupMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          )}
        </div>
        
        {/* Content */}
        {loginPageTab === 'menu' && (
          <div className="menu-tab-content">
          </div>
        )}
        
        {loginPageTab === 'login' && (
          <>
            {updateSuccess && <div className="success-message">{updateSuccess}</div>}
            {error && <div className="error-message">{error}</div>}

            {isSignupMode ? (
          <form onSubmit={handleSignup} className="auth-form signup-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name: *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={signupData.firstName}
                  onChange={handleSignupChange}
                  required
                  disabled={loading}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name: *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={signupData.lastName}
                  onChange={handleSignupChange}
                  required
                  disabled={loading}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email: *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
                disabled={loading}
                placeholder="Enter your email address"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password: *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                  disabled={loading}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password: *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  required
                  disabled={loading}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department: *</label>
                <select
                  id="department"
                  name="department"
                  value={signupData.department}
                  onChange={handleSignupChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Design">Design</option>
                  <option value="Customer Support">Customer Support</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="position">Position: *</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={signupData.position}
                  onChange={handleSignupChange}
                  required
                  disabled={loading}
                  placeholder="Enter your job title"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number:</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={signupData.phoneNumber}
                  onChange={handleSignupChange}
                  disabled={loading}
                  placeholder="+1-555-0123 (optional)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location:</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={signupData.location}
                  onChange={handleSignupChange}
                  disabled={loading}
                  placeholder="City, State (optional)"
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="form-note">
              <p>* Required fields</p>
              <p>You'll receive a default pantry budget of ₹100/month and a secure 4-digit PIN</p>
            </div>
          </form>
        ) : (
          <div className="login-sections-container">
            {/* Left Section - Login Form */}
            <div className="login-section">
              <h3>Sign In</h3>
              <form onSubmit={handleSubmit} className="auth-form login-form">
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your company email"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
                
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              
              <div className="forgot-password-section">
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                >
                  Forgot Password?
                </button>
                
                {showForgotPassword && (
                  <div className="forgot-password-form">
                    <h4>Reset Password</h4>
                    <p>Enter your email address and we'll send you a reset link.</p>
                    
                    {/* Debug: Show current state */}
                    <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
                      Debug - Message state: {forgotPasswordMessage ? `"${forgotPasswordMessage}"` : 'empty'}
                    </div>
                    
                    {forgotPasswordMessage && (
                      <div className="forgot-password-success">
                        <div className="success-icon">✅</div>
                        <div className="success-content">
                          <strong>Email Sent!</strong>
                          <p>{forgotPasswordMessage}</p>
                          <small>Please check your email inbox and spam folder.</small>
                        </div>
                        <button 
                          className="close-notification"
                          onClick={() => setForgotPasswordMessage('')}
                          title="Close notification"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={handleForgotPassword}>
                      <div className="form-group">
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                          disabled={forgotPasswordLoading}
                        />
                      </div>
                      
                      <div className="forgot-password-actions">
                        <button 
                          type="submit" 
                          className="auth-button small"
                          disabled={forgotPasswordLoading}
                        >
                          {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <button 
                          type="button" 
                          className="cancel-button"
                          onClick={() => {
                            setShowForgotPassword(false)
                            setForgotPasswordEmail('')
                            setForgotPasswordMessage('')
                          }}
                          onTouchStart={(e) => e.preventDefault()}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Demo Credentials */}
            <div className="demo-section">
              <div className="demo-credentials">
                <h3>🚀 Try the Demo</h3>
                <p className="demo-intro">Use these credentials to explore the system:</p>
                
                <div className="credential-card employee-card">
                  <h4>👤 Employee Access</h4>
                  <div className="credential-item">
                    <span className="credential-label">Email:</span>
                    <span className="credential-value">john.smith@company.com</span>
                  </div>
                  <div className="credential-item">
                    <span className="credential-label">Password:</span>
                    <span className="credential-value">password123</span>
                  </div>
                </div>

                <div className="credential-card vendor-card">
                  <h4>🏪 Vendor Access</h4>
                  <div className="credential-item">
                    <span className="credential-label">Email:</span>
                    <span className="credential-value">alice.vendor@company.com</span>
                  </div>
                  <div className="credential-item">
                    <span className="credential-label">Password:</span>
                    <span className="credential-value">vendor123</span>
                  </div>
                </div>

                <div className="credential-card admin-card">
                  <h4>🛡️ Admin Access</h4>
                  <div className="credential-item">
                    <span className="credential-label">Email:</span>
                    <span className="credential-value">admin@dinetech.com</span>
                  </div>
                  <div className="credential-item">
                    <span className="credential-label">Password:</span>
                    <span className="credential-value">admin123</span>
                  </div>
                </div>

                <div className="pin-info">
                  <h4>🔑 Employee PINs (for vendor orders)</h4>
                  <div className="pin-list">
                    <div className="pin-item">
                      <span>John Smith:</span>
                      <span className="pin-value">1234</span>
                    </div>
                    <div className="pin-item">
                      <span>Sarah Johnson:</span>
                      <span className="pin-value">5678</span>
                    </div>
                    <div className="pin-item">
                      <span>Michael Brown:</span>
                      <span className="pin-value">9012</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Flowchart Tab Content */}
        {loginPageTab === 'flowchart' && (
          <div className="flowchart-tab-content">
            <div className="workflow-section">
              <h3>🔄 Dine Tech System Flow</h3>
              <div className="flowchart-container">
                <div className="diagram-flowchart">
                  
                  {/* Start Node */}
                  <div className="flow-node start-node">
                    <div className="node-icon">🔐</div>
                    <div className="node-text">User Login</div>
                  </div>
                  
                  {/* Decision Diamond */}
                  <div className="flow-connector vertical"></div>
                  <div className="flow-node decision-node">
                    <div className="diamond-shape">
                      <div className="diamond-content">
                        <div className="node-text">User Type?</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Branch Connectors */}
                  <div className="branch-container">
                    <div className="branch-connector left"></div>
                    <div className="branch-connector right"></div>
                  </div>
                  
                  {/* Employee Path */}
                  <div className="flow-path employee-path">
                    <div className="path-label">Employee</div>
                    
                    <div className="flow-node employee-node">
                      <div className="node-icon">👤</div>
                      <div className="node-text">Dashboard</div>
                    </div>
                    
                    <div className="flow-connector vertical short"></div>
                    
                    <div className="action-group">
                      <div className="action-node">
                        <div className="node-icon">💰</div>
                        <div className="node-text">Check Budget</div>
                      </div>
                      <div className="action-node">
                        <div className="node-icon">💳</div>
                        <div className="node-text">Add Funds</div>
                      </div>
                      <div className="action-node">
                        <div className="node-icon">📊</div>
                        <div className="node-text">View History</div>
                      </div>
                      <div className="action-node">
                        <div className="node-icon">⚙️</div>
                        <div className="node-text">Update Profile</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vendor Path */}
                  <div className="flow-path vendor-path">
                    <div className="path-label">Vendor</div>
                    
                    <div className="flow-node vendor-node">
                      <div className="node-icon">🏪</div>
                      <div className="node-text">Store Interface</div>
                    </div>
                    
                    <div className="flow-connector vertical short"></div>
                    
                    <div className="vendor-process">
                      <div className="process-node">
                        <div className="node-icon">🔍</div>
                        <div className="node-text">Search & Select Employee</div>
                      </div>
                      
                      <div className="flow-connector vertical mini"></div>
                      
                      <div className="process-node">
                        <div className="node-icon">🛒</div>
                        <div className="node-text">Browse Products</div>
                      </div>
                      
                      <div className="flow-connector vertical mini"></div>
                      
                      <div className="process-node">
                        <div className="node-icon">➕</div>
                        <div className="node-text">Add Items to Cart</div>
                      </div>
                      
                      <div className="flow-connector vertical mini"></div>
                      
                      <div className="process-node">
                        <div className="node-icon">💳</div>
                        <div className="node-text">Proceed to Checkout</div>
                      </div>
                      
                      <div className="flow-connector vertical mini"></div>
                      
                      <div className="flow-node decision-node small">
                        <div className="diamond-shape small">
                          <div className="diamond-content">
                            <div className="node-text small">PIN Verified?</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flow-connector vertical mini"></div>
                      
                      <div className="process-node success">
                        <div className="node-icon">🎉</div>
                        <div className="node-text">Order Placed</div>
                      </div>
                      
                      <div className="flow-connector vertical mini"></div>
                      
                      <div className="process-node success">
                        <div className="node-icon">📋</div>
                        <div className="node-text">Order ID Generated</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Integration Section */}
                  <div className="integration-section">
                    <div className="integration-title">🔄 System Features</div>
                    <div className="integration-features">
                      <div className="feature-item">
                        <span className="feature-icon">🔒</span>
                        <span className="feature-text">PIN-Based Security</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">💰</span>
                        <span className="feature-text">Real-time Budget Tracking</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">📋</span>
                        <span className="feature-text">Order ID Generation</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">🎯</span>
                        <span className="feature-text">Smart Employee Search</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">🛒</span>
                        <span className="feature-text">Category-based Shopping</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span className="feature-text">Purchase History Tracking</span>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Tab Content */}
        {loginPageTab === 'menu' && (
          <div className="menu-tab-content">
            <Menu />
          </div>
        )}
      </div>

      {/* Auto Logout Warning Modal */}
      <AutoLogoutWarning
        isVisible={showLogoutWarning}
        remainingSeconds={logoutWarningTime}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleLogoutNow}
      />
    </div>
  )
}

export default App
