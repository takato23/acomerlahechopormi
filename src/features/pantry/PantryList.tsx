import React from 'react';
import { PantryItem } from './types';
import { PantryListItemRow } from './components/PantryListItemRow';

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
        <div className="flex w-full bg-muted/50 border-b sticky top-0 z-10"> {/* Hacer header pegajoso */}
          {isSelectionMode && <div className="p-3 w-10 flex-shrink-0"></div>}
          <div className="flex-1 p-3 font-medium">Nombre</div>
          <div className="p-3 font-medium w-20 text-center">Cant.</div> {/* Ancho fijo */}
          <div className="p-3 font-medium w-24">Unidad</div> {/* Ancho fijo */}
          <div className="p-3 font-medium w-32">Categoría</div> {/* Ancho fijo */}
          <div className="p-3 font-medium w-28">Caducidad</div> {/* Ancho fijo */}
          <div className="p-3 font-medium text-right w-24">Acciones</div> {/* Ancho fijo */}
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