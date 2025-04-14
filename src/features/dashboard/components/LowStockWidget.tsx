import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, CheckCircle2, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { useShoppingListStore } from '../../../stores/shoppingListStore';
import { toast } from 'sonner';

type PantryItem = any;

interface LowStockWidgetProps { 
  lowStockItems: PantryItem[];
  isLoading: boolean;
  error: string | null;
}

export function LowStockWidget({ lowStockItems, isLoading, error }: LowStockWidgetProps) { 
  const itemCount = lowStockItems.length;
  const addItemToShoppingList = useShoppingListStore(state => state.addItem);

  const handleAddItemToList = async (item: PantryItem) => {
    if (!item) return;
    
    const itemDataForList = {
      ingredient_name: item.name || 'Nombre desconocido',
      quantity: null,
      unit: null,
    };

    try {
      const newItem = await addItemToShoppingList(itemDataForList);
      if (newItem) {
        toast.success(`"${itemDataForList.ingredient_name}" añadido a la lista.`);
      } else {
        toast.error(`No se pudo añadir "${itemDataForList.ingredient_name}" a la lista.`);
      }
    } catch (err) {
      console.error("Error al llamar a addItemToShoppingList:", err);
      toast.error("Error inesperado al añadir a la lista.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" /> 
          Bajo Stock
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-sm" asChild>
          <Link to="/app/pantry">
            Ver Despensa <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
           <div className="space-y-2 pt-2">
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-4/5" />
             <Skeleton className="h-4 w-full" />
           </div>
        ) : error ? (
           <div className="text-sm text-destructive text-center py-4">
             {typeof error === 'string' ? error : 'Error al cargar stock'}
           </div>
        ) : itemCount > 0 ? (
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-3">
              Tienes <span className="font-semibold text-foreground">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'} con stock bajo (≤1).
            </p>
            <ul className="space-y-2"> 
              {lowStockItems.slice(0, 4).map((item) => (
                <li 
                  key={item.id} 
                  className="text-sm flex items-center justify-between gap-2 p-1 rounded-md hover:bg-muted"
                > 
                  <div className="flex items-center gap-2 truncate"> 
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0"/> 
                    <span className="text-foreground truncate"> 
                      {item.name || 'Item sin nombre'}
                    </span>
                  </div>
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary flex-shrink-0"
                    onClick={() => handleAddItemToList(item)}
                    aria-label={`Añadir ${item.name || 'item'} a la lista`}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            {itemCount > 4 && (
              <div className="mt-3 text-center">
                <Link to="/app/pantry?filter=lowstock" className="text-xs text-primary hover:underline">
                  Ver los {itemCount - 4} restantes...
                </Link>
              </div>
            )}
          </div>
        ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="¡Despensa surtida!"
              description="No hay ítems con stock bajo."
              className="py-6"
            />
        )}
      </CardContent>
    </Card>
  );
}