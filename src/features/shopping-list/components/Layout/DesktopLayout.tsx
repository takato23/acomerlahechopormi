import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importar Card
import { MapPin } from 'lucide-react'; // Importar icono

interface DesktopLayoutProps {
  searchPanel: React.ReactNode;
  shoppingList: React.ReactNode;
  map: React.ReactNode;
}

export function DesktopLayout({ searchPanel, shoppingList, map }: DesktopLayoutProps) {
  // Layout de 3 columnas
  return (
    <div className="grid grid-cols-[minmax(300px,_25%)_minmax(400px,_40%)_minmax(300px,_35%)] gap-4 h-full p-4"> {/* Añadir padding y minmax */}
      <div className="h-full overflow-hidden">{searchPanel}</div>
      <div className="h-full overflow-hidden">{shoppingList}</div>
      {/* Ajustar contenedor del mapa */}
      <div className="flex flex-col"> {/* Contenedor para limitar altura */}
          <Card className="aspect-square flex flex-col shadow-lg overflow-hidden"> {/* aspect-square y overflow */}
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Mapa de Tiendas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0"> {/* Quitar padding para que el mapa ocupe todo */}
          {map}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}