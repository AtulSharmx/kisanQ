/**
 * Centre Selection shows a distance per centre, but nothing in the documented flow ever asks
 * for the farmer's location. Rather than inventing a permission screen the spec doesn't have,
 * this derives a stable plausible distance per (farmerId, centreId) so the ranked list reads
 * sensibly in a demo. Replace once location capture is actually specified.
 */
export function pseudoDistanceKm(farmerId: string, centreId: string): number {
  const seed = `${farmerId}:${centreId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 2 + (hash % 380) / 10; // 2.0 km .. 40.0 km
}
