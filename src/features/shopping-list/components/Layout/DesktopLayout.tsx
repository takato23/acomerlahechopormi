import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importar Card
import { MapPin } from 'lucide-react'; // Importar icono

interface DesktopLayoutProps {
  shoppingList: React.ReactNode;
  map: React.ReactNode;
}

export function DesktopLayout({ shoppingList, map }: DesktopLayoutProps) {
  // Layout de 2 columnas: Lista Principal | Panel Contextual (Mapa inicialmente)
  return (
    <div className="grid grid-cols-[minmax(450px,_55%)_minmax(350px,_45%)] gap-4 h-full p-4"> {/* 2 columnas */}
      {/* Columna Principal: Lista de Compras (Integrará Add/Search) */}
      <div className="h-full">
        {shoppingList}
      </div>

      {/* Columna Contextual: Mapa (Buscar Precios se integrará luego) */}
      <div className="flex flex-col"> 
          <Card className="aspect-square flex flex-col shadow-lg overflow-hidden"> 
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
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