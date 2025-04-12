import React from 'react';
// Importar componentes específicos de la librería de mapas si es necesario
import { Marker, Popup } from 'react-leaflet';
import { Store } from '../../services/preciosClarosService'; 
import L from 'leaflet'; // Necesario para tipos de icono
import { Button } from '@/components/ui/button'; // Para el botón de favorito

interface StoreMarkerProps {
  store: Store;
  icon: L.Icon;
  isFavorite: boolean;
  onToggleFavorite: (storeId: string) => void;
  onClick: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}

export function StoreMarker({ store, icon, isFavorite, onToggleFavorite, onClick, onMouseOver, onMouseOut }: StoreMarkerProps) {
  // TODO: Implementar marcador personalizado
  // - Usar icono diferente si está resaltado
  // - Mostrar Popup con información al hacer click
  // - Llamar a onClick al hacer click

  return (
    <Marker 
      position={[store.lat, store.lng]} 
      icon={icon}
      eventHandlers={{ 
        click: onClick, 
        mouseover: onMouseOver, 
        mouseout: onMouseOut 
      }}
    >
      <Popup>
         <div>
           <b>{store.sucursalNombre}</b> ({store.banderaDescripcion})<br />
           {store.direccion}, {store.localidad} <br/>
           <span className="text-xs text-muted-foreground">{store.distanciaDescripcion}</span>
           <Button
             size="sm"
             variant={isFavorite ? "secondary" : "outline"}
             className="mt-2 w-full h-auto py-1 px-2 text-xs"
             onClick={(e) => { e.stopPropagation(); onToggleFavorite(store.id); }}
           >
             {isFavorite ? '★ Favorito' : '☆ Añadir Favorito'}
           </Button>
         </div>
      </Popup>
    </Marker>
  );
}