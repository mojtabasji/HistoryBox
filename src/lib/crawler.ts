const CRAWLER_UA_REGEX = /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebot|ia_archiver)/i;

export function isCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_UA_REGEX.test(userAgent);
}

export type SearchParamsLike = {
  [key: string]: string | string[] | undefined;
};

/**
 * Detect whether a request should be treated as a crawler/SEO render.
 *
 * In addition to user-agent inspection, this allows forcing crawler mode
 * via search params (e.g. `?crawler=1` or `?bot=1`) for internal tools.
 */
export function isCrawlerRequest(
  userAgent: string | null | undefined,
  searchParams?: SearchParamsLike,
): boolean {
  if (isCrawlerUserAgent(userAgent)) return true;
  if (!searchParams) return false;

  const keys = ['crawler', 'bot', 'seoPreview'];
  for (const key of keys) {
    const value = searchParams[key];
    if (typeof value === 'string' && value === '1') return true;
    if (Array.isArray(value) && value.includes('1')) return true;
  }
  return false;
}
