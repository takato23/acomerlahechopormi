import React, { useState, useEffect, useRef, useCallback } from 'react'; // Importar useRef y useCallback
import { preciosClarosService, Store } from '../../services/preciosClarosService';
import { Spinner } from '@/components/ui/Spinner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Importar Button
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Importar componentes de Leaflet
import 'leaflet/dist/leaflet.css';
import { StoreMarker } from './StoreMarker';
import L, { Map } from 'leaflet'; // Importar L y tipo Map
import { MapControls } from './MapControls'; // Importar controles
import { toast } from 'sonner';
import { Input } from '@/components/ui/input'; // Importar Input
import { StoreListPanel } from './StoreListPanel'; // <-- IMPORTAR PANEL
import { List, Filter } from 'lucide-react'; // --- NUEVO: Icono para botón --- // Añadir Filter
import { motion, AnimatePresence } from 'framer-motion';
// --- NUEVO: Importar componentes para el futuro FilterPanel ---
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// --- NUEVO: Importar el componente FilterPanel --- 
import { FilterPanel } from './FilterPanel';

// Arreglo para icono por defecto de Leaflet con Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Interfaz de Props (eliminar selectedStoreName) ---
interface ShoppingMapProps {
 onToggleFavorite: (storeId: string) => void; 
 favoriteStoreIds: Set<string>; 
 // selectedStoreName: string | null; // <-- ELIMINAR ESTA PROP
}

// --- REINSERTAR Definiciones Completas de Iconos ---
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', // Icono rojo
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// --- NUEVO: Icono para hover ---
const hoveredIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
// --- Fin Definiciones Iconos ---

