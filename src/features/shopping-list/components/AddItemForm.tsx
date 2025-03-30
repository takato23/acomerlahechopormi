import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { parseShoppingInput, ParsedShoppingInput } from '../lib/inputParser'; // Importar parser y tipo

interface AddItemFormProps {
  onAddItem: (parsedItem: ParsedShoppingInput) => Promise<void>; // Actualizar tipo de prop
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [itemName, setItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = itemName.trim();
    if (!trimmedName) return; // No añadir si está vacío

    setIsAdding(true);
    try {
      const parsedInput = parseShoppingInput(trimmedName); // Parsear input
      await onAddItem(parsedInput); // Pasar objeto parseado
      setItemName(''); // Limpiar input si tiene éxito
    } catch (error) {
      // El error se maneja en la página padre (con toast)
      console.error("Error passed to AddItemForm handler:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
      <Input
        type="text"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        placeholder="Añadir ítem manualmente..."
        className="flex-grow"
        disabled={isAdding}
        required // Hacer requerido
      />
      <Button type="submit" disabled={isAdding || !itemName.trim()} size="icon">
        {isAdding ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
      </Button>
    </form>
  );
}