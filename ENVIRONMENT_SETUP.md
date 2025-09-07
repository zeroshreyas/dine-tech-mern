# 🔧 Environment Setup Guide for DineTech

## 📁 Quick Setup Steps

### 1. Create Environment File

```bash
# Navigate to backend directory
cd dine-tech-mern/backend

# Copy the example file to create your .env
copy env.example .env    # Windows
# OR
cp env.example .env      # macOS/Linux
```

### 2. Configure Email Settings

Open the `.env` file and choose your email configuration:

#### Option A: 📧 Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Settings](https://myaccount.google.com)
   - Navigate to **Security** → **2-Step Verification**
   - Follow the steps to enable 2FA

2. **Generate App Password:**
   - Go to **Security** → **App passwords**
   - Select **Mail** as the app
   - Copy the 16-digit password (format: `abcd-efgh-ijkl-mnop`)

3. **Update .env file:**
   ```env
   EMAIL_USER=your-actual-gmail@gmail.com
   EMAIL_PASS=abcd-efgh-ijkl-mnop
   EMAIL_FROM="DineTech System" <noreply@yourcompany.com>
   ```

#### Option B: 🌐 Custom SMTP Setup

1. **Comment out Gmail settings:**
   ```env
   # EMAIL_USER=your-gmail@gmail.com
   # EMAIL_PASS=abcd-efgh-ijkl-mnop
   ```

2. **Uncomment and configure SMTP:**
   ```env
   SMTP_HOST=smtp.yourdomain.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASS=your-password
   EMAIL_FROM="DineTech System" <noreply@yourdomain.com>
   ```

#### Option C: 🧪 Test Mode (Development)

Leave email settings with placeholder values for automatic test mode:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop
```

## 🔒 Security Configuration

### Update JWT Secret
```env
JWT_SECRET=your-unique-super-secure-secret-key-here
```

### Frontend URL
Update for your deployment:
```env
FRONTEND_URL=http://localhost:5173              # Development
FRONTEND_URL=https://yourdomain.com             # Production
```

## 🚀 Start the Application

```bash
# Start backend server
cd backend
npm start

# Start frontend (in new terminal)
cd ../frontend
npm run dev
```

## 📧 Testing Email Functionality

### 1. Test Mode (No Configuration)
- ✅ Automatic test emails with preview URLs
- 📝 Check console for preview links
- 🚫 No real emails sent

### 2. Gmail/SMTP Mode
- ✅ Real emails sent to users
- 📧 Check inbox for password reset emails
- 🛒 Purchase confirmation emails sent

## ⚠️ Common Issues & Solutions

### "Authentication failed" Error
- ✅ Use App Password, not regular Gmail password
- ✅ Ensure 2-Factor Authentication is enabled
- ✅ Check EMAIL_USER and EMAIL_PASS values

### "Network error" or "Connection timeout"
- ✅ Check internet connection
- ✅ Verify SMTP settings for custom providers
- ✅ Check firewall/antivirus blocking SMTP ports

### Emails not showing in UI
- ✅ Check browser console for debug messages
- ✅ Verify backend server is running on port 5000
- ✅ Check email service configuration in console logs

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_USER` | Gmail address or SMTP username | `john@gmail.com` |
| `EMAIL_PASS` | Gmail app password or SMTP password | `abcd-efgh-ijkl-mnop` |
| `EMAIL_FROM` | Sender name and email | `"DineTech" <noreply@company.com>` |
| `SMTP_HOST` | Custom SMTP server hostname | `smtp.yourdomain.com` |
| `SMTP_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_SECURE` | Use SSL/TLS | `false` for port 587, `true` for 465 |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |

## 🎯 Production Deployment

For production deployment:

1. **Secure JWT Secret:**
   ```env
   JWT_SECRET=generate-a-strong-random-secret-key
   ```

2. **Update URLs:**
   ```env
   FRONTEND_URL=https://your-production-domain.com
   ```

3. **Database:**
   ```env
   MONGODB_URI=mongodb://your-production-db-url
   ```

4. **Environment:**
   ```env
   NODE_ENV=production
   ```

🎉 **You're all set!** The email system will now send professional emails for password resets and purchase confirmations. 