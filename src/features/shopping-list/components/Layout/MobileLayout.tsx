import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface MobileLayoutProps {
  shoppingList: React.ReactNode;
  map: React.ReactNode;
}

export function MobileLayout({ shoppingList, map }: MobileLayoutProps) {
  // Layout de 1 columna principal para móvil
  return (
    <div className="flex flex-col h-full p-2 gap-2"> {/* Padding más pequeño, flex-col */}
      {/* Contenido Principal: Lista */}
      <div className="flex-grow overflow-hidden"> {/* Permitir que crezca */}
        {shoppingList} {/* Renderizar shoppingList directamente */}
      </div>
      
      {/* Contenido Secundario: Mapa (quizás colapsable en el futuro) */}
      <div className="flex-shrink-0"> {/* Evitar que crezca demasiado */}
        <Card className="shadow-lg overflow-hidden"> 
          <CardHeader className="p-2 pb-1"> {/* Padding reducido */}
            <CardTitle className="text-base font-medium flex items-center gap-1"> {/* Tamaño reducido */}
              <MapPin className="h-4 w-4 text-primary" /> Mapa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 aspect-video"> {/* Ratio para mapa */}
            {map}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}