export function ShoppingMap({ onToggleFavorite, favoriteStoreIds }: ShoppingMapProps) { // Quitar selectedStoreName
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<Map | null>(null); // Ref para la instancia del mapa
  const [locationInput, setLocationInput] = useState(''); // Nuevo estado
  // --- NUEVO: Estado para visibilidad del panel ---
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // --- NUEVO: Estado para visibilidad del panel de filtros ---
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); 
  // --- NUEVO: Estado para tienda seleccionada ---
  const [selectedStore, setSelectedStore] = useState<Store | null>(null); 
  // --- NUEVO: Estado para filtros seleccionados ---
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  // --- NUEVO: Estado para tienda en hover ---
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);

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

  const fetchNearbyStores = useCallback(async (lat: number, lng: number) => {
     try {
        setIsLoading(true); 
        setError(null);     
        const stores = await preciosClarosService.getStoresNearby(lat, lng);
        setNearbyStores(stores);
        
        if (stores.length === 0) {
           toast.info("No se encontraron tiendas cercanas para esta ubicación.");
        } else {
           toast.success(`${stores.length} tiendas encontradas.`);
        }
      } catch (err) {
        console.error("Error fetching nearby stores:", err);
        setError("Error al buscar tiendas cercanas.");
        setNearbyStores([]); 
      } finally {
        setIsLoading(false); 
      }
  }, []); 

  // --- MODIFICADO: Función para geocodificar con Nominatim ---
  const geocodeAddress = useCallback(async (address: string) => {
    if (!address.trim()) return;
    setIsLoading(true);
    setError(null);
    setNearbyStores([]); // Limpiar tiendas anteriores al buscar nueva dirección

    const query = encodeURIComponent(address.trim());
    // Añadir ?countrycodes=ar para priorizar resultados en Argentina
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=ar&limit=1`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error de red al buscar ubicación: ${response.statusText}`);
      }
      const data = await response.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        const coords = {
          lat: parseFloat(firstResult.lat),
          lng: parseFloat(firstResult.lon), // Nominatim usa 'lon'
        };
        setUserLocation(coords); // Actualizar ubicación del usuario (o centro del mapa)
        
        // Centrar mapa en la nueva ubicación
        if (mapRef.current) {
            mapRef.current.flyTo([coords.lat, coords.lng], 14); // Zoom 14, por ejemplo
        }
        
        toast.success(`Ubicación encontrada para "${address}". Buscando tiendas...`);
        await fetchNearbyStores(coords.lat, coords.lng); // Buscar tiendas para las nuevas coordenadas
      } else {
        toast.error(`No se encontró una ubicación para "${address}".`);
        setError(`No se encontró una ubicación para "${address}".`); 
        setIsLoading(false); 
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error("Error al buscar la ubicación.");
       setError("Error al buscar la ubicación."); 
      setIsLoading(false); 
    }
  }, [fetchNearbyStores]); 

  // --- Función handleLocationSearch (requiere estado e input en JSX) ---
   const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) { 
      geocodeAddress(locationInput.trim());
    }
  };

  // Funciones de control del mapa
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocateUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15); // Zoom 15 al localizar
    }
  };
  const handleFilterToggle = () => {
       console.log("Toggle Filters clicked");
       // --- NUEVO: Alternar estado ---
       setIsFilterPanelOpen(prev => !prev); 
       // --- NUEVO: Asegurarse que el panel de lista se cierre al abrir filtros ---
       if (!isFilterPanelOpen) { 
           setIsPanelOpen(false);
       }
       // TODO: Implementar lógica real de filtros más adelante
  };

  // --- MODIFICADO: Handler para selección desde el panel ---
  const handleStoreSelectFromPanel = useCallback((store: Store) => {
    if (mapRef.current) {
        mapRef.current.flyTo([store.lat, store.lng], 15); 
    }
    // --- NUEVO: Actualizar estado de selección ---
    setSelectedStore(store); 
    // Opcional: cerrar panel
    // setIsPanelOpen(false); 
  }, []); 

  // --- NUEVO: Función para actualizar cadenas seleccionadas ---
  const handleSelectedChainsChange = (newSelectedChains: Set<string>) => {
    setSelectedChains(newSelectedChains);
  };

  // --- NUEVO: Mover cálculos de useMemo ANTES de los returns condicionales ---
  const uniqueChains = React.useMemo(() => {
   const chains = new Set<string>();
   nearbyStores.forEach(store => {
     if (store.sucursalNombre) { // Asegurarse que el nombre exista
       chains.add(store.sucursalNombre);
     }
   });
   return Array.from(chains).sort(); // Convertir a array y ordenar alfabéticamente
 }, [nearbyStores]);

 const filteredStores = React.useMemo(() => {
   if (selectedChains.size === 0) {
     return nearbyStores; // Sin filtro, mostrar todas
   }
   return nearbyStores.filter(store =>
     store.sucursalNombre && selectedChains.has(store.sucursalNombre)
   );
 }, [nearbyStores, selectedChains]);

  // --- NUEVO: Handlers para hover ---
  const handleStoreHoverStart = (storeId: string) => {
    setHoveredStoreId(storeId);
  };

  const handleStoreHoverEnd = () => {
    setHoveredStoreId(null);
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
    // --- MODIFICADO: Quitar flex y gap, el mapa ocupará todo, los paneles son absolutos ---
    <div className="h-full w-full relative"> 
        {/* --- MODIFICADO: Panel Lateral ahora absoluto sobre el mapa --- */}
        <AnimatePresence>
            {isPanelOpen && (
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    // --- Añadido: absolute, top, left --- 
                    // --- NUEVO: Añadir overflow-hidden --- 
                    className="absolute top-0 left-0 w-1/3 lg:w-1/4 h-full bg-background border-r shadow-lg z-20 overflow-hidden" 
                 >
                    <StoreListPanel
                      stores={filteredStores}
                      favoriteStoreIds={favoriteStoreIds}
                      onToggleFavorite={onToggleFavorite}
                      onStoreSelect={handleStoreSelectFromPanel} 
                      isLoading={isLoading} 
                      selectedStoreId={selectedStore?.id ?? null} 
                      hoveredStoreId={hoveredStoreId}
                      onStoreHoverStart={handleStoreHoverStart}
                      onStoreHoverEnd={handleStoreHoverEnd}
                    />
                 </motion.div>
            )}
        </AnimatePresence>

        {/* --- MODIFICADO: Mapa ocupa todo el contenedor padre --- */}
        <div className="w-full h-full"> { /* Quitar flex-grow y relative, ya está en el padre */ }
            {/* Botón para mostrar/ocultar panel de lista (sigue absoluto sobre mapa) */}
            <Button 
                variant="outline"
                size="icon" 
                onClick={() => { 
                    setIsPanelOpen(prev => !prev);
                    if (!isPanelOpen) { 
                        setIsFilterPanelOpen(false);
                    }
                }}
                // Ajustar z-index para que esté sobre el mapa pero potencialmente debajo del panel si se abre
                className="absolute top-14 left-2 z-30 bg-background/80 backdrop-blur-sm" 
                title={isPanelOpen ? "Ocultar lista" : "Mostrar lista"}
              >
                <List className="h-4 w-4" />
              </Button>

            {/* Controles del mapa (ya posicionados absolute por MapControls) */}
            <MapControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onLocateUser={handleLocateUser}
              onFilterToggle={handleFilterToggle}
            />

            {/* Input de búsqueda (sigue absoluto sobre mapa) */}
            <form onSubmit={handleLocationSearch} className="absolute top-2 left-2 z-10 flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow">
                <Input 
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Buscar dirección o lugar..."
                    className="w-64"
                />
                <Button type="submit" size="icon" variant="outline">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </Button>
            </form>

            {/* Contenedor del Mapa Leaflet */}
            <MapContainer
              center={mapCenter} 
              zoom={initialZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
              zoomControl={false}
              // Asegurar que el mapa esté detrás de los paneles/controles
              className="h-full w-full rounded-lg z-0" 
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Marcador para ubicación del usuario */}
              {userLocation && (
                 <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>Tu ubicación actual</Popup>
                 </Marker>
              )}
              {/* Marcadores para tiendas cercanas */}
              {filteredStores.map((store) => {
                // --- NUEVO: Lógica para decidir icono (incluyendo hover) ---
                let iconToUse = defaultIcon;
                if (store.id === selectedStore?.id) {
                  iconToUse = selectedIcon;
                } else if (store.id === hoveredStoreId) {
                  iconToUse = hoveredIcon;
                }
 
                return (
                  <StoreMarker
                    key={store.id}
                    store={store}
                    icon={iconToUse} // <-- Usar icono decidido
                    isFavorite={favoriteStoreIds.has(store.id)}
                    onToggleFavorite={onToggleFavorite}
                    onClick={() => setSelectedStore(store)}
                    // --- NUEVO: Añadir handlers de hover al marcador ---
                    onMouseOver={() => handleStoreHoverStart(store.id)}
                    onMouseOut={handleStoreHoverEnd}
                  />
                );
              })}
            </MapContainer>
        </div>

        {/* Panel de Filtros (ya absoluto a la derecha) */}
        <AnimatePresence>
          {isFilterPanelOpen && (
              <motion.div
                initial={{ x: '100%' }} 
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute top-0 right-0 h-full w-72 z-20" 
              >
                <FilterPanel 
                  uniqueChains={uniqueChains}
                  selectedChains={selectedChains}
                  onSelectedChainsChange={handleSelectedChainsChange}
                  onClose={handleFilterToggle}
                />
              </motion.div>
          )}
        </AnimatePresence>

    </div>
  );
}