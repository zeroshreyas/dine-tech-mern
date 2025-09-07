// Email Service - Simulates sending emails to employees after purchases

const EMAIL_TEMPLATES = {
  employeePurchase: {
    subject: (data) => `🛒 Purchase Confirmation - Order #${data.orderId}`,
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
            🛒 Purchase Confirmation
          </h2>
          
          <p style="font-size: 16px; color: #34495e; margin-bottom: 20px;">
            Hi <strong>${data.employeeName}</strong>,
          </p>
          
          <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 25px;">
            Your pantry purchase has been successfully processed. Here are the details:
          </p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Purchase Summary</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Date:</strong> ${data.purchaseDate}</p>
            <p><strong>Total Items:</strong> ${data.totalItems}</p>
            <p><strong>Total Amount:</strong> ₹${data.total}</p>
            ${data.vendorName ? `<p><strong>Purchased by:</strong> ${data.vendorName} (Vendor)</p>` : ''}
          </div>
          
          <div style="background-color: #fff; border: 1px solid #bdc3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #2c3e50; margin-top: 0;">Items Purchased:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #ecf0f1;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #bdc3c7;">Item</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #bdc3c7;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #bdc3c7;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ecf0f1;">${item.name}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ecf0f1;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ecf0f1;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 25px;">
            <h4 style="color: #27ae60; margin-top: 0;">💰 Budget Update</h4>
            <p style="margin-bottom: 5px;"><strong>Monthly Budget:</strong> ₹${data.budget.monthlyLimit}</p>
            <p style="margin-bottom: 5px;"><strong>Amount Spent This Month:</strong> ₹${data.budget.currentSpent}</p>
            <p style="margin-bottom: 0;"><strong>Remaining Budget:</strong> ₹${data.budget.remaining}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="font-size: 12px; color: #95a5a6; margin-bottom: 10px;">
              Thank you for using our Pantry Management System!
            </p>
            <p style="font-size: 12px; color: #95a5a6;">
              Questions? Contact us at pantry-support@company.com
            </p>
          </div>
        </div>
      </div>
    `
  }
}

class EmailService {
  constructor() {
    this.emailQueue = []
    this.emailHistory = []
  }

  async sendPurchaseConfirmation(purchaseData, employee) {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const templateData = {
      orderId: purchaseData.orderId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      purchaseDate: new Date().toLocaleString(),
      totalItems: purchaseData.totalItems,
      total: purchaseData.total.toFixed(2),
      vendorName: purchaseData.vendorName !== `${employee.firstName} ${employee.lastName}` ? purchaseData.vendorName : null,
      items: purchaseData.items,
      budget: {
        monthlyLimit: employee.pantryBudget.monthlyLimit.toFixed(2),
        currentSpent: employee.pantryBudget.currentSpent.toFixed(2),
        remaining: (employee.pantryBudget.monthlyLimit - employee.pantryBudget.currentSpent).toFixed(2)
      }
    }

    const emailData = {
      id: this.generateEmailId(),
      to: employee.email,
      toName: `${employee.firstName} ${employee.lastName}`,
      subject: EMAIL_TEMPLATES.employeePurchase.subject(templateData),
      template: 'employeePurchase',
      data: templateData,
      htmlContent: EMAIL_TEMPLATES.employeePurchase.template(templateData),
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    // Add to email history
    this.emailHistory.push(emailData)

    // Simulate successful send
    console.log('📧 Email sent to:', employee.email)
    console.log('📧 Subject:', emailData.subject)
    
    return {
      success: true,
      emailId: emailData.id,
      message: `Purchase confirmation email sent to ${employee.email}`
    }
  }

  generateEmailId() {
    return 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  getEmailHistory() {
    return [...this.emailHistory].reverse() // Most recent first
  }

  getEmailById(emailId) {
    return this.emailHistory.find(email => email.id === emailId)
  }

  // Preview email without sending
  previewPurchaseEmail(purchaseData, employee) {
    return EMAIL_TEMPLATES.employeePurchase.template({
      employeeName: `${employee.firstName} ${employee.lastName}`,
      purchaseDate: new Date().toLocaleString(),
      totalItems: purchaseData.totalItems,
      total: purchaseData.total.toFixed(2),
      vendorName: purchaseData.vendorName !== `${employee.firstName} ${employee.lastName}` ? purchaseData.vendorName : null,
      items: purchaseData.items,
      budget: {
        monthlyLimit: employee.pantryBudget.monthlyLimit.toFixed(2),
        currentSpent: employee.pantryBudget.currentSpent.toFixed(2),
        remaining: (employee.pantryBudget.monthlyLimit - employee.pantryBudget.currentSpent).toFixed(2)
      }
    })
  }
}

// Create singleton instance
const emailService = new EmailService()

export default emailService 