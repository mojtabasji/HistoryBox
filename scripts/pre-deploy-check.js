#!/usr/bin/env node
/* eslint-disable */

// Pre-deployment validation script
console.log('🔍 Pre-Deployment Validation for Vercel...\n');

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'next.config.ts',
  'eslint.config.mjs',
  '.eslintignore',
  'src/app/layout.tsx',
  'src/lib/firebase.js',
];

console.log('📁 Checking required files:');
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'dev'];

for (const script of requiredScripts) {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
    allFilesExist = false;
  }
}

// Check dependencies
console.log('\n📦 Checking key dependencies:');
const requiredDeps = [
  'next',
  'react',
  'react-dom',
  'firebase',
  'firebase-admin',
  'cloudinary'
];

for (const dep of requiredDeps) {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
}

// Check ESLint ignore patterns
console.log('\n🔧 Checking ESLint configuration:');
if (fs.existsSync('.eslintignore')) {
  const eslintIgnore = fs.readFileSync('.eslintignore', 'utf8');
  if (eslintIgnore.includes('src/generated/') || eslintIgnore.includes('**/generated/')) {
    console.log('✅ ESLint ignore patterns include generated files');
  } else {
    console.log('⚠️  ESLint ignore might not exclude generated files');
  }
} else {
  console.log('⚠️  .eslintignore file not found');
}

// Environment variables reminder
console.log('\n🔐 Environment Variables Checklist:');
console.log('Make sure these are set in Vercel Dashboard:');
console.log('   • NEXT_PUBLIC_FIREBASE_API_KEY');
console.log('   • NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
console.log('   • NEXT_PUBLIC_FIREBASE_PROJECT_ID');
console.log('   • NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
console.log('   • NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
console.log('   • NEXT_PUBLIC_FIREBASE_APP_ID');
console.log('   • NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID');
console.log('   • FIREBASE_SERVICE_ACCOUNT (JSON)  OR:');
console.log('       • FIREBASE_PROJECT_ID');
console.log('       • FIREBASE_CLIENT_EMAIL');
console.log('       • FIREBASE_PRIVATE_KEY');
console.log('   • CLOUDINARY_CLOUD_NAME');
console.log('   • CLOUDINARY_API_KEY');
console.log('   • CLOUDINARY_API_SECRET');

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 Pre-deployment validation PASSED!');
  console.log('✅ Ready to deploy to Vercel');
  console.log('\n📝 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Fix: ESLint config for deployment"');
  console.log('   3. git push origin main');
  console.log('   4. Add environment variables in Vercel dashboard');
  process.exit(0);
} else {
  console.log('❌ Pre-deployment validation FAILED!');
  console.log('📝 Please fix the missing files/dependencies above');
  process.exit(1);
}
