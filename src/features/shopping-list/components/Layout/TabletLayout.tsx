import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importar Card
import { MapPin } from 'lucide-react'; // Importar icono

interface TabletLayoutProps {
  shoppingList: React.ReactNode;
  map: React.ReactNode;
}

export function TabletLayout({ shoppingList, map }: TabletLayoutProps) {
  // Layout de 2 columnas
  return (
    <div className="grid grid-cols-2 gap-4 h-full p-4">
      <div className="h-full overflow-hidden">
        {shoppingList}
      </div>
      <div className="flex flex-col">
        <Card className="aspect-square flex flex-col shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Mapa de Tiendas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            {map}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}