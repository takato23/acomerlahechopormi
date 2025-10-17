import type { GeoPoint } from '@/lib/geo';

export interface NearbyStore {
  id: string;
  name: string;
  address: string;
  location: GeoPoint;
  distanceKm: number;
  rating?: number | null;
  userRatingsTotal?: number | null;
  openNow?: boolean | null;
  placeId?: string | null;
  googleUrl?: string | null;
}
