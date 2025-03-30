import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importar Card
import { MapPin } from 'lucide-react'; // Importar icono

interface TabletLayoutProps {
  listAndSearch: React.ReactNode;
  map: React.ReactNode;
}

export function TabletLayout({ listAndSearch, map }: TabletLayoutProps) {
  // Layout de 2 columnas
  return (
    <div className="grid grid-cols-[minmax(400px,_60%)_minmax(300px,_40%)] gap-4 h-full p-4">
        <div className="h-full overflow-hidden">{listAndSearch}</div>
        {/* Ajustar contenedor del mapa */}
        <div className="flex flex-col"> {/* Contenedor para limitar altura */}
            <Card className="aspect-square flex flex-col shadow-lg overflow-hidden"> {/* aspect-square y overflow */}
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Mapa de Tiendas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0"> {/* Quitar padding */}
          {map}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}