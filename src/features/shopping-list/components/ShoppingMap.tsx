import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Store, preciosClarosService } from '../services/preciosClarosService'; // Ajustada ruta de importación
import { ArrowLeft, CheckCircle, X, Heart } from 'lucide-react';

interface StoresMapProps {
  onStoreSelect: (stores: Store[]) => void;
  onClose: () => void;
  onToggleFavorite?: (store: Store) => void;
  favoriteStores?: Store[];
}

const StoresMap: React.FC<StoresMapProps> = ({ 
  onStoreSelect, 
  onClose,
  onToggleFavorite,
  favoriteStores = []
}) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Check if a store is in the favorites list
  const isStoreFavorite = (store: Store) => {
    return favoriteStores.some(s => s.id === store.id);
  };

  // Function to get the user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalización no soportada", {
        description: "Tu navegador no soporta geolocalización"
      });
      return;
    }
    
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbyStores(latitude, longitude);
      },
      (error) => {
        console.error("Error getting user location:", error);
        toast.error("Error de localización", {
          description: "No se pudo obtener tu ubicación. Por favor ingresa una dirección."
        });
        setLoading(false);
      }
    );
  };
  
  // Function to fetch nearby stores based on location
  const fetchNearbyStores = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      // Asumiendo que preciosClarosService está en la nueva ubicación
      const nearbyStores = await preciosClarosService.getStoresNearby(lat, lng, 15); 
      setStores(nearbyStores);
      
      // Add any favorited stores that might not be in the nearby list
      const favoriteIds = new Set(favoriteStores.map(s => s.id));
      const storeIds = new Set(nearbyStores.map((s: Store) => s.id)); // Añadido tipo explícito
      
      const missingFavorites = favoriteStores.filter(s => !storeIds.has(s.id));
      if (missingFavorites.length > 0) {
        setStores([...nearbyStores, ...missingFavorites]);
      }
      
      toast.success("Tiendas encontradas", {
        description: `Se encontraron ${nearbyStores.length} tiendas cercanas`
      });
    } catch (error) {
      console.error("Error fetching nearby stores:", error);
      toast.error("Error", {
        description: "No se pudieron obtener las tiendas cercanas"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to geocode an address and get lat/lng
  const geocodeAddress = async (address: string) => {
    try {
      setLoading(true);
      // Aquí normalmente usaríamos una API de geocodificación como Google Maps
      // Para simular, usaremos coordenadas fijas para algunas ciudades comunes
      const locations: Record<string, { lat: number; lng: number }> = {
        'buenos aires': { lat: -34.6037, lng: -58.3816 },
        'córdoba': { lat: -31.4201, lng: -64.1888 },
        'rosario': { lat: -32.9442, lng: -60.6505 },
        'mendoza': { lat: -32.8895, lng: -68.8458 },
        'san miguel de tucumán': { lat: -26.8083, lng: -65.2176 },
        'la plata': { lat: -34.9215, lng: -57.9545 },
      };
      
      const normalizedAddress = address.toLowerCase();
      let coords: { lat: number; lng: number } | null = null;
      
      // Check if the address matches any known location
      for (const [city, coordinates] of Object.entries(locations)) {
        if (normalizedAddress.includes(city)) {
          coords = coordinates;
          break;
        }
      }
      
      // If no match, use a default (Buenos Aires)
      if (!coords) {
        coords = { lat: -34.6037, lng: -58.3816 };
        toast.info("Ubicación no reconocida, usando Buenos Aires como referencia");
      }
      
      setUserLocation(coords);
      fetchNearbyStores(coords.lat, coords.lng);
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error("Error", {
        description: "No se pudo encontrar la ubicación"
      });
      setLoading(false);
    }
  };
  
  // Function to handle location search
  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      geocodeAddress(locationInput.trim());
    }
  };
  
  // Function to toggle store selection
  const toggleStoreSelection = (store: Store) => {
    setSelectedStores(prev => {
      const isAlreadySelected = prev.some(s => s.id === store.id);
      
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== store.id);
      } else {
        return [...prev, store];
      }
    });
  };
  
  // Function to handle confirm button
  const handleConfirm = () => {
    if (selectedStores.length === 0) {
      toast.error("Selección vacía", {
        description: "Por favor selecciona al menos una tienda"
      });
      return;
    }
    
    onStoreSelect(selectedStores);
  };
  
  // Load stores on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  // Group stores by chain
  const storesByChain: Record<string, Store[]> = {};
  
  stores.forEach(store => {
    const chainName = store.banderaDescripcion;
    if (!storesByChain[chainName]) {
      storesByChain[chainName] = [];
    }
    storesByChain[chainName].push(store);
  });
  
  // Sort store chains alphabetically
  const sortedChains = Object.keys(storesByChain).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col p-4 sm:p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Supermercados Cercanos</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
      
      <div className="mb-4">
        <form onSubmit={handleLocationSearch} className="flex gap-2 mb-2">
          <Input
            placeholder="Ingresa una dirección o ciudad"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!locationInput.trim() || loading}
            variant="outline"
          >
            Buscar
          </Button>
        </form>
        
        <Button 
          onClick={getCurrentLocation} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          Usar mi ubicación actual
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground">
          {stores.length} tiendas encontradas
        </p>
        
        <p className="text-sm font-medium">
          {selectedStores.length} seleccionadas
        </p>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Buscando tiendas cercanas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Favorited stores section */}
            {favoriteStores.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Heart size={16} className="mr-2 text-rose-500" />
                  Favoritos
                </h3>
                <div className="space-y-2">
                  {favoriteStores.map(store => (
                    <motion.div
                      key={`fav-${store.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-3 rounded-lg border flex justify-between items-center cursor-pointer
                        ${selectedStores.some(s => s.id === store.id) 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-card hover:bg-accent/50 border-border'
                        }
                      `}
                      onClick={() => toggleStoreSelection(store)}
                    >
                      <div>
                        <div className="font-medium">{store.banderaDescripcion}</div>
                        <div className="text-xs text-muted-foreground">{store.direccion}</div>
                        <div className="text-xs text-muted-foreground">
                          {store.localidad}, {store.provincia}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedStores.some(s => s.id === store.id) && (
                          <CheckCircle size={16} className="text-primary" />
                        )}
                        {onToggleFavorite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(store);
                            }}
                          >
                            <Heart size={16} className={`${isStoreFavorite(store) ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {sortedChains.map(chainName => (
              <div key={chainName} className="mb-4">
                <h3 className="text-sm font-medium mb-2">{chainName}</h3>
                <div className="space-y-2">
                  {storesByChain[chainName].map(store => (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-3 rounded-lg border flex justify-between items-center cursor-pointer
                        ${selectedStores.some(s => s.id === store.id) 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-card hover:bg-accent/50 border-border'
                        }
                      `}
                      onClick={() => toggleStoreSelection(store)}
                    >
                      <div>
                        <div className="font-medium">{store.sucursalNombre || store.sucursalTipo}</div>
                        <div className="text-xs text-muted-foreground">{store.direccion}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {store.distanciaDescripcion}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedStores.some(s => s.id === store.id) && (
                          <CheckCircle size={16} className="text-primary" />
                        )}
                        {onToggleFavorite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(store);
                            }}
                          >
                            <Heart size={16} className={`${isStoreFavorite(store) ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            
            {stores.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron tiendas cercanas</p>
                <p className="text-sm text-muted-foreground mt-2">Intenta con otra ubicación</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-between">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft size={16} className="mr-2" />
          Cancelar
        </Button>
        
        <Button 
          onClick={handleConfirm}
          disabled={selectedStores.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Confirmar selección ({selectedStores.length})
        </Button>
      </div>
    </motion.div>
  );
};

export default StoresMap; // Cambiado a default export si es necesario