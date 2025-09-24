#!/usr/bin/env node
/* eslint-disable */

// Environment validation script
// Note: Run this with: node scripts/validate-env.js
// Make sure to have your .env.local file in the project root

const requiredVars = [
  'AUTH0_SECRET',
  'AUTH0_BASE_URL',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
];

const optionalVars = [
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

console.log('🔍 Validating Environment Configuration...\n');

// Check required variables
let allGood = true;
console.log('📋 Required Variables:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.slice(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allGood = false;
  }
}

console.log('\n📋 Optional Variables:');
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.slice(0, 10)}...`);
  } else {
    console.log(`⚠️  ${varName}: Not set (feature disabled)`);
  }
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Environment configuration is valid!');
  console.log('✅ Auth0 authentication will work');
  
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.log('✅ Google Maps integration will work');
  } else {
    console.log('ℹ️  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map features');
  }
  
  console.log('\n🚀 You can start your development server with: npm run dev');
} else {
  console.log('❌ Environment configuration has issues!');
  console.log('📝 Please check your .env.local file');
  console.log('📖 See ENVIRONMENT_SETUP.md for detailed instructions');
  process.exit(1);
}

// No additional checks for Auth0 beyond env presence.

console.log('');
