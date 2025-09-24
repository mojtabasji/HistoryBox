#!/usr/bin/env node
/* eslint-disable */

// Environment validation script
// Note: Run this with: node scripts/validate-env.js
// Make sure to have your .env.local file in the project root

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const optionalVars = [
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
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
  console.log('✅ Firebase authentication will work');
  
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

// Additional check: Compare Firebase client project with Admin project
try {
  const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let adminProject = process.env.FIREBASE_PROJECT_ID;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svc) {
    const parsed = JSON.parse(svc);
    adminProject = parsed.project_id || parsed.projectId || adminProject;
  }
  if (clientProject && adminProject && clientProject !== adminProject) {
    console.log('\n⚠️  Detected mismatch between client Firebase project and Admin project:');
    console.log(`   • NEXT_PUBLIC_FIREBASE_PROJECT_ID = ${clientProject}`);
    console.log(`   • Admin project (service account) = ${adminProject}`);
    console.log('   → Tokens from the client will be rejected by Admin. Make them match.');
  }
} catch (_e) {
  // ignore
}

console.log('');
