import ngeohash from 'ngeohash';

export function calculateGeohash(latitude: number, longitude: number, precision: number = 5): string {
  return ngeohash.encode(latitude, longitude, precision);
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