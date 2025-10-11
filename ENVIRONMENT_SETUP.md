# Environment Variables Setup Guide

## 🔐 Security Best Practices

Your Firebase and Google Maps credentials are now safely stored in environment variables instead of being hardcoded in your source files.

## 📁 Files Structure

```
.env.local          # Your actual credentials (never commit to git)
.env.example        # Template with placeholder values (safe to commit)
src/lib/config.js   # Configuration validation utility
src/lib/firebase.js # Updated to use environment variables
```

## 🔧 Setup Instructions

### 1. Environment Variables File

Your `.env.local` file has been created with your Firebase credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBNe_UaHQTLF-Ynk3uPgaDSoA7eh9fDtGc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=history-box-a74c0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=history-box-a74c0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=history-box-a74c0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=963065363604
NEXT_PUBLIC_FIREBASE_APP_ID=1:963065363604:web:7110863b451eb414e74881
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VJSGDJK0R9

# Google Maps API Key (add when you get it)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. Configuration Validation

The `src/lib/config.js` file provides:
- ✅ **Automatic validation** of required environment variables
- ✅ **Clear error messages** if variables are missing
- ✅ **Helper functions** to check feature availability

### 3. Updated Firebase Configuration

Your `src/lib/firebase.js` now:
- ✅ **Loads credentials** from environment variables
- ✅ **Validates configuration** before initializing Firebase
- ✅ **Provides helpful errors** if setup is incorrect

## 🔒 Security Benefits

### ✅ **What's Protected:**
- Firebase API keys and configuration
- Google Maps API key
- All sensitive credentials

### ✅ **How It's Protected:**
- `.env.local` is in `.gitignore` (never committed)
- Environment variables are only available at runtime
- Configuration validation prevents missing credentials

### ✅ **Safe to Share:**
- `.env.example` with placeholder values
- Source code without hardcoded credentials
- Configuration utilities

## 🚀 Usage

### **Development:**
1. Ensure `.env.local` exists with your credentials
2. Run `npm run dev`
3. Configuration is automatically validated on startup

### **Production Deployment:**
1. Set environment variables in your hosting platform
2. Use the same variable names as in `.env.local`
3. Deploy your application

### **Team Collaboration:**
1. Share `.env.example` with team members
2. Each developer creates their own `.env.local`
3. No sensitive data in version control

## 📋 Environment Variables Reference

### **Required (Firebase):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### **Optional:**
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (Analytics)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps functionality)

### **Authentication (SuperTokens + SMS API)**

Add these to your `.env.local` (values are examples/placeholders):

```env
# SuperTokens Core
SUPERTOKENS_CONNECTION_URI=https://auth.bytecraft.ir
# If your core has an API key
SUPERTOKENS_API_KEY=

# Public domains used by the app
NEXT_PUBLIC_API_DOMAIN=http://localhost:3000
NEXT_PUBLIC_WEBSITE_DOMAIN=http://localhost:3000

# External SMS API
# The app will call this with: POST /sms/send with JSON body { phone, message } and Authorization: Bearer <TOKEN>
SMS_API_URL=https://your-sms-service.example.com/sms/send
SMS_API_TOKEN=your_sms_api_token
```

Notes:
- API endpoints are mounted at `/api/auth` and UI at `/login` in code; override only if you change routes.
- Never commit `.env.local`. Share `.env.example` values with your team.

## 🛠️ Troubleshooting

### **Error: Missing required environment variables**
- Check that `.env.local` exists in your project root
- Verify all required variables are present
- Restart your development server after changes

### **Firebase not connecting**
- Verify your Firebase credentials are correct
- Check the browser console for specific errors
- Ensure your Firebase project is active

### **Maps not loading**
- Add your Google Maps API key to `.env.local`
- Restart the development server
- Check that the API key has proper restrictions

## 🎯 Next Steps

1. **Add Google Maps API Key** when you get it from Google Cloud Console
2. **Test the application** to ensure everything works
3. **Set up production environment variables** when deploying

Your credentials are now secure and your application is ready for both development and production! 🔐✨
