import React, { useState, useMemo } from 'react';
import { Store } from '../../services/preciosClarosService';
import { Button } from '@/components/ui/button';
import { Heart, ArrowDownUp, MapPin, Building } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface StoreListPanelProps {
  stores: Store[];
  favoriteStoreIds: Set<string>;
  onToggleFavorite: (storeId: string) => void;
  onStoreSelect: (store: Store) => void;
  isLoading: boolean;
  selectedStoreId: string | null;
  hoveredStoreId?: string | null;
  onStoreHoverStart?: (storeId: string) => void;
  onStoreHoverEnd?: () => void;
}

type SortCriteria = 'distancia' | 'nombre' | 'cadena';

export function StoreListPanel({
  stores,
  favoriteStoreIds,
  onToggleFavorite,
  onStoreSelect,
  isLoading,
  selectedStoreId,
  hoveredStoreId,
  onStoreHoverStart,
  onStoreHoverEnd,
}: StoreListPanelProps) {

  const [sortBy, setSortBy] = useState<SortCriteria>('distancia');

  const sortedStores = useMemo(() => {
    const storesToSort = [...stores];
    storesToSort.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          const nameA = a.sucursalNombre || a.banderaDescripcion;
          const nameB = b.sucursalNombre || b.banderaDescripcion;
          if (nameA.localeCompare(nameB) !== 0) {
             return nameA.localeCompare(nameB);
          }
          return a.distanciaNumero - b.distanciaNumero;
        case 'cadena':
           if (a.banderaDescripcion.localeCompare(b.banderaDescripcion) !== 0) {
              return a.banderaDescripcion.localeCompare(b.banderaDescripcion);
          }
          return a.distanciaNumero - b.distanciaNumero;
        case 'distancia':
        default:
          return a.distanciaNumero - b.distanciaNumero;
      }
    });
    return storesToSort;
  }, [stores, sortBy]);

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Cargando tiendas...</div>;
  }

  if (stores.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No hay tiendas en esta área.</div>;
  }

  return (
    <div className="border rounded-lg bg-background h-full flex flex-col w-full">
      <div className="p-3 border-b flex justify-between items-center flex-shrink-0 overflow-hidden gap-2">
        <h3 className="font-semibold text-sm">Tiendas Cercanas ({sortedStores.length})</h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto px-3 py-1.5">
              <ArrowDownUp className="h-4 w-4 mr-1.5" />
              Ordenar: {sortBy === 'distancia' ? 'Distancia' : sortBy === 'nombre' ? 'Nombre' : 'Cadena'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
                 console.log("Setting sortBy to 'distancia'");
                 setSortBy('distancia');
            }}>
              <MapPin className="h-3 w-3 mr-2" /> Distancia
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('nombre')}>
              <Building className="h-3 w-3 mr-2" /> Nombre Sucursal
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => setSortBy('cadena')}>
              <Building className="h-3 w-3 mr-2" /> Cadena
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-grow">
        <div className="divide-y">
          {sortedStores.map((store) => {
            const isSelected = store.id === selectedStoreId;
            return (
              <div
                key={store.id}
                className={`p-3 hover:bg-accent cursor-pointer flex justify-between items-start gap-2 
                           ${isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''}
                           ${store.id === hoveredStoreId && !isSelected ? 'bg-accent/60' : ''}`}
                onClick={() => onStoreSelect(store)}
                onMouseEnter={() => onStoreHoverStart?.(store.id)}
                onMouseLeave={() => onStoreHoverEnd?.()}
              >
                <div className="flex-grow">
                  <p className="font-medium text-sm leading-tight">{store.sucursalNombre}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{store.banderaDescripcion}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-1">{store.direccion}, {store.localidad}</p>
                  <p className="text-xs font-semibold text-primary mt-1">{store.distanciaDescripcion}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(store.id);
                  }}
                  aria-label={favoriteStoreIds.has(store.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                  <Heart
                    size={16}
                    className={favoriteStoreIds.has(store.id) ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}
                  />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
} 