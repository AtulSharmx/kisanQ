/**
 * The Master Spec's Centre Selection screen shows a distance per centre, but no screen in the
 * documented flow ever asks for or captures the farmer's GPS location — there's no location
 * permission step anywhere in the spec. Rather than silently adding an undocumented
 * location-permission screen, this derives a stable, plausible-looking distance per
 * (farmerId, centreId) pair so the ranked list still reads sensibly in a demo. Replace with a
 * real distance calculation once location capture is actually specified.
 */
export function pseudoDistanceKm(farmerId: string, centreId: string): number {
  const seed = `${farmerId}:${centreId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 2 + (hash % 380) / 10; // 2.0 km .. 40.0 km
}
