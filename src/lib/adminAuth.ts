export function isValidAdminApiKey(authorizationHeader: string | null): boolean {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    // In production we want a key; return false if missing.
    if (process.env.NODE_ENV === 'production') return false;
    // In non-production environments, allow bypass when no key is configured
    // so local development is easier.
    return true;
  }

  if (!authorizationHeader) return false;
  const prefix = 'Bearer ';
  if (!authorizationHeader.startsWith(prefix)) return false;

  const provided = authorizationHeader.slice(prefix.length).trim();
  return provided === configuredKey;
}

export function extractAdminApiKeyFromHeader(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const prefix = 'Bearer ';
  if (!authorizationHeader.startsWith(prefix)) return null;
  return authorizationHeader.slice(prefix.length).trim() || null;
}
