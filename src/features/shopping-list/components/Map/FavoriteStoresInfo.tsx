import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye } from 'lucide-react';

interface FavoriteStoresInfoProps {
  count: number;
  onShowMapClick: () => void;
}

export function FavoriteStoresInfo({ count, onShowMapClick }: FavoriteStoresInfoProps) {
  return (
    <Card className="h-full flex flex-col items-center justify-center text-center shadow-lg p-4">
       <CardHeader className="pb-2">
           <CardTitle className="text-xl font-bold flex items-center gap-2">
             <MapPin className="h-5 w-5 text-primary" /> Mapa de Tiendas
           </CardTitle>
        </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Tienes {count} tienda{count !== 1 ? 's' : ''} favorita{count !== 1 ? 's' : ''} seleccionada{count !== 1 ? 's' : ''}. 
          La búsqueda de precios se enfocará en ellas.
        </p>
        <Button variant="outline" size="sm" onClick={onShowMapClick}>
          <Eye className="mr-2 h-4 w-4" /> Ver/Editar Mapa
        </Button>
      </CardContent>
    </Card>
  );
}