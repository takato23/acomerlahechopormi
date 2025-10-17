import React from 'react';
import { PantryItem } from './types';
import { PantryListItemRow } from './components/PantryListItemRow';
import { cn } from '@/lib/utils';

interface PantryListProps {
  items: PantryItem[];
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void; // Añadir prop
}

const PantryList: React.FC<PantryListProps> = ({
  items,
  onEdit,
  onDelete,
  isSelectionMode,
  selectedItems,
  onSelectItem,
  onToggleFavorite // Recibir prop
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground" id="pantry-empty-state">
        Tu despensa está vacía. ¡Añade algunos items!
      </div>
    );
  }

  return (
    <div className="rounded-md border"> {/* Eliminada altura fija y overflow */}
      <div className="w-full">
        {/* Header */}
        <div
          className={cn(
            "hidden sm:grid bg-muted/50 border-b sticky top-0 z-10 text-sm font-medium",
            isSelectionMode
              ? "sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto]"
              : "sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
          )}
        >
          {isSelectionMode && <div className="py-3 pl-3" />}
          <div className="py-3 px-3 text-left">Nombre</div>
          <div className="py-3 text-center">Stock</div>
          <div className="py-3 text-center">Categoría</div>
          <div className="py-3 text-center">Caducidad</div>
          <div className="py-3 pr-3 text-right">Acciones</div>
        </div>
        {/* Rows */}
        <div className="w-full">
          {items.map((item) => (
            <PantryListItemRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              isSelectionMode={isSelectionMode}
              isSelected={selectedItems.has(item.id)}
              onSelectItem={onSelectItem}
              onToggleFavorite={onToggleFavorite} // Pasar prop
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PantryList;
