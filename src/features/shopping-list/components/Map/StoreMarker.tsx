import React from 'react';
// Importar componentes específicos de la librería de mapas si es necesario
// ej: import { Marker, Popup } from 'react-leaflet';

interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  // Otros campos relevantes (address, etc.)
}

interface StoreMarkerProps {
  store: Store;
  isHighlighted?: boolean;
  onClick?: (storeId: string) => void;
}

export function StoreMarker({ store, isHighlighted, onClick }: StoreMarkerProps) {
  // TODO: Implementar marcador personalizado
  // - Usar icono diferente si está resaltado
  // - Mostrar Popup con información al hacer click
  // - Llamar a onClick al hacer click

  // Placeholder simple (dependerá de la librería de mapas)
  // return (
  //   <Marker 
  //     position={[store.lat, store.lng]} 
  //     // icon={isHighlighted ? highlightedIcon : defaultIcon}
  //     eventHandlers={{ click: () => onClick?.(store.id) }}
  //   >
  //     <Popup>{store.name}</Popup>
  //   </Marker>
  // );
  
  // Retornar null si no se usa react-leaflet u otra librería que renderice aquí
  return null; 
}