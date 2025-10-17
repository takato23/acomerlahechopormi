export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Calculates the Haversine distance between two geo points in kilometers.
 */
export const haversineDistance = (a: GeoPoint, b: GeoPoint): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return Number((EARTH_RADIUS_KM * c).toFixed(2));
};

/**
 * Returns true if the distance between the points is less or equal than the given radius Km.
 * Applies a small tolerance to account for floating point rounding.
 */
export const isWithinRadius = (a: GeoPoint, b: GeoPoint, radiusKm: number, toleranceKm = 0.05): boolean => {
  return haversineDistance(a, b) <= radiusKm + toleranceKm;
};
