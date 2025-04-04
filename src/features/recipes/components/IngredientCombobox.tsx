import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchIngredients } from '@/features/ingredients/ingredientService';
import type { Ingredient } from '@/types/ingredientTypes'; // Asegúrate que la ruta sea correcta
import { useDebounce } from '@/hooks/useDebounce'; // Asumiendo que tienes este hook

interface IngredientComboboxProps {
  value: Ingredient | null; // El ingrediente seleccionado
  onChange: (ingredient: Ingredient | null) => void; // Callback al seleccionar
  placeholder?: string;
  disabled?: boolean;
}

export const IngredientCombobox: React.FC<IngredientComboboxProps> = ({
  value,
  onChange,
  placeholder = "Buscar ingrediente...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce de 300ms

  const fetchIngredients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOptions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchIngredients(query, 10); // Limitar a 10 resultados
      setOptions(results);
    } catch (error) {
      console.error("Error buscando ingredientes:", error);
      setOptions([]); // Limpiar opciones en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchIngredients]);

  const handleSelect = (selectedIngredient: Ingredient) => {
    onChange(selectedIngredient);
    setOpen(false);
    setSearchQuery(''); // Limpiar búsqueda después de seleccionar
    setOptions([]); // Limpiar opciones
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-slate-700 border-slate-300 hover:bg-slate-50"
          disabled={disabled}
        >
          {value ? value.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command shouldFilter={false}> {/* Desactivar filtro interno de Command */}
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={disabled}
          />
          <CommandList>
            {isLoading && <CommandItem>Cargando...</CommandItem>}
            {!isLoading && options.length === 0 && searchQuery.length >= 2 && (
              <CommandEmpty>No se encontraron ingredientes.</CommandEmpty>
            )}
             {!isLoading && options.length === 0 && searchQuery.length < 2 && (
              <CommandEmpty>Escribe al menos 2 caracteres para buscar.</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((ingredient) => (
                <CommandItem
                  key={ingredient.id}
                  value={ingredient.name} // Usar nombre para búsqueda/valor interno si es necesario
                  onSelect={() => handleSelect(ingredient)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value?.id === ingredient.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {ingredient.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};