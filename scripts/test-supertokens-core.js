#!/usr/bin/env node
/* eslint-disable */

// SuperTokens Core reachability test
// Run with: node scripts/test-supertokens-core.js  (or: npm run test:supertokens)
//
// Loads .env / .env.local (if present) the same way scripts/validate-env.js does,
// then performs GET ${SUPERTOKENS_CONNECTION_URI}/ and expects the core's
// plain-text "hello" response to prove we reached it.

const fs = require('fs');
const path = require('path');

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
} catch (e) {
  // Fallback: continue without dotenv
}

// Same fallback as src/lib/supertokensConfig.ts so the test checks
// the URI the app would actually use.
const DEFAULT_CONNECTION_URI = 'https://auth.bytecraft.ir';
const connectionURI = (
  process.env.SUPERTOKENS_CONNECTION_URI || DEFAULT_CONNECTION_URI
).replace(/\/+$/, '');
const apiKey = process.env.SUPERTOKENS_API_KEY;
const timeoutMs = Number(process.env.SUPERTOKENS_TEST_TIMEOUT_MS) || 5000;

const headers = { Accept: 'text/plain, application/json' };
if (apiKey) headers['api-key'] = apiKey;

console.log('🔍 SuperTokens Core reachability test');
if (loadedFiles.length) {
  console.log(`📄 Loaded env files: ${loadedFiles.join(', ')}`);
}
console.log(`🌐 GET ${connectionURI}/ (timeout ${timeoutMs}ms)`);
if (!process.env.SUPERTOKENS_CONNECTION_URI) {
  console.log('⚠️  SUPERTOKENS_CONNECTION_URI not set; using code default');
}
console.log('');

async function main() {
  let response;
  try {
    response = await fetch(`${connectionURI}/`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    });
  } catch (err) {
    console.log(`❌ Could not reach SuperTokens core at ${connectionURI}`);
    console.log(`   ${err && err.name ? err.name + ': ' : ''}${err && err.message ? err.message : err}`);
    console.log('\n📝 Check SUPERTOKENS_CONNECTION_URI and network access to the core.');
    process.exit(1);
  }

  const body = (await response.text()).trim();
  const reachedHello =
    response.ok && /\bhello\b/i.test(body);

  if (reachedHello) {
    console.log(`✅ Core responded ${response.status} with "${body.slice(0, 80)}"`);
    console.log('🎉 SuperTokens core is reachable and healthy');
    process.exit(0);
  }

  console.log(`❌ Unexpected response from SuperTokens core`);
  console.log(`   status: ${response.status}`);
  console.log(`   body:   ${body.slice(0, 200) || '(empty)'}`);
  console.log('\n📝 Expected a 2xx response with a plain "hello" body.');
  process.exit(1);
}

main();
