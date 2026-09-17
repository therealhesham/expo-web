// Straight-line distance between two coordinates — same haversine approach
// rentcar's own lib/delivery-origin-city.ts uses, so delivery fee estimates
// stay consistent with the web app rather than inventing a different method.
// Uses react-native-maps' own {latitude, longitude} field names throughout.
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
