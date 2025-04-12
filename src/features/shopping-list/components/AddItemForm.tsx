import React, { useState, useEffect, Suspense } from 'react';
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
import VoiceInput from '@/features/pantry/components/voice/VoiceInput';
import { toast } from 'sonner';
import { getCategoryForItem } from '../utils/categorization';

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
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const adding = isAdding || localIsAdding || isProcessingVoice;

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
    setSelectedCategoryId(null);
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
      
      let finalCategoryId = selectedCategoryId;
      if (!finalCategoryId && parsedInput.name) {
           const autoCategory = getCategoryForItem(parsedInput.name);
           const matchedCategory = availableCategories.find(cat => cat.name.toLowerCase() === autoCategory?.toLowerCase());
           if (matchedCategory) {
              finalCategoryId = matchedCategory.id;
              console.log(`[AddItemForm] Auto-categoría asignada: ${matchedCategory.name} (ID: ${finalCategoryId})`);
           } else if (autoCategory) {
             console.log(`[AddItemForm] Auto-categoría detectada (${autoCategory}) pero no encontrada en disponibles.`);
           }
      }

      const success = await onAddItem({ 
        ...parsedInput, 
        categoryId: finalCategoryId
      }); 
      
      if (success) {
        toast.success(`\"${parsedInput.name || trimmedName}\" añadido.`);
      } else {
        console.error("[AddItemForm] onAddItem reported failure.");
      }
      
    } catch (error) {
      console.error("[AddItemForm] Error calling onAddItem:", error);
    } finally {
      if (!isAdding) { setLocalIsAdding(false); }
    }
  };

  const handleVoiceTranscript = async (text: string) => {
    if (!text || adding) return;

    setIsProcessingVoice(true);
    setInternalItemName(text);
    if (onSearchChange) onSearchChange(text);
    setSelectedCategoryId(null);

    console.log(`[AddItemForm] Processing voice input: \"${text}\"`);

    try {
        const parsedInput = parseShoppingInput(text);
        
        let finalCategoryId: string | null = null;
        if (parsedInput.name) {
           const autoCategory = getCategoryForItem(parsedInput.name);
           const matchedCategory = availableCategories.find(cat => cat.name.toLowerCase() === autoCategory?.toLowerCase());
           if (matchedCategory) {
              finalCategoryId = matchedCategory.id;
              console.log(`[AddItemForm][Voice] Auto-categoría asignada: ${matchedCategory.name} (ID: ${finalCategoryId})`);
           } else if(autoCategory) {
              console.log(`[AddItemForm][Voice] Auto-categoría detectada (${autoCategory}) pero no encontrada en disponibles.`);
           }
        }

        const success = await onAddItem({
           ...parsedInput,
           categoryId: finalCategoryId
        });

        if (success) {
           toast.success(`\"${parsedInput.name || text}\" añadido por voz.`);
        } else {
           toast.error(`Error al añadir \"${parsedInput.name || text}\" por voz.`);
           console.error("[AddItemForm][Voice] onAddItem reported failure.");
        }
    } catch (error) {
       console.error("[AddItemForm] Error processing voice input:", error);
       toast.error("Error al procesar la entrada de voz.");
    } finally {
       setIsProcessingVoice(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <Input
          type="text"
          value={itemName}
          onChange={handleInputChange}
          placeholder="Añadir o buscar en la lista... (ej: 2kg Papas)"
          className="h-10 flex-grow border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
          disabled={adding}
          readOnly={isProcessingVoice}
          aria-label="Añadir ítem o buscar en la lista"
        />
        <Suspense fallback={<Button variant="outline" size="icon" disabled className="h-10 w-10"><Spinner size="sm" /></Button>}>
           <VoiceInput
             isLoading={isAdding}
             isProcessingVoice={isProcessingVoice}
             onTranscriptReceived={handleVoiceTranscript}
           />
        </Suspense>
        <Button
          type="submit"
          disabled={adding || !itemName.trim()}
          size="icon"
          className="h-10 w-10 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
          aria-label="Añadir ítem a la lista"
        >
          {adding && !isProcessingVoice ? <Spinner size="sm" className="text-white"/> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
      {itemName.trim() && !isProcessingVoice && ( 
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