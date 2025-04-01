import React from 'react';
import { PantryItem } from './types';
import { PantryItemCard } from './components/PantryItemCard';

interface PantryGridProps {
 items: PantryItem[];
 onEdit: (item: PantryItem) => void;
 onDelete: (itemId: string) => void;
 // Nuevas props para selección
 isSelectionMode: boolean;
 selectedItems: Set<string>;
 onSelectItem: (itemId: string) => void;
}

export function PantryGrid({
 items,
 onEdit,
 onDelete,
 isSelectionMode,
 selectedItems,
 onSelectItem
}: PantryGridProps) {

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground" id="pantry-empty-state">
        Tu despensa está vacía. ¡Añade algunos items!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
      {items.map((item) => (
       <PantryItemCard
         key={item.id}
         item={item}
         onEdit={onEdit}
         onDelete={onDelete}
         // Pasar props de selección
         isSelectionMode={isSelectionMode}
         isSelected={selectedItems.has(item.id)}
         onSelectItem={onSelectItem}
       />
      ))}
    </div>
  );
}