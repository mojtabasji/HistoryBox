# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "history-box")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Set up Authentication

1. In your Firebase project dashboard, click on "Authentication" in the left sidebar
2. Click on "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" sign-in method
5. Click "Save"

## 3. Get Firebase Configuration

1. Click on the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on "Web app" icon (`</>`)
5. Register your app with a nickname (e.g., "history-box-web")
6. Copy the Firebase configuration object

## 4. Update Firebase Config

Replace the placeholder values in `src/lib/firebase.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 5. Test the Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Try creating a new account
4. Try logging in with the created account
5. Try the forgot password functionality

## Features Implemented

- ✅ User Registration (Sign Up)
- ✅ User Login (Sign In)
- ✅ Password Reset
- ✅ Protected Dashboard Route
- ✅ User Authentication State Management
- ✅ Logout Functionality
- ✅ Automatic Redirects (logged-in users → dashboard, logged-out users → login)

## File Structure Created

```
src/
├── lib/
│   └── firebase.js          # Firebase configuration
├── contexts/
│   └── AuthContext.tsx      # Authentication context
└── app/
    ├── login/
    │   └── page.tsx         # Login page
    ├── signup/
    │   └── page.tsx         # Sign up page
    ├── forgot-password/
    │   └── page.tsx         # Password reset page
    ├── dashboard/
    │   └── page.tsx         # Protected dashboard
    ├── layout.tsx           # Root layout with AuthProvider
    └── page.tsx             # Landing page
```

## Security Notes

- Never commit your Firebase configuration with real values to version control
- Consider using environment variables for sensitive configuration
- Set up Firebase security rules for your project
- Enable additional security features like email verification if needed
