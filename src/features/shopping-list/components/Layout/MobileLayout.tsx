import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';

interface MobileLayoutProps {
  listAndSearch: React.ReactNode;
  map: React.ReactNode;
}

export function MobileLayout({ listAndSearch, map }: MobileLayoutProps) {
  // TODO: Implementar layout de 1 columna + Bottom Sheet para el mapa
  return (
    <div className="h-full flex flex-col">
      {/* Contenido principal (Lista + Búsqueda) */}
      <div className="flex-grow overflow-y-auto">
        {listAndSearch}
      </div>
      {/* Botón y Panel Deslizable para el Mapa */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="fixed bottom-4 right-4 z-10 shadow-lg rounded-full p-3 h-auto">
            <MapPin className="h-5 w-5" />
            <span className="sr-only">Ver Mapa</span> {/* Accesibilidad */}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] p-0 flex flex-col"> {/* Ajustar altura y padding */}
           {/* Añadir un pequeño encabezado o handle si se desea */}
          <div className="flex-grow"> {/* Asegurar que el mapa ocupe el espacio */}
            {map}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}