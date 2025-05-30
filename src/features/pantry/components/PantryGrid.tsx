import React from 'react';
import { PantryItem } from '../types';
import { PantryItemCard } from './PantryItemCard';

interface PantryGridProps {
  items: PantryItem[];
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
  onToggleFavorite: (itemId: string, currentState: boolean) => void;
}

const PantryGrid: React.FC<PantryGridProps> = ({
  items,
  onEdit,
  onDelete,
  isSelectionMode,
  selectedItems,
  onSelectItem,
  onToggleFavorite
}) => {
  console.log('[PantryGrid] Received onToggleFavorite:', {
    type: typeof onToggleFavorite,
    isFunction: typeof onToggleFavorite === 'function'
  });

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground" id="pantry-empty-state">
        Tu despensa está vacía. ¡Añade algunos items!
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1"
      data-testid="pantry-grid"
    >
      {items.map((item) => (
        <PantryItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelectionMode={isSelectionMode}
          isSelected={selectedItems.has(item.id)}
          onSelectItem={onSelectItem}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

// Asegurarnos de que la exportación por defecto sea explícita
export { PantryGrid }; // Exportación nombrada para uso interno
export default PantryGrid; // Exportación por defecto para lazy loading
