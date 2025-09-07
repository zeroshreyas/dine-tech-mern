import { useState, useEffect } from 'react'
import { paymentsAPI } from '../services/api'

function Payment({ currentUser, onPaymentComplete, onPaymentError }) {
  const [step, setStep] = useState('amount') // amount, bank, banking, processing, result
  const [amount, setAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentData, setPaymentData] = useState(null)
  const [bankCredentials, setBankCredentials] = useState({
    customerId: '',
    password: '',
    accountNumber: ''
  })
  const [processingTimer, setProcessingTimer] = useState(0)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Load banks and payment history on mount
  useEffect(() => {
    loadBanks()
    loadPaymentHistory()
  }, [])

  // Timer for processing state
  useEffect(() => {
    let interval
    if (step === 'processing' && processingTimer > 0) {
      interval = setInterval(() => {
        setProcessingTimer(prev => {
          if (prev <= 1) {
            checkPaymentStatus()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, processingTimer])

  const loadBanks = async () => {
    try {
      const response = await paymentsAPI.getBanks()
      setBanks(response.banks)
    } catch (error) {
      console.error('Failed to load banks:', error)
      setError('Failed to load bank list')
    }
  }

  const loadPaymentHistory = async () => {
    try {
      const response = await paymentsAPI.getPaymentHistory({ limit: 5 })
      setPaymentHistory(response.payments || [])
    } catch (error) {
      console.error('Failed to load payment history:', error)
    }
  }

  const handleAmountSubmit = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    
    if (amountNum < 10 || amountNum > 10000) {
      setError('Amount must be between ₹10 and ₹10,000')
      return
    }

    setError('')
    setStep('bank')
  }

  const handleBankSelect = async (bankCode) => {
    setLoading(true)
    setError('')

    try {
      const response = await paymentsAPI.initiatePayment(parseFloat(amount), bankCode)
      setPaymentData(response)
      setSelectedBank(bankCode)
      setStep('banking')
    } catch (error) {
      setError(error.message || 'Failed to initiate payment')
    }

    setLoading(false)
  }

  const handleBankLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await paymentsAPI.processBankPayment(
        paymentData.paymentId,
        bankCredentials
      )
      
      setProcessingTimer(response.estimatedTime)
      setStep('processing')
    } catch (error) {
      if (error.message.includes('Invalid credentials')) {
        setError('Invalid bank credentials. Please check your Customer ID and Password.')
      } else {
        setError(error.message || 'Authentication failed')
      }
    }

    setLoading(false)
  }

  const checkPaymentStatus = async () => {
    try {
      const response = await paymentsAPI.getPaymentStatus(paymentData.paymentId)
      
      if (response.status === 'completed') {
        setStep('result')
        onPaymentComplete({
          paymentId: response.paymentId,
          amount: response.amount,
          status: 'success'
        })
        loadPaymentHistory()
      } else if (response.status === 'failed') {
        setStep('result')
        setError('Payment failed. Please try again.')
        onPaymentError(new Error('Payment failed'))
      }
    } catch (error) {
      setError('Failed to check payment status')
      setStep('result')
    }
  }

  const handleCancel = async () => {
    if (paymentData?.paymentId && (step === 'banking' || step === 'processing')) {
      try {
        await paymentsAPI.cancelPayment(paymentData.paymentId)
      } catch (error) {
        console.error('Failed to cancel payment:', error)
      }
    }
    resetPayment()
  }

  const resetPayment = () => {
    setStep('amount')
    setAmount('')
    setSelectedBank('')
    setPaymentData(null)
    setBankCredentials({ customerId: '', password: '', accountNumber: '' })
    setProcessingTimer(0)
    setError('')
  }

  const handleCredentialChange = (field, value) => {
    setBankCredentials(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSelectedBankName = () => {
    const bank = banks.find(b => b.code === selectedBank)
    return bank ? bank.name : selectedBank
  }

  const formatPaymentDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>💳 Add Funds to Budget</h2>
        <p>Top up your pantry budget using Net Banking</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Step 1: Amount Selection */}
      {step === 'amount' && (
        <div className="payment-step">
          <div className="step-header">
            <h3>💰 Enter Amount</h3>
            <p>Choose how much you want to add to your budget</p>
          </div>

          <div className="current-budget-info">
            <div className="budget-card">
              <div className="budget-item">
                <span className="budget-label">Current Budget:</span>
                <span className="budget-value">₹{currentUser.pantryBudget.monthlyLimit.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Spent:</span>
                <span className="budget-value spent">₹{currentUser.pantryBudget.currentSpent.toFixed(2)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Available:</span>
                <span className="budget-value available">
                  ₹{(currentUser.pantryBudget.monthlyLimit - currentUser.pantryBudget.currentSpent).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAmountSubmit} className="amount-form">
            <div className="form-group">
              <label htmlFor="amount">Amount (₹10 - ₹10,000):</label>
              <div className="amount-input-container">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max="10000"
                  step="10"
                  required
                  placeholder="Enter amount"
                  className="amount-input"
                />
              </div>
            </div>

            <div className="quick-amounts">
              <p>Quick select:</p>
              <div className="quick-amount-buttons">
                {[100, 250, 500, 1000, 2000].map(quickAmount => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`quick-amount-btn ${amount === quickAmount.toString() ? 'selected' : ''}`}
                  >
                    ₹{quickAmount}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="continue-btn" disabled={!amount}>
              Continue to Bank Selection
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Bank Selection */}
      {step === 'bank' && (
        <div className="payment-step">
          <div className="step-header">
            <h3>🏦 Select Your Bank</h3>
            <p>Amount: ₹{amount}</p>
          </div>

          <div className="banks-grid">
            {banks.map(bank => (
              <div
                key={bank.code}
                className="bank-card"
                onClick={() => handleBankSelect(bank.code)}
                disabled={loading}
              >
                <div className="bank-icon">🏦</div>
                <div className="bank-name">{bank.name}</div>
                <div className="bank-code">{bank.code}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('amount')} className="back-btn">
            ← Back to Amount
          </button>
        </div>
      )}

      {/* Step 3: Net Banking Login */}
      {step === 'banking' && (
        <div className="payment-step">
          <div className="step-header">
            <h3>🔐 {getSelectedBankName()} Net Banking</h3>
            <p>Amount: ₹{amount} | Payment ID: {paymentData?.paymentId}</p>
          </div>

          <div className="banking-interface">
            <div className="bank-header">
              <div className="bank-logo">🏦</div>
              <div className="bank-info">
                <h4>{getSelectedBankName()}</h4>
                <p>Internet Banking Login</p>
              </div>
            </div>

            <form onSubmit={handleBankLogin} className="banking-form">
              <div className="form-group">
                <label htmlFor="customerId">Customer ID / User ID:</label>
                <input
                  type="text"
                  id="customerId"
                  value={bankCredentials.customerId}
                  onChange={(e) => handleCredentialChange('customerId', e.target.value)}
                  required
                  minLength="6"
                  maxLength="12"
                  placeholder="Enter your Customer ID"
                  className="banking-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Login Password:</label>
                <input
                  type="password"
                  id="password"
                  value={bankCredentials.password}
                  onChange={(e) => handleCredentialChange('password', e.target.value)}
                  required
                  minLength="6"
                  placeholder="Enter your login password"
                  className="banking-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number:</label>
                <input
                  type="text"
                  id="accountNumber"
                  value={bankCredentials.accountNumber}
                  onChange={(e) => handleCredentialChange('accountNumber', e.target.value)}
                  required
                  minLength="10"
                  maxLength="18"
                  placeholder="Enter your account number"
                  className="banking-input"
                />
              </div>

              <div className="demo-credentials">
                <h5>🎯 Demo Credentials (for testing):</h5>
                <div className="demo-creds">
                  <p><strong>Customer ID:</strong> demo123</p>
                  <p><strong>Password:</strong> password123</p>
                  <p><strong>Account:</strong> 1234567890123456</p>
                </div>
              </div>

              <div className="banking-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Login & Pay'}
                </button>
              </div>
            </form>

            <div className="security-notice">
              <p>🔒 This is a simulated banking interface for demonstration purposes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Processing Payment */}
      {step === 'processing' && (
        <div className="payment-step">
          <div className="step-header">
            <h3>⏳ Processing Payment</h3>
            <p>Please wait while we process your payment...</p>
          </div>

          <div className="processing-interface">
            <div className="processing-animation">
              <div className="spinner"></div>
            </div>

            <div className="processing-details">
              <div className="detail-row">
                <span>Bank:</span>
                <span>{getSelectedBankName()}</span>
              </div>
              <div className="detail-row">
                <span>Amount:</span>
                <span>₹{amount}</span>
              </div>
              <div className="detail-row">
                <span>Payment ID:</span>
                <span>{paymentData?.paymentId}</span>
              </div>
              {processingTimer > 0 && (
                <div className="detail-row">
                  <span>Estimated time:</span>
                  <span>{formatTime(processingTimer)}</span>
                </div>
              )}
            </div>

            <div className="processing-status">
              <p>🔄 Connecting to {getSelectedBankName()}...</p>
              <p>💳 Verifying payment details...</p>
              <p>✅ Processing transaction...</p>
            </div>

            <button
              onClick={handleCancel}
              className="cancel-btn"
              disabled={processingTimer < 2}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Result */}
      {step === 'result' && (
        <div className="payment-step">
          <div className="step-header">
            <h3>{error ? '❌ Payment Failed' : '✅ Payment Successful'}</h3>
          </div>

          {!error ? (
            <div className="success-result">
              <div className="success-icon">🎉</div>
              <div className="success-details">
                <p>Payment of ₹{amount} has been successfully added to your budget!</p>
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Payment ID:</span>
                    <span>{paymentData?.paymentId}</span>
                  </div>
                  <div className="summary-row">
                    <span>Bank:</span>
                    <span>{getSelectedBankName()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Amount:</span>
                    <span>₹{amount}</span>
                  </div>
                  <div className="summary-row">
                    <span>New Budget:</span>
                    <span>₹{(currentUser.pantryBudget.monthlyLimit + parseFloat(amount)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="error-result">
              <div className="error-icon">⚠️</div>
              <div className="error-details">
                <p>Your payment could not be processed at this time.</p>
                <p>Please try again or contact support if the issue persists.</p>
              </div>
            </div>
          )}

          <div className="result-actions">
            <button onClick={resetPayment} className="new-payment-btn">
              Make Another Payment
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className="history-btn"
            >
              {showHistory ? 'Hide' : 'View'} Payment History
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      {(showHistory || step === 'amount') && (
        <div className="payment-history">
          <h3>📋 Recent Payment History</h3>
          {paymentHistory.length > 0 ? (
            <div className="history-list">
              {paymentHistory.map(payment => (
                <div key={payment._id} className="history-item">
                  <div className="history-info">
                    <div className="history-id">
                      Payment ID: {payment.paymentId}
                    </div>
                    <div className="history-details">
                      ₹{payment.amount.toFixed(2)} • {payment.bankDetails?.bankName || 'N/A'} • 
                      {formatPaymentDate(payment.createdAt)}
                    </div>
                  </div>
                  <div className={`history-status ${payment.status}`}>
                    {payment.status === 'completed' && '✅'}
                    {payment.status === 'failed' && '❌'}
                    {payment.status === 'pending' && '⏳'}
                    {payment.status === 'processing' && '🔄'}
                    {payment.status === 'cancelled' && '❌'}
                    <span className="status-text">{payment.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <p>No payment history found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Payment 