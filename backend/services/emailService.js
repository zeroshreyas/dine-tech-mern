const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = async () => {
  // Check if we have production email credentials
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 Using configured email service (Gmail)');
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } 
  
  // Alternative: Use other SMTP services
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('📧 Using SMTP email service');
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Development/Testing: Use Ethereal Email (fake SMTP)
  console.log('📧 Using test email service (Ethereal) - emails will not be delivered');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Email templates
const emailTemplates = {
  passwordReset: (user, resetUrl) => ({
    subject: '🔐 Password Reset Request - DineTech',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">🍽️ DineTech</h1>
            <p style="color: #7f8c8d; margin: 5px 0 0 0;">Workplace Food Management</p>
          </div>
          
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
            🔐 Password Reset Request
          </h2>
          
          <p style="font-size: 16px; color: #34495e; margin-bottom: 20px;">
            Hi <strong>${user.firstName} ${user.lastName}</strong>,
          </p>
          
          <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 25px; line-height: 1.6;">
            We received a request to reset your password for your DineTech account. If you didn't make this request, you can safely ignore this email and your password will remain unchanged.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);">
              Reset My Password
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security.
            </p>
          </div>
          
          <p style="font-size: 12px; color: #95a5a6; margin-top: 30px; line-height: 1.4;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #3498db; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #95a5a6; margin: 0;">
              This is an automated message from DineTech System.
            </p>
            <p style="font-size: 12px; color: #95a5a6; margin: 5px 0 0 0;">
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  }),

  purchaseConfirmation: (data) => ({
    subject: `🛒 Purchase Confirmation - Order #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">🍽️ DineTech</h1>
            <p style="color: #7f8c8d; margin: 5px 0 0 0;">Workplace Food Management</p>
          </div>
          
          <h2 style="color: #27ae60; text-align: center; margin-bottom: 30px;">
            🛒 Purchase Confirmed!
          </h2>
          
          <p style="font-size: 16px; color: #34495e; margin-bottom: 20px;">
            Hi <strong>${data.employeeName}</strong>,
          </p>
          
          <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 25px;">
            Your pantry purchase has been successfully processed. Here are the details:
          </p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-top: 0;">📋 Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Order ID:</strong></td><td style="padding: 5px 0;">${data.orderId}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Date:</strong></td><td style="padding: 5px 0;">${data.purchaseDate}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Total Items:</strong></td><td style="padding: 5px 0;">${data.totalItems}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Total Amount:</strong></td><td style="padding: 5px 0; font-weight: bold; color: #27ae60;">₹${data.total}</td></tr>
              ${data.vendorName ? `<tr><td style="padding: 5px 0;"><strong>Processed by:</strong></td><td style="padding: 5px 0;">${data.vendorName}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background-color: #fff; border: 1px solid #bdc3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #2c3e50; margin-top: 0;">🛍️ Items Purchased:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #ecf0f1;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #bdc3c7;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #bdc3c7;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #bdc3c7;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ecf0f1;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ecf0f1;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ecf0f1;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #155724;">
              <strong>✅ Thank you for your purchase!</strong> Your order has been recorded and your budget has been updated.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #95a5a6; margin: 0;">
              This is an automated confirmation from DineTech System.
            </p>
            <p style="font-size: 12px; color: #95a5a6; margin: 5px 0 0 0;">
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// Main email sending function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = await createTransporter();
    const emailContent = template(data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"DineTech System" <noreply@dinetech.com>',
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log success
    console.log(`✅ Email sent successfully to ${to}`);
    
    // If using test email service, log the preview URL
    if (!process.env.EMAIL_USER && !process.env.SMTP_USER) {
      console.log('📧 Preview email: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) || null
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Specific email functions
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  return sendEmail(user.email, emailTemplates.passwordReset, { user, resetUrl });
};

const sendPurchaseConfirmationEmail = async (employee, orderData) => {
  return sendEmail(employee.email, emailTemplates.purchaseConfirmation, orderData);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPurchaseConfirmationEmail,
  emailTemplates
}; 