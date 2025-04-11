import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { parseShoppingInput, ParsedShoppingInput } from '../lib/inputParser';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import type { Category } from '@/types/categoryTypes';

interface AddItemFormProps {
  onAddItem: (parsedItem: ParsedShoppingInput & { categoryId?: string | null }) => Promise<boolean>;
  isAdding?: boolean;
  onSearchChange?: (value: string) => void;
  currentSearchTerm?: string;
  availableCategories: Category[];
  isLoadingCategories?: boolean;
}

export function AddItemForm({ 
  onAddItem, 
  isAdding = false, 
  onSearchChange, 
  currentSearchTerm,
  availableCategories,
  isLoadingCategories = false,
}: AddItemFormProps) {
  const isControlled = currentSearchTerm !== undefined;
  const [internalItemName, setInternalItemName] = useState('');
  const itemName = isControlled ? currentSearchTerm : internalItemName;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [localIsAdding, setLocalIsAdding] = useState(false);
  
  const adding = isAdding || localIsAdding;

  useEffect(() => {
    if (isControlled && !itemName) {
      setSelectedCategoryId(null);
    }
  }, [itemName, isControlled]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (!isControlled) {
      setInternalItemName(newValue);
    }
    if (onSearchChange) {
      onSearchChange(newValue);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value === 'none' ? null : value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = itemName.trim();
    if (!trimmedName || adding) return; 

    if (!isAdding) { setLocalIsAdding(true); }
    
    try {
      const parsedInput = parseShoppingInput(trimmedName); 
      const success = await onAddItem({ 
        ...parsedInput, 
        categoryId: selectedCategoryId 
      }); 
      
      if (success) {
        // Si la adición fue exitosa, el padre (ShoppingListPage)
        // limpiará el searchTerm, lo que debería resetear 
        // selectedCategoryId a través del useEffect.
        // Si no fuera controlado, limpiaríamos aquí:
        // if (!isControlled) { 
        //    setInternalItemName(''); 
        //    setSelectedCategoryId(null); 
        // }
      } else {
        console.error("[AddItemForm] onAddItem reported failure.");
      }
      
    } catch (error) {
      console.error("[AddItemForm] Error calling onAddItem:", error);
    } finally {
      if (!isAdding) { setLocalIsAdding(false); }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <Input
          type="text"
          value={itemName}
          onChange={handleInputChange}
          placeholder="Añadir o buscar en la lista..."
          className="flex-grow border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
          disabled={adding}
          aria-label="Añadir ítem o buscar en la lista"
        />
        <Button
          type="submit"
          disabled={adding || !itemName.trim()}
          size="icon"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          aria-label="Añadir ítem a la lista"
        >
          {adding ? <Spinner size="sm" className="text-white"/> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
      {itemName.trim() && ( 
         <div className="flex items-center gap-2 pl-1">
           <span className="text-xs text-slate-500">Categoría:</span>
           <Select 
             value={selectedCategoryId ?? 'none'} 
             onValueChange={handleCategoryChange}
             disabled={adding || isLoadingCategories}
           >
             <SelectTrigger className="w-[180px] h-7 text-xs border-slate-300">
               <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Seleccionar"} />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="none">Sin Categoría</SelectItem>
               {availableCategories.map(cat => (
                 <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
      )}
    </div>
  );
}