import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GeoPoint } from '@/lib/geo';

type GeolocationPermission = PermissionState | 'unsupported';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationResult {
  coords: GeoPoint | null;
  isLoading: boolean;
  error: string | null;
  permission: GeolocationPermission;
  requestLocation: () => void;
  lastUpdatedAt: number | null;
}

/**
 * Wrapper around navigator.geolocation with sensible defaults and defensive guards for SSR/tests.
 */
export const useGeolocation = (options: UseGeolocationOptions = {}): UseGeolocationResult => {
  const [coords, setCoords] = useState<GeoPoint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<GeolocationPermission>('prompt');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const optionsRef = useRef<UseGeolocationOptions>(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === 'undefined' || !('permissions' in navigator) || !('geolocation' in navigator)) {
      setPermission('unsupported');
      return;
    }

    let isMounted = true;

    // Observe permission changes if the browser supports it.
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (!isMounted) return;
        setPermission(status.state);
        status.onchange = () => {
          if (!isMounted) return;
          setPermission(status.state);
        };
      })
      .catch(() => {
        // Ignore errors; fall back to requesting permission on demand.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('La geolocalización no está disponible en este dispositivo.');
      setPermission('unsupported');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLastUpdatedAt(Date.now());
        setIsLoading(false);
      },
      (geoError) => {
        setError(
          geoError.message === 'User denied Geolocation'
            ? 'Necesitamos tu permiso para buscar tiendas cercanas.'
            : 'No pudimos obtener tu ubicación.'
        );
        setIsLoading(false);
      },
      optionsRef.current
    );
  }, []);

  return useMemo(
    () => ({
      coords,
      isLoading,
      error,
      permission,
      requestLocation,
      lastUpdatedAt,
    }),
    [coords, isLoading, error, permission, requestLocation, lastUpdatedAt]
  );
};
