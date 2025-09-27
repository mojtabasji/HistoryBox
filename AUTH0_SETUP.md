# Auth0 Setup Guide

This project uses @auth0/nextjs-auth0 with an Edge-compatible route (`/api/auth/me`). Configure the environment to avoid runtime errors like `"secret" is required`.

## 1) Create .env.local (use .env.example)

Required keys:

```env
AUTH0_SECRET=replace-with-32-byte-hex-or-strong-random
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_TENANT_REGION.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
```

Generate a strong AUTH0_SECRET (PowerShell):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2) Configure your Auth0 Application (Regular Web App)
- Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`
- Allowed Web Origins: `http://localhost:3000`

## 3) Validate locally

Run the validator script:

```powershell
npm run validate-env
```

If anything is missing you’ll see a list of required variables.

## 4) Test endpoints
- Visit `/api/auth/login` to start Universal Login.
- Visit `/api/auth/me` to check the session payload. When logged out, it returns `{ user: null }`.

## Notes
- The `/api/auth/me` route guards against missing Auth0 configuration and returns a 500 with a helpful JSON if keys are missing.
- You can also set `NEXT_PUBLIC_AUTH0_BASE_URL` if you need it for client-side helpers, but it’s not required for the SDK.
