import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { parseShoppingInput, ParsedShoppingInput } from '../lib/inputParser'; // Importar parser y tipo

interface AddItemFormProps {
  onAddItem: (parsedItem: ParsedShoppingInput) => Promise<void>; // Actualizar tipo de prop
  isAdding?: boolean; // Nuevo prop opcional para controlar el estado de carga
  onSearchChange?: (value: string) => void; // <-- Nuevo prop para notificar búsqueda
  currentSearchTerm?: string; // <-- Nuevo prop para controlar valor si es necesario
}

export function AddItemForm({ 
  onAddItem, 
  isAdding = false, 
  onSearchChange, 
  currentSearchTerm // <-- Recibir nuevos props
}: AddItemFormProps) {
  // Usar el término de búsqueda del padre si se proporciona, sino estado local
  // Esto permite que el componente funcione como buscador y como simple añadidor
  const isControlled = currentSearchTerm !== undefined;
  const [internalItemName, setInternalItemName] = useState('');
  const itemName = isControlled ? currentSearchTerm : internalItemName;

  const [localIsAdding, setLocalIsAdding] = useState(false);
  
  const adding = isAdding || localIsAdding;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (!isControlled) {
      setInternalItemName(newValue);
    }
    // Siempre notificar al padre si la función existe
    if (onSearchChange) {
      onSearchChange(newValue);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = itemName.trim();
    if (!trimmedName || adding) return; 

    if (!isAdding) { setLocalIsAdding(true); }
    
    try {
      const parsedInput = parseShoppingInput(trimmedName); 
      await onAddItem(parsedInput); 
      // Limpiar solo si NO es controlado (si es controlado, el padre limpia)
      if (!isControlled) {
        setInternalItemName(''); 
      }
    } catch (error) {
      console.error("Error passed to AddItemForm handler:", error);
    } finally {
      if (!isAdding) { setLocalIsAdding(false); }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <Input
        type="text"
        value={itemName} // Usar el valor controlado o interno
        onChange={handleInputChange} // Usar el nuevo handler
        placeholder="Añadir o buscar en la lista..." // Placeholder actualizado
        className="flex-grow border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
        disabled={adding}
        // El required podría quitarse si ahora también es buscador
        // required 
        aria-label="Añadir ítem o buscar en la lista" // Aria-label actualizado
      />
      <Button
        type="submit"
        disabled={adding || !itemName.trim()} // Deshabilitar si está añadiendo o vacío
        size="icon"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        aria-label="Añadir ítem a la lista" // Aria-label específico para añadir
      >
        {adding ? <Spinner size="sm" className="text-white"/> : <Plus className="h-4 w-4" />}
      </Button>
    </form>
  );
}