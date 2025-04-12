import React from 'react';
import { usePlanningStore, type ShoppingListItem } from '@/stores/planningStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function ShoppingListDisplay() {
  const shoppingList = usePlanningStore((state) => state.shoppingList);
  const isCalculating = usePlanningStore((state) => state.isCalculatingShoppingList);

  if (isCalculating) {
    // Podríamos mostrar un spinner aquí si quisiéramos
    return null; // O un mensaje de carga
  }

  if (shoppingList.length === 0) {
    // No mostrar nada si la lista está vacía (o si aún no se ha calculado)
    return null;
  }

  // Función auxiliar para formatear cantidad y unidad
  const formatQuantity = (item: ShoppingListItem) => {
    if (item.missingQuantity === null) return '(Cantidad no especificada)';
    let qtyStr = String(item.missingQuantity);
    // Podríamos añadir lógica para redondear decimales si es necesario
    // if (Number.isFinite(item.missingQuantity) && !Number.isInteger(item.missingQuantity)) {
    //   qtyStr = item.missingQuantity.toFixed(1);
    // }
    return `${qtyStr}${item.missingUnit ? ' ' + item.missingUnit : ''}`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Lista de Compras Sugerida</CardTitle>
      </CardHeader>
      <CardContent>
        {shoppingList.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4"> {/* Ajustar altura según necesidad */}
            <ul className="space-y-3">
              {shoppingList.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between items-start border-b pb-2">
                  <div className="flex-1 mr-4">
                    <span className="font-medium capitalize">{item.name}</span>
                    {item.sourceRecipes && item.sourceRecipes.length > 0 && (
                       <p className="text-xs text-muted-foreground mt-1">
                         Necesario para: {item.sourceRecipes.join(', ')}
                       </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    Comprar: {formatQuantity(item)}
                  </Badge>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Genera la lista de compras para ver los ingredientes necesarios.
          </p>
        )}
      </CardContent>
    </Card>
  );
}