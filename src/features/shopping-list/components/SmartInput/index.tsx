import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartInputProps, SmartInputState } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import useSuggestions from '../../hooks/useSuggestions'; // Importar el hook
import { Suggestion } from '../../types/suggestions'; // Importar tipo Suggestion

/**
 * Input inteligente con autocompletado y sugerencias
 */
export const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = 'Buscar...',
  className,
  disabled = false,
  maxSuggestions = 5,
  category
}) => {
  // Referencias y estado local del componente
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Hook para manejar la lógica de sugerencias
  const {
    suggestions,
    loading,
    error,
    searchSuggestions,
    handleSelect: handleSuggestionSelect // Renombrar para evitar conflicto
  } = useSuggestions({
    onSelect: onSuggestionSelect,
    category,
    maxSuggestions
  });

  // Debounce del valor de búsqueda
  const debouncedValue = useDebounce(value, 300);

  // Efecto para cargar sugerencias cuando cambia el valor debounced
  useEffect(() => {
    if (debouncedValue.length >= 2) {
      searchSuggestions(debouncedValue);
      setIsOpen(true); // Abrir popover cuando hay búsqueda
    } else {
      setIsOpen(false); // Cerrar si el input es corto
    }
  }, [debouncedValue, searchSuggestions]);

  // Efecto para resetear índice seleccionado cuando cambian las sugerencias
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  /**
   * Maneja eventos de teclado para navegación
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1)); // Permitir -1 para deseleccionar
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
          setIsOpen(false); // Cerrar al seleccionar
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, suggestions, selectedIndex, handleSuggestionSelect]);

  /**
   * Maneja el cambio de apertura del Popover
   */
  const handleOpenChange = (open: boolean) => {
    // Solo permitir cerrar manualmente, la apertura la controla el useEffect
    if (!open) {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (value.length >= 2 && suggestions.length > 0) setIsOpen(true); }} // Reabrir al enfocar si hay sugerencias
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full',
              // No redondear esquinas inferiores si está abierto
              // isOpen && suggestions.length > 0 && 'rounded-b-none', 
              className
            )}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            role="combobox"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      
      {/* Usar portal para evitar problemas de z-index */}
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" // Ajustar ancho al trigger
        align="start"
        side="bottom"
        sideOffset={4} // Pequeño espacio
        onOpenAutoFocus={(e) => e.preventDefault()} // Evitar que el popover robe el foco
      >
        <Command>
          {error && <div className="p-2 text-sm text-destructive">{error.message}</div>}
          {!loading && suggestions.length === 0 && debouncedValue.length >= 2 && (
            <CommandEmpty>No se encontraron sugerencias.</CommandEmpty>
          )}
          {suggestions.length > 0 && (
            <CommandGroup>
              {suggestions.map((suggestion, index) => (
                <CommandItem
                  key={suggestion.id}
                  value={suggestion.name} // Necesario para Command
                  onSelect={() => {
                    handleSuggestionSelect(suggestion);
                    setIsOpen(false); // Cerrar al seleccionar
                  }}
                  className={cn(
                    'cursor-pointer',
                    index === selectedIndex && 'bg-accent text-accent-foreground' // Estilo de selección
                  )}
                  // Añadir aria-selected para accesibilidad
                  aria-selected={index === selectedIndex}
                  role="option"
                >
                  {/* Icono Check opcional si se quiere marcar la selección actual */}
                  {/* <Check className={cn('mr-2 h-4 w-4', index === selectedIndex ? 'opacity-100' : 'opacity-0')} /> */}
                  {suggestion.name}
                  {/* Podríamos añadir info extra como categoría o frecuencia */}
                  {/* {suggestion.category && <span className="ml-2 text-xs text-muted-foreground">{suggestion.category}</span>} */}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SmartInput;