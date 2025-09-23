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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findOrCreateRegion(latitude: number, longitude: number, prisma: any) {
  const geohash = calculateGeohash(latitude, longitude);
  
  let region = await prisma.region.findUnique({
    where: { geohash }
  });
  
  if (!region) {
    region = await prisma.region.create({
      data: {
        geohash,
        postCount: 0
      }
    });
  }
  
  return region;
}