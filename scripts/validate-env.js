#!/usr/bin/env node
/* eslint-disable */

// Environment validation script
// Run with: node scripts/validate-env.js
// This script will load .env and .env.local (if present) so process.env has values like in Next.js

const fs = require('fs');
const path = require('path');

let dotenvLoaded = false;
let loadedFiles = [];
try {
  const dotenv = require('dotenv');
  const envPath = path.resolve(process.cwd(), '.env');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedFiles.push('.env');
  }
  if (fs.existsSync(envLocalPath)) {
    // .env.local overrides .env
    dotenv.config({ path: envLocalPath, override: true });
    loadedFiles.push('.env.local');
  }
  dotenvLoaded = true;
} catch (e) {
  // Fallback: continue without dotenv
}

const groups = {
  cloudinary: {
    title: 'Cloudinary',
    required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    optional: [],
  },
  supertokens: {
    title: 'SuperTokens',
    required: ['SUPERTOKENS_CONNECTION_URI', 'NEXT_PUBLIC_API_DOMAIN', 'NEXT_PUBLIC_WEBSITE_DOMAIN'],
    optional: ['SUPERTOKENS_API_KEY'],
  },
  supabase: {
    title: 'Supabase / Database',
    // Prisma uses DATABASE_URL; include SUPABASE_* as optional if you rely on them elsewhere
    required: ['DATABASE_URL'],
    optional: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  smsapi: {
    title: 'SMS API',
    required: ['SMS_API_URL', 'SMS_API_TOKEN'],
    optional: [],
  },
  optionalGlobal: {
    title: 'Optional (Global)',
    required: [],
    optional: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
  },
};

console.log('🔍 Validating Environment Configuration...');
if (dotenvLoaded) {
  console.log(`📄 Loaded env files: ${loadedFiles.join(', ') || 'none'}`);
} else {
  console.log('⚠️  dotenv not available; relying on process.env only');
}
console.log('');

let allGood = true;
for (const key of Object.keys(groups)) {
  const group = groups[key];
  console.log(`� ${group.title}`);

  if (group.required.length) {
    console.log('  Required:');
    for (const name of group.required) {
      const value = process.env[name];
      if (value) {
        console.log(`  ✅ ${name}: ${String(value).slice(0, 12)}...`);
      } else {
        console.log(`  ❌ ${name}: MISSING`);
        allGood = false;
      }
    }
  }

  if (group.optional.length) {
    console.log('  Optional:');
    for (const name of group.optional) {
      const value = process.env[name];
      if (value) {
        console.log(`  ✅ ${name}: ${String(value).slice(0, 12)}...`);
      } else {
        console.log(`  ⚠️  ${name}: Not set`);
      }
    }
  }

  console.log('');
}

console.log('='.repeat(60));
if (allGood) {
  console.log('🎉 Environment configuration looks good!');
  console.log('✅ SuperTokens + SMS login can be initialised');
  console.log('✅ Database URL available for Prisma');
  console.log('✅ Cloudinary is configured for uploads');
  console.log('\n🚀 You can start your development server with: npm run dev');
} else {
  console.log('❌ Environment configuration has issues');
  console.log('📝 Please update your .env.local (or deployment env)');
  console.log('📖 See ENVIRONMENT_SETUP.md for the variable reference');
  process.exit(1);
}

console.log('');
