import React, { useCallback } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { Category, PantryItem } from '../types';
import { PantryGrid } from './PantryGrid';
import PantryList from '../PantryList'; // Importación por defecto
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

interface GroupedPantryData {
  category: Category | null;
  items: ProcessedPantryItem[];
}

interface ProcessedPantryItem extends PantryItem {
  _consolidatedCount?: number;
  _originalItems?: PantryItem[];
}

interface PantryItemsViewProps {
  viewMode: 'list' | 'grid';
  processedItems: GroupedPantryData[];
  isLoading: boolean;
  error: string | null;
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
  onEditItem: (item: PantryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
}

const PantryItemsView: React.FC<PantryItemsViewProps> = ({
  viewMode,
  processedItems,
  isLoading,
  error,
  isSelectionMode,
  selectedItems,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onToggleFavorite,
}) => {
  const handleToggleFavorite = useCallback((itemId: string) => {
    console.log('[PantryItemsView] handleToggleFavorite called:', {
      itemId,
      onToggleFavoriteType: typeof onToggleFavorite
    });

    if (typeof onToggleFavorite !== 'function') {
      console.error('[PantryItemsView] onToggleFavorite is not a function!');
      return;
    }

    try {
      onToggleFavorite(itemId);
    } catch (error) {
      console.error('[PantryItemsView] Error in handleToggleFavorite:', error);
    }
  }, [onToggleFavorite]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const totalItems = processedItems.reduce((sum, group) => sum + group.items.length, 0);

  if (totalItems === 0) {
    return (
      <EmptyState
        title="Tu despensa está vacía"
        description="Comienza añadiendo productos a tu despensa"
        icon="Inbox"
      />
    );
  }

  const defaultOpenValues = processedItems
    .filter(group => group.items.length > 0)
    .map((group, index) => group.category?.id || `uncategorized-${index}`);

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenValues}
      className="w-full space-y-1"
    >
      {processedItems.map((group, index) => {
        const categoryId = group.category?.id || `uncategorized-${index}`;
        if (group.items.length === 0) return null;

        return (
          <AccordionItem value={categoryId} key={categoryId} className="border rounded-md overflow-hidden"> {/* Cambiado border-b-0 a border */}
            <AccordionTrigger
              className={cn(
                "flex justify-between items-center w-full px-4 py-3 text-left font-medium", // Aumentar padding vertical
                "hover:bg-muted/50 transition-colors",
                "bg-primary/20" // Usar color primario con baja opacidad para contraste
              )}
            >
              <span>{group.category?.name || 'Sin Categoría'} ({group.items.length})</span>
            </AccordionTrigger>
            {/* Ajustar AccordionContent: quitar animación de altura y padding */}
            <AccordionContent className="overflow-hidden px-0 pt-0 pb-0"> {/* Eliminado padding bottom */}
              {/* Contenedor interno con padding */}
              <div className="px-1 pt-2">
                {viewMode === 'grid' ? (
                  <PantryGrid
                    items={group.items}
                    isSelectionMode={isSelectionMode}
                    selectedItems={selectedItems}
                    onSelectItem={onSelectItem}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ) : (
                  <PantryList
                    items={group.items}
                    isSelectionMode={isSelectionMode}
                    selectedItems={selectedItems}
                    onSelectItem={onSelectItem}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default PantryItemsView;