import { useState, useEffect } from 'react'

const AutoLogoutWarning = ({ isVisible, remainingSeconds, onStayLoggedIn, onLogoutNow }) => {
  const [timeLeft, setTimeLeft] = useState(remainingSeconds)

  useEffect(() => {
    setTimeLeft(remainingSeconds)
  }, [remainingSeconds])

  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="auto-logout-overlay">
      <div className="auto-logout-modal">
        <div className="logout-warning-header">
          <div className="warning-icon">⚠️</div>
          <h2>Session Timeout Warning</h2>
        </div>
        
        <div className="logout-warning-content">
          <p>Your session will expire due to inactivity.</p>
          <div className="countdown-container">
            <span className="countdown-label">Time remaining:</span>
            <span className="countdown-timer">{formatTime(timeLeft)}</span>
          </div>
          <p className="logout-warning-text">
            Click "Stay Logged In" to continue your session, or you will be automatically logged out.
          </p>
        </div>

        <div className="logout-warning-actions">
          <button 
            onClick={onStayLoggedIn}
            className="stay-logged-in-btn"
            autoFocus
          >
            Stay Logged In
          </button>
          <button 
            onClick={onLogoutNow}
            className="logout-now-btn"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default AutoLogoutWarning 