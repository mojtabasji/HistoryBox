/**
 * Simple geohash implementation for geographic region organization
 * This creates a grid-based hash for organizing posts by region
 */

export function calculateGeohash(latitude: number, longitude: number, precision: number = 5): string {
  const latRange = [-90.0, 90.0];
  const lngRange = [-180.0, 180.0];
  
  let geohash = '';
  let isLat = true;
  const lat = latitude;
  const lng = longitude;
  
  for (let i = 0; i < precision * 5; i++) {
    if (isLat) {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        geohash += '1';
        latRange[0] = mid;
      } else {
        geohash += '0';
        latRange[1] = mid;
      }
    } else {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        geohash += '1';
        lngRange[0] = mid;
      } else {
        geohash += '0';
        lngRange[1] = mid;
      }
    }
    isLat = !isLat;
  }
  
  // Convert binary string to base32 representation
  return binaryToBase32(geohash);
}

function binaryToBase32(binary: string): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let result = '';
  
  // Pad to multiple of 5
  while (binary.length % 5 !== 0) {
    binary += '0';
  }
  
  for (let i = 0; i < binary.length; i += 5) {
    const chunk = binary.substr(i, 5);
    const index = parseInt(chunk, 2);
    result += base32[index];
  }
  
  return result;
}

// Decode the custom geohash produced by calculateGeohash back into a bounding box
// Returns: [minLat, minLng, maxLat, maxLng]
export function decodeGeohashBox(hash: string): [number, number, number, number] {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  // Convert base32 to full bit string
  let bits = '';
  for (const ch of hash) {
    const idx = base32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid geohash character: ' + ch);
    bits += idx.toString(2).padStart(5, '0');
  }

  const latRange: [number, number] = [-90.0, 90.0];
  const lngRange: [number, number] = [-180.0, 180.0];
  let isLat = true; // Must match calculateGeohash ordering

  for (const b of bits) {
    if (isLat) {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (b === '1') latRange[0] = mid; else latRange[1] = mid;
    } else {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (b === '1') lngRange[0] = mid; else lngRange[1] = mid;
    }
    isLat = !isLat;
  }

  return [latRange[0], lngRange[0], latRange[1], lngRange[1]];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findOrCreateRegion(latitude: number, longitude: number, prisma: any) {
  const geohash = calculateGeohash(latitude, longitude);

  // 1) Try existing by modern schema
  const region = await prisma.region.findUnique({ where: { geohash } });
  if (region) return region;

  // 2) Create region; prefer setting legacy `hash` if some deployments require it
  try {
    return await prisma.region.create({ data: { geohash, postCount: 0 } });
  } catch {
    // If DB requires a legacy `hash` column, try again by passing it through a narrow any-escape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    try {
      return await prismaAny.region.create({ data: { geohash, postCount: 0, hash: geohash } });
  } catch {
      // Last-resort: handle race condition where another request created it
      const fallback = await prisma.region.findUnique({ where: { geohash } });
      if (fallback) return fallback;
      // If still not found, throw a descriptive error
      throw new Error('Failed to find or create region for geohash ' + geohash);
    }
  }
}