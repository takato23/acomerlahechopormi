/// <reference types="@types/google.maps" />

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  CircleF,
  useJsApiLoader,
} from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { useGeolocation } from '../hooks/useGeolocation';
import type { NearbyStore } from '../types/nearbyStore';

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 } as const; // Buenos Aires
const DEFAULT_ZOOM = 13;
const DEFAULT_RADIUS_KM = 5;
const MIN_RADIUS_KM = 3;
const MAX_RADIUS_KM = 20;
const RADIUS_OPTIONS = [3, 5, 10, 15, 20];

const MAP_LIBRARIES: (
  | 'places'
  | 'drawing'
  | 'geometry'
  | 'visualization'
)[] = ['places', 'geometry'];

interface ShoppingMapPanelProps {
  selectedStoreId: string | null;
  onSelectStore?: (store: NearbyStore | null) => void;
  onStoresUpdate?: (stores: NearbyStore[]) => void;
}

const mapContainerClassName = 'h-[260px] w-full sm:h-[320px] lg:h-[360px] rounded-lg overflow-hidden border';

const createNearbyStore = (
  place: google.maps.places.PlaceResult,
  center: google.maps.LatLng,
): NearbyStore | null => {
  const geometry = place.geometry;
  const location = geometry?.location;

  if (!location || !window.google) {
    return null;
  }

  const distanceMeters = window.google.maps.geometry?.spherical?.computeDistanceBetween
    ? window.google.maps.geometry.spherical.computeDistanceBetween(center, location)
    : null;

  const distanceKm = distanceMeters !== null
    ? Number((distanceMeters / 1000).toFixed(2))
    : 0;

  return {
    id: place.place_id ?? `${location.lat()}-${location.lng()}`,
    name: place.name ?? 'Supermercado sin nombre',
    address: place.vicinity ?? place.formatted_address ?? 'Dirección no disponible',
    location: { lat: location.lat(), lng: location.lng() },
    distanceKm,
    rating: place.rating ?? null,
    userRatingsTotal: place.user_ratings_total ?? null,
    openNow: place.opening_hours?.isOpen?.() ?? null,
    placeId: place.place_id ?? null,
    googleUrl: place.url ?? place.website ?? null,
  };
};

const LoadingMap = () => (
  <div className="flex h-[260px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground sm:h-[320px] lg:h-[360px]">
    <Spinner className="mr-2" size="sm" /> Cargando mapa…
  </div>
);

const MissingApiKey = () => (
  <div className="flex h-[260px] items-center justify-center rounded-md border bg-amber-50 px-4 text-center text-sm text-amber-900 sm:h-[320px] lg:h-[360px]">
    Configurá <code className="rounded bg-amber-100 px-1">VITE_GOOGLE_MAPS_API_KEY</code> para ver supermercados cercanos.
  </div>
);

