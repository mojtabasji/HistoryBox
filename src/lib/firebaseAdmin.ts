import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function sanitizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let k = key;
  // Handle escaped newlines and wrapping quotes
  k = k.replace(/\\n/g, '\n');
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  return k;
}

export function getServerAuth(): Auth {
  if (!getApps().length) {
    // Option 1: FIREBASE_SERVICE_ACCOUNT as JSON
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    let projectId: string | undefined;
    let clientEmail: string | undefined;
    let privateKey: string | undefined;

    if (svcJson) {
      try {
        const parsed = JSON.parse(svcJson);
        projectId = parsed.project_id || parsed.projectId || process.env.FIREBASE_PROJECT_ID;
        clientEmail = parsed.client_email || parsed.clientEmail || process.env.FIREBASE_CLIENT_EMAIL;
        privateKey = sanitizePrivateKey(parsed.private_key || parsed.privateKey || process.env.FIREBASE_PRIVATE_KEY);
      } catch (e) {
        // Re-throw with clearer context
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON: ' + msg);
      }
    } else {
      // Option 2: individual env vars
      projectId = process.env.FIREBASE_PROJECT_ID;
      clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      privateKey = sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    }

    const missing: string[] = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    if (missing.length) {
      throw new Error(
        `Firebase Admin not configured. Missing: ${missing.join(', ')}. Add these in your environment (Vercel/Local).`
      );
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey: privateKey! }),
    });
  }
  return getAuth();
}
