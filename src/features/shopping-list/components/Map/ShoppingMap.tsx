import React, { useState, useEffect, useRef } from 'react'; // Importar useRef
import { preciosClarosService, Store } from '../../services/preciosClarosService';
import { Spinner } from '@/components/ui/Spinner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Importar Button
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Importar componentes de Leaflet
import 'leaflet/dist/leaflet.css';
import { StoreMarker } from './StoreMarker';
import L, { Map } from 'leaflet'; // Importar L y tipo Map
import { MapControls } from './MapControls'; // Importar controles

// Arreglo para icono por defecto de Leaflet con Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface ShoppingMapProps {
 onToggleFavorite: (storeId: string) => void; // Callback para favoritos
 favoriteStoreIds: Set<string>; // IDs de tiendas favoritas
 selectedStoreName: string | null; // <-- AÑADIR PROP
 // TODO: Añadir otras props si son necesarias (highlightedStoreId, onStoreSelect)
}

export function ShoppingMap({ onToggleFavorite, favoriteStoreIds, selectedStoreName }: ShoppingMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<Map | null>(null); // Ref para la instancia del mapa
  // Eliminar la línea duplicada de abajo

  useEffect(() => {
    const fetchLocationAndStores = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Obtener ubicación del usuario
      if (!navigator.geolocation) {
        setError("La geolocalización no está soportada por tu navegador.");
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // 2. Obtener tiendas cercanas
          try {
            const stores = await preciosClarosService.getStoresNearby(latitude, longitude);
            setNearbyStores(stores);
            if (stores.length === 0) {
               setError("No se encontraron tiendas cercanas."); // O un mensaje informativo
            }
          } catch (err) {
            console.error("Error fetching nearby stores:", err);
            setError("Error al buscar tiendas cercanas.");
            setNearbyStores([]); // Asegurar array vacío en caso de error
          } finally {
            setIsLoading(false);
          }
        },
        (geoError) => {
          console.error("Geolocation error:", geoError);
          let errorMsg = "Error al obtener tu ubicación.";
          if (geoError.code === geoError.PERMISSION_DENIED) {
            errorMsg = "Permiso de ubicación denegado.";
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            errorMsg = "Información de ubicación no disponible.";
          } else if (geoError.code === geoError.TIMEOUT) {
            errorMsg = "Timeout al obtener ubicación.";
          }
          setError(errorMsg);
          setIsLoading(false);
        },
        { timeout: 10000 } // Timeout de 10 segundos
      );
    };

    fetchLocationAndStores();
  }, []);

  // Funciones de control del mapa
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocateUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15); // Zoom 15 al localizar
    }
  };
  const handleFilterToggle = () => {
       // TODO: Implementar lógica para mostrar/ocultar filtros
       console.log("Toggle Filters clicked");
  };

  // Placeholder con estado de carga/error
  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground border rounded-lg">
        <Spinner className="mr-2" /> Obteniendo ubicación y tiendas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-muted flex flex-col items-center justify-center text-destructive border rounded-lg p-4 text-center">
         <AlertCircle className="h-6 w-6 mb-2" />
         {error}
      </div>
    );
  }

  // Definir centro inicial (ubicación usuario o default)
  const mapCenter: L.LatLngExpression = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-34.6037, -58.3816]; // Default: Buenos Aires
  const initialZoom = userLocation ? 14 : 12;

  return (
    <div className="h-full w-full border rounded-lg overflow-hidden relative"> {/* Añadir relative para posicionar controles */}
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {nearbyStores.map(store => {
           // <-- USAR selectedStoreName AQUÍ PARA RESALTAR
           const isSelected = store.sucursalNombre === selectedStoreName;
           console.log(`Store: ${store.sucursalNombre}, Is Selected: ${isSelected}`); // Log de ejemplo
           // Aplicar lógica de resaltado basada en isSelected (ej. cambiando icono, estilo)
          return (
            // Usar Marker directamente aquí o el componente StoreMarker si se personaliza
            <Marker key={store.id} position={[store.lat, store.lng]}>
              <Popup>
                <div>
                  <b>{store.sucursalNombre}</b> ({store.banderaDescripcion})<br />
                  {store.direccion}, {store.localidad} <br/>
                  <span className="text-xs text-muted-foreground">{store.distanciaDescripcion}</span>
                  <Button
                    size="sm"
                    variant={favoriteStoreIds.has(store.id) ? "secondary" : "outline"}
                    className="mt-2 w-full h-auto py-1 px-2 text-xs"
                    onClick={() => onToggleFavorite(store.id)}
                  >
                    {favoriteStoreIds.has(store.id) ? '★ Favorito' : '☆ Añadir Favorito'}
                  </Button>
                </div>
              </Popup>
            </Marker>
            // <StoreMarker key={store.id} store={store} /> // Si StoreMarker se implementa
          );
        })}
        {/* Opcional: Marcador para la ubicación del usuario */}
        {userLocation && (
           <Marker position={[userLocation.lat, userLocation.lng]} icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })}>
                <Popup>Tu ubicación</Popup>
           </Marker>
        )}
        {/* Añadir controles */}
        <MapControls
           onZoomIn={handleZoomIn}
           onZoomOut={handleZoomOut}
           onLocateUser={handleLocateUser}
           onFilterToggle={handleFilterToggle}
        />
      </MapContainer>
    </div>
  );
}