export const ShoppingMapPanel: React.FC<ShoppingMapPanelProps> = ({
  selectedStoreId,
  onSelectStore,
  onStoresUpdate,
}) => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [isFetchingStores, setIsFetchingStores] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const {
    coords,
    error: geolocationError,
    isLoading: isLocating,
    permission,
    requestLocation,
  } = useGeolocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 });

  const effectiveCenter = coords ?? DEFAULT_CENTER;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'shopping-list-google-maps',
    googleMapsApiKey: googleMapsApiKey ?? '',
    libraries: MAP_LIBRARIES,
  });

  useEffect(() => {
    if (selectedStoreId) {
      setActiveStoreId(selectedStoreId);
    }
  }, [selectedStoreId]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    placesServiceRef.current = new google.maps.places.PlacesService(map);
    setMapReady(true);
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
    placesServiceRef.current = null;
    setMapReady(false);
  }, []);

  const processPlacesResponse = useCallback(
    (
      accumulator: NearbyStore[],
      centerLatLng: google.maps.LatLng,
      places: google.maps.places.PlaceResult[] | null,
    ) => {
      if (!places) return accumulator;
      const mapped = places
        .map((place) => createNearbyStore(place, centerLatLng))
        .filter((store): store is NearbyStore => Boolean(store));
      const merged = [...accumulator, ...mapped];

      return merged
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .filter((store, index, array) => array.findIndex((candidate) => candidate.id === store.id) === index);
    },
    [],
  );

  const fetchStores = useCallback(
    (centerLiteral: google.maps.LatLngLiteral, radius: number) => {
      if (!placesServiceRef.current || typeof window === 'undefined' || !window.google) {
        return;
      }

      const centerLatLng = new window.google.maps.LatLng(centerLiteral.lat, centerLiteral.lng);
      setIsFetchingStores(true);
      setStoresError(null);

      let accumulatedStores: NearbyStore[] = [];

      const handleResults = (
        results: google.maps.places.PlaceResult[] | null,
        status: google.maps.places.PlacesServiceStatus,
        pagination: google.maps.places.PlaceSearchPagination | null | undefined,
      ) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          accumulatedStores = processPlacesResponse(accumulatedStores, centerLatLng, results);

          if (pagination && pagination.hasNextPage) {
            // Places API requires a slight delay before requesting the next page.
            setTimeout(() => pagination.nextPage(), 250);
            return;
          }

          setStores(accumulatedStores);
          onStoresUpdate?.(accumulatedStores);
          setIsFetchingStores(false);
          return;
        }

        if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setStores([]);
          onStoresUpdate?.([]);
          setIsFetchingStores(false);
          return;
        }

        let message = 'No pudimos cargar los supermercados cercanos.';
        if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          message = 'Superamos el límite de consultas de Google Maps. Intentalo nuevamente en breve.';
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          message = 'Revisá la configuración de tu clave de Google Maps.';
        }

        setStoresError(message);
        setIsFetchingStores(false);
      };

      placesServiceRef.current.nearbySearch(
        {
          location: centerLatLng,
          radius: radius * 1000,
          type: 'supermarket',
        },
        handleResults,
      );
    },
    [onStoresUpdate, processPlacesResponse],
  );

  const handleRadiusChange = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, MIN_RADIUS_KM), MAX_RADIUS_KM);
    setRadiusKm(clamped);
  }, []);

  const handleSelectStore = useCallback(
    (storeId: string) => {
      const store = stores.find((candidate) => candidate.id === storeId) ?? null;
      setActiveStoreId(storeId);
      onSelectStore?.(store);
    },
    [stores, onSelectStore],
  );

  const handleRefreshStores = useCallback(() => {
    fetchStores(effectiveCenter, radiusKm);
  }, [effectiveCenter, radiusKm, fetchStores]);

  useEffect(() => {
    if (!isLoaded || !mapReady) return;
    fetchStores(effectiveCenter, radiusKm);
  }, [isLoaded, mapReady, effectiveCenter, radiusKm, fetchStores]);

  const activeStore = useMemo(() => {
    if (!activeStoreId) return null;
    return stores.find((store) => store.id === activeStoreId) ?? null;
  }, [activeStoreId, stores]);

  if (!googleMapsApiKey) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tiendas cercanas</CardTitle>
        </CardHeader>
        <CardContent>
          <MissingApiKey />
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tiendas cercanas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No pudimos cargar Google Maps ({loadError.message}). Revisá tu conexión o la clave configurada.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold">Tiendas cercanas</CardTitle>
          <Badge variant="secondary">{stores.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Radio:</span>
          <div className="flex flex-wrap items-center gap-1">
            {RADIUS_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={radiusKm === option ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleRadiusChange(option)}
                aria-pressed={radiusKm === option}
              >
                {option} km
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                requestLocation();
              }}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Buscando ubicación…
                </>
              ) : (
                'Usar mi ubicación'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshStores}
              disabled={isFetchingStores}
            >
              {isFetchingStores ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Actualizando…
                </>
              ) : (
                'Actualizar'
              )}
            </Button>
          </div>
        </div>
        {geolocationError && (
          <p className="text-xs text-amber-600" aria-live="polite">{geolocationError}</p>
        )}
        {permission === 'denied' && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Habilitá el permiso de ubicación en el navegador para centrar el mapa en tu zona.
          </p>
        )}
        {storesError && (
          <p className="text-xs text-destructive" aria-live="polite">{storesError}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!isLoaded ? (
          <LoadingMap />
        ) : (
          <GoogleMap
            center={effectiveCenter}
            zoom={DEFAULT_ZOOM}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
            mapContainerClassName={mapContainerClassName}
            onLoad={handleMapLoad}
            onUnmount={handleMapUnmount}
          >
            <CircleF
              center={effectiveCenter}
              radius={radiusKm * 1000}
              options={{
                fillColor: '#60a5fa',
                fillOpacity: 0.12,
                strokeColor: '#2563eb',
                strokeOpacity: 0.4,
                strokeWeight: 1,
              }}
            />

            {coords && (
              <MarkerF
                position={coords}
                label={{ text: 'Vos', className: 'text-xs font-semibold text-primary' }}
                icon={window.google ? {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: '#2563eb',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                } : undefined}
              />
            )}

            {stores.map((store) => (
              <MarkerF
                key={store.id}
                position={store.location}
                onClick={() => handleSelectStore(store.id)}
                label={store.id === selectedStoreId ? { text: '★', className: 'text-lg text-yellow-500' } : undefined}
              />
            ))}

            {activeStore && (
              <InfoWindowF
                position={activeStore.location}
                onCloseClick={() => setActiveStoreId(null)}
              >
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeStore.name}</p>
                    <p className="text-xs text-muted-foreground">{activeStore.address}</p>
                    <p className="text-xs text-muted-foreground">{activeStore.distanceKm} km</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSelectStore(activeStore.id)}
                  >
                    Seleccionar tienda
                  </Button>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lista rápida</p>
          {stores.length === 0 && !isFetchingStores ? (
            <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              No encontramos supermercados en el radio seleccionado.
            </p>
          ) : (
            <ul className="space-y-2">
              {stores.slice(0, 15).map((store) => {
                const isSelected = selectedStoreId === store.id;
                return (
                  <li key={store.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectStore(store.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{store.name}</span>
                        <span className="text-xs text-muted-foreground">{store.distanceKm} km</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{store.address}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {store.rating ? `⭐ ${store.rating.toFixed(1)} (${store.userRatingsTotal ?? 0})` : 'Sin valoraciones'}
                        {store.openNow === true ? <span className="text-emerald-600">Abierto ahora</span> : null}
                        {store.openNow === false ? <span className="text-rose-600">Cerrado</span> : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShoppingMapPanel;
