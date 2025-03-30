import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  // CommandLoading, // No existe en la implementación de Shadcn
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Ingredient } from "../types";
import { searchIngredients } from "@/features/ingredients/ingredientService"; // Corregir ruta de importación
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/Spinner"; // Importar Spinner

interface IngredientComboboxProps {
  selectedIngredient: Ingredient | null;
  onSelect: (ingredient: Ingredient | null, isNew?: boolean) => void; // Modificado para indicar si es nuevo
  disabled?: boolean;
}

export function IngredientCombobox({
  selectedIngredient,
  onSelect,
  disabled,
}: IngredientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce de 300ms

  React.useEffect(() => {
    if (debouncedSearchQuery.length < 2) { // No buscar con menos de 2 caracteres
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchIngredients = async () => {
      setIsLoading(true);
      try {
        const results = await searchIngredients(debouncedSearchQuery);
        if (isMounted) {
          setSearchResults(results);
        }
      } catch (error) {
        console.error("Error searching ingredients:", error);
        if (isMounted) {
          setSearchResults([]); // Limpiar resultados en caso de error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchIngredients();

    return () => {
      isMounted = false; // Cleanup para evitar setear estado en componente desmontado
    };
  }, [debouncedSearchQuery]);

  const handleSelect = (ingredient: Ingredient | null, isNew = false) => {
    onSelect(ingredient, isNew);
    setOpen(false);
    // Limpiar búsqueda si se seleccionó algo o se canceló
    setSearchQuery(ingredient ? ingredient.name : "");
  };

  // Opción para crear nuevo ingrediente
  const canCreateNew = !isLoading && debouncedSearchQuery.length > 0 && !searchResults.some(
    (ing) => ing.name.toLowerCase() === debouncedSearchQuery.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedIngredient
            ? selectedIngredient.name
            : "Seleccionar ingrediente..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command shouldFilter={false}> {/* Deshabilitar filtro interno de cmdk */}
          <CommandInput
            placeholder="Buscar ingrediente..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {/* Mostrar Spinner si está cargando */}
            {isLoading && (
              <div className="py-6 text-center text-sm flex items-center justify-center gap-2 text-muted-foreground">
                <Spinner size="sm" />
                Buscando...
              </div>
            )}
            {!isLoading && searchResults.length === 0 && !canCreateNew && (
              <CommandEmpty>No se encontraron ingredientes.</CommandEmpty>
            )}
            <CommandGroup>
              {searchResults.map((ingredient) => (
                <CommandItem
                  key={ingredient.id}
                  value={ingredient.name} // Usar nombre para filtro visual si estuviera habilitado
                  onSelect={() => handleSelect(ingredient)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIngredient?.id === ingredient.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {ingredient.name}
                </CommandItem>
              ))}
              {/* Opción para crear nuevo */}
              {canCreateNew && (
                 <CommandItem
                   key="--create-new--"
                   value={searchQuery} // Usar query actual
                   onSelect={() => {
                     // Crear un objeto temporal para indicar creación
                     const newIngredientPlaceholder: Ingredient = {
                       id: '--new--', // ID especial
                       name: searchQuery.trim(),
                       created_at: new Date().toISOString(),
                     };
                     handleSelect(newIngredientPlaceholder, true);
                   }}
                   className="text-muted-foreground italic"
                 >
                   <PlusCircle className="mr-2 h-4 w-4" />
                   Crear "{searchQuery.trim()}"
                 </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}