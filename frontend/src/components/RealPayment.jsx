import React, { useState, useEffect } from 'react';
import { realPaymentsAPI } from '../services/api';

const RealPayment = ({ currentUser, onPaymentComplete, onPaymentError }) => {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('Budget Top-up');
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quick amount options
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  useEffect(() => {
    loadPaymentMethods();
    loadPaymentHistory();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await realPaymentsAPI.getPaymentMethods();
      if (response.success) {
        setPaymentMethods(response.methods);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await realPaymentsAPI.getPaymentHistory({ limit: 5 });
      if (response.success) {
        setPaymentHistory(response.payments);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
    setError('');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const validateAmount = () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      setError('Please enter a valid amount');
      return false;
    }
    if (amountNum < 10) {
      setError('Minimum amount is ₹10');
      return false;
    }
    if (amountNum > 50000) {
      setError('Maximum amount is ₹50,000');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateAmount()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await realPaymentsAPI.createOrder(parseFloat(amount), purpose);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { order, key_id, user, isDemo, message } = orderResponse;

      // Handle demo mode
      if (isDemo) {
        // In demo, do not show demo-mode label; show a generic message instead
        setError(message);
        setLoading(false);
        return;
      }

      // Step 2: Configure Razorpay options
      const options = {
        key: key_id,
        amount: order.amount, // Amount in paisa
        currency: order.currency,
        name: 'Dine Tech',
        description: `${purpose} - Pantry Budget`,
        image: '/vite.svg', // Your logo
        order_id: order.id,
        
        // Pre-filled customer details
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.contact || '+91'
        },
        
        // Available payment methods
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          upi: true,
          paylater: false
        },
        
        // Preferred banks for net banking
        config: {
          display: {
            blocks: {
              banks: {
                name: 'All Banks',
                instruments: [
                  { method: 'netbanking', banks: ['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'BOI', 'PNB', 'CANARA'] },
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'wallet', wallets: ['paytm', 'phonepe', 'amazonpay'] }
                ]
              }
            },
            hide: [
              { method: 'paylater' }
            ],
            sequence: ['block.banks']
          }
        },
        
        theme: {
          color: '#667eea'
        },
        
        // Success handler
        handler: async function(response) {
          try {
            // Step 3: Verify payment
            const verifyResponse = await realPaymentsAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.success) {
              setAmount('');
              loadPaymentHistory();
              
              // Notify parent component
              if (onPaymentComplete) {
                onPaymentComplete({
                  amount: parseFloat(amount),
                  paymentId: verifyResponse.payment.id,
                  method: verifyResponse.payment.method,
                  bank: verifyResponse.payment.bank
                });

                // Scroll to top where global notification shows
                try {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (_) {}
              }
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError(error.message || 'Payment verification failed');
            if (onPaymentError) {
              onPaymentError(error);
            }
          }
        },
        
        // Modal configuration
        modal: {
          ondismiss: function() {
            setLoading(false);
            console.log('Payment modal closed');
          }
        },
        
        // Error handler
        error: function(error) {
          console.error('Razorpay error:', error);
          setError(error.description || 'Payment failed');
          setLoading(false);
          if (onPaymentError) {
            onPaymentError(error);
          }
        }
      };

      // Step 4: Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        setError(response.error.description || 'Payment failed');
        setLoading(false);
        if (onPaymentError) {
          onPaymentError(response.error);
        }
      });

      rzp.open();
      setLoading(false);

    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error.message || 'Failed to initiate payment');
      setLoading(false);
      if (onPaymentError) {
        onPaymentError(error);
      }
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>💳 Add Money to Pantry Budget</h2>
        <p>Add funds using Net Banking, UPI, Cards, or Digital Wallets</p>
      </div>

      {/* Current Budget Info */}
      <div className="current-budget-info">
        <div className="budget-card">
          <div className="budget-item">
            <div className="budget-label">Budget Limit</div>
            <div className="budget-value">₹{(Number(currentUser?.pantryBudget?.monthlyLimit) || 0).toFixed(2)}</div>
          </div>
          <div className="budget-item">
            <div className="budget-label">Spent This Month</div>
            <div className="budget-value spent">₹{(Number(currentUser?.pantryBudget?.currentSpent) || 0).toFixed(2)}</div>
          </div>
          <div className="budget-item">
            <div className="budget-label">Available Balance</div>
            <div className="budget-value available">
              ₹{((Number(currentUser?.pantryBudget?.monthlyLimit) || 0) - (Number(currentUser?.pantryBudget?.currentSpent) || 0)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <div className="error-message">{error}</div>}

      {/* Payment Form */}
      <div className="amount-form">
        <div className="form-group">
          <label htmlFor="amount">Enter Amount (₹)</label>
          <div className="amount-input-container">
            <span className="currency-symbol">₹</span>
            <input
              type="text"
              id="amount"
              className="amount-input"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="purpose">Purpose</label>
          <select
            id="purpose"
            className="amount-input"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            disabled={loading}
          >
            <option value="Budget Top-up">Budget Top-up</option>
            <option value="Monthly Allowance">Monthly Allowance</option>
            <option value="Bonus Credit">Bonus Credit</option>
            <option value="Expense Reimbursement">Expense Reimbursement</option>
          </select>
        </div>

        {/* Quick Amount Buttons */}
        <div className="quick-amounts">
          <p>Quick amounts:</p>
          <div className="quick-amount-buttons">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                className={`quick-amount-btn ${amount === quickAmount.toString() ? 'selected' : ''}`}
                onClick={() => handleAmountSelect(quickAmount)}
                disabled={loading}
              >
                ₹{quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Button */}
        <button
          className="continue-btn"
          onClick={handlePayment}
          disabled={loading || !amount}
        >
          {loading ? 'Processing...' : `Pay ₹${amount || '0'}`}
        </button>
      </div>

      {/* Supported Payment Methods */}
      {paymentMethods && (
        <div className="payment-methods">
          <h3>💳 Supported Payment Methods</h3>
          <div className="methods-grid">
            <div className="method-category">
              <h4>🏦 Net Banking</h4>
              <div className="method-list">
                {paymentMethods.netbanking?.slice(0, 8).map(bank => (
                  <span key={bank} className="method-item">{bank}</span>
                ))}
                {paymentMethods.netbanking?.length > 8 && (
                  <span className="method-item">+{paymentMethods.netbanking.length - 8} more</span>
                )}
              </div>
            </div>
            
            <div className="method-category">
              <h4>💳 Cards</h4>
              <div className="method-list">
                {paymentMethods.cards?.map(card => (
                  <span key={card} className="method-item">{card.toUpperCase()}</span>
                ))}
              </div>
            </div>
            
            <div className="method-category">
              <h4>📱 UPI & Wallets</h4>
              <div className="method-list">
                {paymentMethods.upi?.slice(0, 4).map(upi => (
                  <span key={upi} className="method-item">{upi}</span>
                ))}
                {paymentMethods.wallets?.slice(0, 3).map(wallet => (
                  <span key={wallet} className="method-item">{wallet}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payment History */}
      {paymentHistory.length > 0 && (
        <div className="payment-history">
          <h3>📊 Recent Transactions</h3>
          <div className="history-list">
            {paymentHistory.map((payment) => (
              <div key={payment._id} className="history-item">
                <div className="history-info">
                  <div className="history-id">
                    Payment #{payment.paymentId}
                  </div>
                  <div className="history-details">
                    ₹{payment.amount} • {new Date(payment.createdAt).toLocaleDateString()}
                    {payment.bankDetails?.method && ` • ${payment.bankDetails.method}`}
                  </div>
                </div>
                <div className={`history-status ${payment.status}`}>
                  {payment.status === 'completed' ? '✅' : payment.status === 'failed' ? '❌' : '⏳'} 
                  {payment.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Notice removed in user portal */}

      {/* Security Notice */}
      <div className="security-notice">
        <p>🔒 Payments are processed securely through Razorpay. Your banking details are never stored on our servers.</p>
      </div>
    </div>
  );
};

export default RealPayment; 