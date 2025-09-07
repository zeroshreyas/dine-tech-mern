# Email Setup for DineTech - Complete Guide

## 📧 Email Service Options

### Option 1: 🧪 Test Mode (Development) - **AUTOMATIC**
✅ **No configuration needed!** The system automatically uses **Ethereal Email** for testing.
- 🚫 Emails won't be delivered to real addresses
- 👀 Preview URLs logged in console for viewing
- 🔧 Perfect for development and testing

### Option 2: 📧 Gmail Configuration (Production)

#### Step 1: Enable Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **Security** → **App passwords**
4. Select **Mail** as the app
5. Copy the 16-digit app password

#### Step 2: Configure Environment Variables
Create a `.env` file in the `backend` folder:

```env
# Gmail Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop
EMAIL_FROM="DineTech System" <noreply@yourcompany.com>

# App Configuration
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
```

### Option 3: 🌐 Custom SMTP Server

For other email providers (Outlook, Yahoo, custom SMTP):

```env
# SMTP Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM="DineTech System" <noreply@yourdomain.com>
```

## Testing the Email Functionality

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Go to the login page and click "Forgot Password?"**

3. **Enter any user email address (e.g., john.smith@company.com)**

4. **Check the console output:**
   - **Test mode:** You'll see a preview URL to view the email
   - **Gmail mode:** Email will be sent to the actual address

## Email Template Features

✅ **Professional HTML design**
✅ **Company branding**
✅ **Secure reset links with 1-hour expiration**
✅ **Mobile-responsive layout**
✅ **Clear instructions for users**

## Troubleshooting

- **"Authentication failed"**: Check your Gmail app password
- **"Network error"**: Verify internet connection
- **"User not found"**: System won't reveal this for security, but email won't be sent

The system prioritizes security and user experience with proper error handling and professional email templates. 