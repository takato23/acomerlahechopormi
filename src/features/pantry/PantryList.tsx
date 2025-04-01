import React from 'react'; // Solo una importación de React
import { PantryItem } from './types';
import { PantryListItemRow } from './components/PantryListItemRow';

interface PantryListProps {
 items: PantryItem[];
 onEdit: (item: PantryItem) => void;
 onDelete: (itemId: string) => void;
 // Nuevas props para selección
 isSelectionMode: boolean;
 selectedItems: Set<string>;
 onSelectItem: (itemId: string) => void;
}

export function PantryList({
 items,
 onEdit,
 onDelete,
 isSelectionMode,
 selectedItems,
 onSelectItem
}: PantryListProps) {

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground" id="pantry-empty-state">
        Tu despensa está vacía. ¡Añade algunos items!
      </div>
    );
  }

  return (
    <div className="h-[400px] overflow-y-auto rounded-md border">
      <div className="w-full">
        {/* Header */}
       <div className="flex w-full bg-muted/50 border-b">
         {/* Añadir espacio para checkbox si estamos en modo selección */}
         {isSelectionMode && <div className="p-3 w-10 flex-shrink-0"></div>}
         <div className="flex-1 p-3 font-medium">Nombre</div>
         <div className="p-3 font-medium">Cantidad</div>
         <div className="p-3 font-medium flex-shrink-0">Unidad</div>
         <div className="p-3 font-medium">Categoría</div>
         <div className="p-3 font-medium flex-shrink-0">Caducidad</div>
         <div className="p-3 font-medium text-right flex-shrink-0">Acciones</div>
       </div>
        {/* Rows */}
        <div className="w-full">
          {items.map((item) => (
           <PantryListItemRow
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
      </div>
    </div>
  );
}