// Environment configuration validation
const requiredEnvVars = {
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables
export function validateEnvironment() {
  const missingVars = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `- ${v}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }
}

// Get configuration with validation
export function getFirebaseConfig() {
  validateEnvironment();
  
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

// Check if optional features are available
export function isGoogleMapsEnabled() {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

export function isAnalyticsEnabled() {
  return !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
}

export function isCloudinaryEnabled() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Get Cloudinary configuration (server-side only)
export function getCloudinaryConfig() {
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
}

// Payment service configuration (server-side only)
export function getPaymentConfig() {
  const baseUrl = process.env.PAY_BASE_URL || 'https://pay.bytecraft.ir';
  const apiKey = process.env.PAY_API_KEY || '';
  const serviceId = process.env.PAY_SERVICE_ID || 'historybox';
  const callbackUrl = process.env.PAY_CALLBACK_URL || '';
  return { baseUrl, apiKey, serviceId, callbackUrl };
}
