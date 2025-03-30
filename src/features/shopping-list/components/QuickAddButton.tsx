import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Plus } from 'lucide-react';
import { NewShoppingListItem } from '../types'; // Solo necesitamos este tipo

// Interfaz simplificada
interface SimpleQuickAddButtonProps {
  itemName: string;
  onAdd: (item: NewShoppingListItem) => Promise<void>;
}

export const QuickAddButton: React.FC<SimpleQuickAddButtonProps> = ({
  itemName,
  onAdd,
}) => {
  const [isAdding, setIsAdding] = useState(false); // Estado de carga local

  const handleClick = async () => {
    setIsAdding(true);
    const itemData: NewShoppingListItem = {
      name: itemName,
      quantity: 1,    // Cantidad por defecto
      unit: null,     // Unidad por defecto
    };
    try {
      await onAdd(itemData);
    } catch (error) {
      console.error("Error adding item from quick add:", error);
      // El toast de error se maneja en la página principal
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full px-3 py-1 h-auto text-xs hover:bg-primary/10 flex items-center gap-1"
      onClick={handleClick}
      disabled={isAdding} // Deshabilitar mientras se añade
    >
      {isAdding ? <Spinner size="sm" className="mr-1" /> : null}
      {itemName}
      {/* Quitamos el icono Plus para evitar confusión, ya no abre nada */}
    </Button>
  );
};