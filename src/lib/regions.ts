import ngeohash from 'ngeohash';

export function getRegionHash(lat: number, lon: number): string {
  return ngeohash.encode(lat, lon, 5);
}

export type UnlockResult = { ok: true } | { ok: false; error: string };
