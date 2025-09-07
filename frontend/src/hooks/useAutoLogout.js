import { useEffect, useRef, useCallback } from 'react'

const useAutoLogout = ({ 
  isAuthenticated, 
  onLogout, 
  onWarning,
  idleTime = 15 * 60 * 1000, // 15 minutes in milliseconds
  warningTime = 2 * 60 * 1000 // 2 minutes warning
}) => {
  const timeoutRef = useRef(null)
  const warningTimeoutRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }

    if (!isAuthenticated) return

    // Set warning timer (shows warning before logout)
    warningTimeoutRef.current = setTimeout(() => {
      onWarning?.(warningTime / 1000) // Pass remaining seconds to warning
    }, idleTime - warningTime)

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      console.log('🔒 Auto-logout: Session expired due to inactivity')
      onLogout?.()
    }, idleTime)
  }, [isAuthenticated, onLogout, onWarning, idleTime, warningTime])

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
  }, [])

  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers()
      return
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ]

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the timer
    resetTimer()

    // Cleanup function
    return () => {
      clearTimers()
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [isAuthenticated, handleActivity, resetTimer, clearTimers])

  // Return functions for manual control
  return {
    resetTimer: handleActivity,
    clearTimers,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current
      return Math.max(0, idleTime - elapsed)
    }
  }
}

export default useAutoLogout 