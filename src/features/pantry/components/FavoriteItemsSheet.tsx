import React, { useMemo, useCallback } from 'react'; // Añadir useCallback
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Star } from 'lucide-react';
import { usePantryStore } from '@/stores/pantryStore';
import { PantryItemCard } from './PantryItemCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PantryItem } from '../types'; // Importar tipo real

interface FavoriteItemsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditItem: (item: PantryItem) => void; // Usar tipo PantryItem
  onDeleteItem: (itemId: string) => void;
}

export function FavoriteItemsSheet({
  isOpen,
  onOpenChange,
  onEditItem,
  onDeleteItem,
}: FavoriteItemsSheetProps) {
  // Seleccionar estado y acciones por separado
  const allPantryItems = usePantryStore(state => state.items);
  const isLoading = usePantryStore(state => state.isLoading);
  const toggleFavoriteAction = usePantryStore(state => state.toggleFavorite); // Renombrar para claridad

  // Filtrar solo los favoritos (esto ya estaba bien con useMemo)
  const favoriteItems = useMemo(() => {
    return allPantryItems.filter(item => item.is_favorite);
  }, [allPantryItems]);

  // Memoizar el handler que llama a la acción del store
  const handleToggleFavorite = useCallback((itemId: string) => {
    // Ya no necesitamos pasar currentState, la acción del store lo maneja
    console.log(`[FavoriteItemsSheet] Calling toggleFavorite action for ${itemId}`);
    toggleFavoriteAction(itemId);
  }, [toggleFavoriteAction]); // Depender de la acción del store

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
            Mis Favoritos
          </SheetTitle>
          <SheetDescription>
            Acceso rápido a tus ítems más usados de la despensa.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner size="lg" />
            </div>
          ) : favoriteItems.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <EmptyState
                title="No tienes favoritos"
                description="Marca ítems con la estrella ⭐ en tu despensa para verlos aquí."
                icon="Star"
              />
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 gap-3 py-4">
                {favoriteItems.map((item) => (
                  <PantryItemCard
                    key={item.id}
                    item={item}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    // Pasar el handler memoizado. Ajustaremos PantryItemCard si es necesario
                    // para que no espere 'currentState' si la acción del store no lo necesita.
                    onToggleFavorite={handleToggleFavorite}
                    isSelectionMode={false}
                    isSelected={false}
                    onSelectItem={() => {}}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}