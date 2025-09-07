import { useState, useRef } from 'react'
import { apiRequest } from '../services/api'

function Feedback({ currentUser, onNotify, publicMode = false }) {
  const [form, setForm] = useState({
    category: 'Food Quality',
    vendorName: '',
    orderId: '',
    rating: 5,
    message: '',
    contactInfo: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [myFeedback, setMyFeedback] = useState([])
  const bottomRef = useRef(null)
  const formRef = useRef(null)
  const messageRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const submitFeedback = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!form.message || form.message.trim().length < 10) {
      const msg = 'Please provide at least 10 characters in the message'
      setError(msg)
      if (onNotify) onNotify('error', msg)
      setLoading(false)
      return
    }

    try {
      const endpoint = publicMode ? '/feedback/public' : '/feedback'
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          category: form.category,
          vendorName: form.vendorName.trim(),
          orderId: form.orderId.trim(),
          rating: Number(form.rating),
          message: form.message.trim(),
          contactInfo: form.contactInfo.trim(),
        })
      })
      const successMsg = 'Thank you! Your feedback has been submitted.'
      setSuccess(successMsg)
      if (onNotify) onNotify('success', successMsg)
      setForm({ category: 'Food Quality', vendorName: '', orderId: '', rating: 5, message: '', contactInfo: '' })
      // Refresh my feedbacks when authenticated mode only
      if (!publicMode) {
        const mine = await apiRequest('/feedback/my')
        setMyFeedback(mine.feedbacks || [])
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to submit feedback'
      setError(errMsg)
      if (onNotify) onNotify('error', errMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadMyFeedback = async () => {
    try {
      if (publicMode) return
      const mine = await apiRequest('/feedback/my')
      setMyFeedback(mine.feedbacks || [])
    } catch (err) {
      // silent
    }
  }

  const handleShareClick = () => {
    // If message is valid, submit; else focus message and scroll to form
    if (form.message && form.message.trim().length >= 10 && !loading) {
      formRef.current?.requestSubmit()
    } else {
      setError('Please describe the issue (min 10 characters)')
      messageRef.current?.focus()
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <h2>Feedback & Issues</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form ref={formRef} onSubmit={submitFeedback} className="profile-form" style={{ marginTop: '10px' }}>
        <div className="form-row">
          <div className="form-group" style={{ width: '100%' }}>
            <label htmlFor="contactInfo">Contact (email, phone, or employee ID)</label>
            <input
              id="contactInfo"
              name="contactInfo"
              value={form.contactInfo}
              onChange={handleChange}
              placeholder="e.g., john.smith@company.com or +1-555-0123 or EMP123"
              disabled={loading}
              autoFocus={!loading && !form.contactInfo}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} disabled={loading}>
              <option>Food Quality</option>
              <option>Hygiene</option>
              <option>Service</option>
              <option>Price</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rating">Rating</label>
            <select id="rating" name="rating" value={form.rating} onChange={handleChange} disabled={loading}>
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Terrible</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="vendorName">Vendor (optional)</label>
            <input id="vendorName" name="vendorName" value={form.vendorName} onChange={handleChange} placeholder="Vendor name" disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="orderId">Order ID (optional)</label>
            <input id="orderId" name="orderId" value={form.orderId} onChange={handleChange} placeholder="e.g., ORD12345" disabled={loading} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ width: '100%' }}>
            <label htmlFor="message">Describe the issue</label>
            <textarea ref={messageRef} id="message" name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Please include as many details as possible..." disabled={loading} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button" disabled={loading}>{loading ? 'Submitting...' : 'Submit Feedback'}</button>
          {!publicMode && (
            <button type="button" className="cancel-button" onClick={loadMyFeedback} disabled={loading} style={{ marginLeft: '8px' }}>Load My Feedback</button>
          )}
        </div>
      </form>

      {!publicMode && myFeedback.length > 0 && (
        <div className="purchase-list" style={{ marginTop: '20px' }}>
          <h3>My Recent Feedback</h3>
          <div className="purchases-grid">
            {myFeedback.map(fb => (
              <div key={fb._id} className="purchase-item">
                <div className="purchase-header">
                  <span className="product-name">{fb.category} {fb.rating ? `(${fb.rating}/5)` : ''}</span>
                  <span className="purchase-price">{new Date(fb.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="purchase-details">
                  {fb.vendorName && <span className="purchase-category">Vendor: {fb.vendorName}</span>}
                  {fb.orderId && <span className="purchase-quantity">Order: {fb.orderId}</span>}
                  {fb.contactInfo && <span className="purchase-quantity">Contact: {fb.contactInfo}</span>}
                </div>
                <div className="purchase-date">
                  {fb.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky footer share button removed */}

      <div ref={bottomRef} />
    </div>
  )
}

export default Feedback 