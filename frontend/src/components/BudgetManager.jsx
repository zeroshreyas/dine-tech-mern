import { useState } from 'react'

function BudgetManager({ 
  currentUser, 
  onBudgetUpdate, 
  loading, 
  error, 
  setError, 
  updateSuccess, 
  setUpdateSuccess 
}) {
  const [isBudgetEditing, setIsBudgetEditing] = useState(false)
  const [budgetData, setBudgetData] = useState(
    currentUser?.pantryBudget || { monthlyLimit: 100, currentSpent: 0 }
  )

  const handleBudgetChange = (e) => {
    const { name, value } = e.target
    setBudgetData(prevState => ({
      ...prevState,
      [name]: parseFloat(value) || 0
    }))
    // Clear success message when user starts editing
    if (updateSuccess) setUpdateSuccess('')
  }

  const handleBudgetUpdate = (e) => {
    e.preventDefault()
    setError('')
    setUpdateSuccess('')

    // Validate budget amount
    if (budgetData.monthlyLimit < 0 || budgetData.monthlyLimit > 1000) {
      setError('Monthly budget must be between ₹0 and ₹1000')
      return
    }

    // Call the parent component's update function
    onBudgetUpdate(budgetData)
  }

  const handleBudgetEditToggle = () => {
    if (isBudgetEditing) {
      // Cancel editing - reset budget data
      setBudgetData(currentUser?.pantryBudget || { monthlyLimit: 100, currentSpent: 0 })
      setError('')
      setUpdateSuccess('')
    }
    setIsBudgetEditing(!isBudgetEditing)
  }

  const getBudgetStatus = (budget) => {
    if (!budget) return { percentage: 0, status: 'safe', remaining: 0, isLowBudget: false }
    
    const remaining = Math.max(budget.monthlyLimit - budget.currentSpent, 0)
    const percentage = (budget.currentSpent / budget.monthlyLimit) * 100
    const isLowBudget = remaining < 10 && remaining > 0
    
    let status = 'safe'
    if (percentage >= 90) status = 'danger'
    else if (percentage >= 75) status = 'warning'
    
    return {
      percentage: Math.min(percentage, 100),
      status,
      remaining,
      isLowBudget
    }
  }

  const budgetStatus = getBudgetStatus(currentUser?.pantryBudget)

  return (
    <div className="info-card">
      <div className="card-header">
        <h2>Monthly Pantry Budget</h2>
        <button onClick={handleBudgetEditToggle} className="edit-button small">
          {isBudgetEditing ? 'Cancel' : 'Edit Budget'}
        </button>
      </div>
      
      {budgetStatus.isLowBudget && (
        <div className="low-budget-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <strong>Low Budget Alert!</strong>
            <p>You only have ₹{budgetStatus.remaining.toFixed(2)} remaining in your pantry budget. Consider topping up soon!</p>
          </div>
        </div>
      )}
      
      {isBudgetEditing ? (
        <form onSubmit={handleBudgetUpdate} className="budget-form">
          <div className="form-group">
            <label htmlFor="monthlyLimit">Monthly Budget Limit (₹):</label>
            <input
              type="number"
              id="monthlyLimit"
              name="monthlyLimit"
              value={budgetData.monthlyLimit || ''}
              onChange={handleBudgetChange}
              min="0"
              max="1000"
              step="0.01"
              required
              disabled={loading}
              placeholder="Enter monthly budget limit"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Updating...' : 'Update Budget'}
            </button>
          </div>
        </form>
      ) : (
        <div className="budget-display">
          <div className="budget-summary">
            <div className="budget-item">
              <span className="budget-label">Monthly Limit:</span>
              <span className="budget-value">₹{(Number(currentUser?.pantryBudget?.monthlyLimit) || 0).toFixed(2)}</span>
            </div>
            <div className="budget-item">
              <span className="budget-label">Current Spent:</span>
              <span className="budget-value">₹{(Number(currentUser?.pantryBudget?.currentSpent) || 0).toFixed(2)}</span>
            </div>
            <div className="budget-item">
              <span className="budget-label">Remaining:</span>
              <span className={`budget-value ${budgetStatus.status}`}>
                ₹{budgetStatus.remaining.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="budget-progress">
            <div className="progress-label">
              Budget Usage: {budgetStatus.percentage.toFixed(1)}%
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${budgetStatus.status}`}
                style={{ width: `${budgetStatus.percentage}%` }}
              ></div>
            </div>
          </div>


        </div>
      )}
    </div>
  )
}

export default BudgetManager 