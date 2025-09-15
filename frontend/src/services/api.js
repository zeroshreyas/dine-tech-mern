const API_BASE_URL = 'https://dine-tech-mern.onrender.com/api' || 'http://localhost:5000/api';

// Token management
const getToken = () => localStorage.getItem('dine-tech-token');
const setToken = (token) => localStorage.setItem('dine-tech-token', token);
const removeToken = () => localStorage.removeItem('dine-tech-token');

// Base API function with error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Login user
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  },

  // Register new user
  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Verify employee PIN
  verifyPin: async (employeeId, pin) => {
    return await apiRequest('/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ employeeId, pin }),
    });
  },

  // Forgot password - send reset email
  forgotPassword: async (email) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  // Logout user
  logout: () => {
    removeToken();
  },
};

// Users API
export const usersAPI = {
  // Get all employees (for vendor search)
  getEmployees: async (search = '', department = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    
    const queryString = params.toString();
    return await apiRequest(`/users/employees${queryString ? `?${queryString}` : ''}`);
  },

  // Get user profile
  getProfile: async () => {
    return await apiRequest('/users/profile');
  },

  // Update user profile
  updateProfile: async (updateData) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Update employee PIN
  updatePin: async (currentPin, newPin) => {
    return await apiRequest('/users/pin', {
      method: 'PUT',
      body: JSON.stringify({ currentPin, newPin }),
    });
  },

  // Update monthly budget
  updateBudget: async (monthlyLimit) => {
    return await apiRequest('/users/budget', {
      method: 'PUT',
      body: JSON.stringify({ monthlyLimit }),
    });
  },

  // Get purchase history
  getPurchaseHistory: async (month = '', category = '') => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (category && category !== 'All') params.append('category', category);
    
    const queryString = params.toString();
    return await apiRequest(`/users/purchase-history${queryString ? `?${queryString}` : ''}`);
  },

  // Admin endpoints
  getEmployeesAdmin: async () => {
    return await apiRequest('/users/admin/employees');
  },

  // Admin vendor management
  createVendor: async (vendorData) => {
    return await apiRequest('/users/admin/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  },

  getVendors: async () => {
    return await apiRequest('/users/admin/vendors');
  },
};

// Products API
export const productsAPI = {
  // Get all products
  getProducts: async (category = '', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    
    const queryString = params.toString();
    return await apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
  },

  // Get product categories
  getCategories: async () => {
    return await apiRequest('/products/categories');
  },

  // Create new product (Admin only)
  createProduct: async (productData) => {
    return await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update product (Admin only)
  updateProduct: async (productId, updateData) => {
    return await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete product (Admin only)
  deleteProduct: async (productId) => {
    return await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersAPI = {
  // Create new order (vendor only)
  createOrder: async (employeeId, items, pin) => {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ employeeId, items, pin }),
    });
  },

  // Get orders for current user (employee only)
  getMyOrders: async () => {
    return await apiRequest('/orders/my-orders');
  },

  // Get orders for specific employee (by employeeId)
  getUserOrders: async (employeeId) => {
    return await apiRequest(`/orders/user/${employeeId}`);
  },

  // Admin endpoints
  getAllOrdersAdmin: async (params = {}) => {
    const searchParams = new URLSearchParams();
    
    // Add parameters only if they have meaningful values
    if (params.page && params.page > 0) searchParams.append('page', params.page);
    if (params.limit && params.limit > 0) searchParams.append('limit', params.limit);
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.search && params.search.trim() !== '') searchParams.append('search', params.search.trim());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    
    const queryString = searchParams.toString();
    const url = `/orders/admin/all${queryString ? `?${queryString}` : ''}`;
    
    console.log('🌐 API Request URL:', url);
    console.log('📋 API Request params:', params);
    
    return await apiRequest(url);
  },

  getUserOrdersAdmin: async (employeeId) => {
    return await apiRequest(`/orders/admin/users/${employeeId}`);
  },
};

// Payments API
export const paymentsAPI = {
  // Get supported banks (simulated)
  getBanks: async () => {
    return await apiRequest('/payments/banks');
  },

  // Initiate payment process (simulated)
  initiatePayment: async (amount, bankCode, paymentMethod = 'net_banking') => {
    return await apiRequest('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ amount, bankCode, paymentMethod }),
    });
  },

  // Process bank authentication and payment
  processBankPayment: async (paymentId, bankCredentials) => {
    return await apiRequest(`/payments/banking/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify(bankCredentials),
    });
  },

  // Check payment status
  getPaymentStatus: async (paymentId) => {
    return await apiRequest(`/payments/status/${paymentId}`);
  },

  // Cancel payment
  cancelPayment: async (paymentId) => {
    return await apiRequest(`/payments/cancel/${paymentId}`, {
      method: 'POST',
    });
  },

  // Process payment for budget top-up (Legacy)
  processPayment: async (paymentData) => {
    return await apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    if (params.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return await apiRequest(`/payments/history${queryString ? `?${queryString}` : ''}`);
  },
};

// Real Payments API (Razorpay Integration)
export const realPaymentsAPI = {
  // Get supported payment methods
  getPaymentMethods: async () => {
    return await apiRequest('/real-payments/methods');
  },

  // Create Razorpay order
  createOrder: async (amount, purpose = 'Budget Top-up') => {
    return await apiRequest('/real-payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, purpose }),
    });
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    return await apiRequest('/real-payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Get real payment history
  getPaymentHistory: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    if (params.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return await apiRequest(`/real-payments/history${queryString ? `?${queryString}` : ''}`);
  },
};

// Feedback API
export const feedbackAPI = {
  submit: async (payload) => apiRequest('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  submitPublic: async (payload) => apiRequest('/feedback/public', { method: 'POST', body: JSON.stringify(payload) }),
  my: async () => apiRequest('/feedback/my'),
  adminAll: async (params = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', params.page)
    if (params.limit) searchParams.append('limit', params.limit)
    if (params.category) searchParams.append('category', params.category)
    if (params.search) searchParams.append('search', params.search)
    const qs = searchParams.toString()
    return apiRequest(`/feedback/admin/all${qs ? `?${qs}` : ''}`)
  }
};

// Email service simulation (keeping for compatibility)
export const emailService = {
  sendPurchaseConfirmation: async (employeeData, purchaseData) => {
    // This is now handled by the backend, but keeping for frontend compatibility
    console.log('Email sent via backend for purchase:', purchaseData.orderId);
    return Promise.resolve({ success: true });
  },
};

// Export token management utilities
export const tokenUtils = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};

// Export base API function for custom requests
export { apiRequest }; 