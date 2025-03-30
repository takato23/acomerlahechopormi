import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, LocateFixed, Filter } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateUser: () => void;
  onFilterToggle: () => void; // Para abrir/cerrar filtros de tiendas
}

export function MapControls({ onZoomIn, onZoomOut, onLocateUser, onFilterToggle }: MapControlsProps) {
  // TODO: Implementar lógica para interactuar con la instancia del mapa
  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col space-y-2">
      <Button variant="outline" size="icon" onClick={onZoomIn} title="Acercar">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onZoomOut} title="Alejar">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onLocateUser} title="Mi ubicación">
        <LocateFixed className="h-4 w-4" />
      </Button>
       <Button variant="outline" size="icon" onClick={onFilterToggle} title="Filtrar tiendas">
        <Filter className="h-4 w-4" />
      </Button>
      {/* TODO: Añadir panel/modal de filtros */}
    </div>
  );
}