import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react'; // Icono para cerrar

interface FilterPanelProps {
  uniqueChains: string[];
  selectedChains: Set<string>;
  onSelectedChainsChange: (newSelectedChains: Set<string>) => void;
  onClose: () => void;
}

export function FilterPanel({
  uniqueChains,
  selectedChains,
  onSelectedChainsChange,
  onClose,
}: FilterPanelProps) {

  const handleCheckboxChange = (chain: string, checked: boolean | 'indeterminate') => {
    // Asegurarnos de que checked sea boolean
    if (typeof checked === 'boolean') {
        const newSelection = new Set(selectedChains);
        if (checked) {
          newSelection.add(chain);
        } else {
          newSelection.delete(chain);
        }
        onSelectedChainsChange(newSelection);
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-background border-l shadow-lg z-20 p-4 overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar filtros">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-grow"> {/* Contenedor para el contenido scrolleable */}
        <h3 className="text-md font-medium mb-3">Cadenas</h3>
        {uniqueChains.length > 0 ? (
          uniqueChains.map(chain => (
            <div key={chain} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`chain-${chain}`}
                checked={selectedChains.has(chain)}
                onCheckedChange={(checked) => handleCheckboxChange(chain, checked)}
                aria-labelledby={`label-chain-${chain}`}
              />
              <Label htmlFor={`chain-${chain}`} id={`label-chain-${chain}`} className="cursor-pointer">
                {chain}
              </Label>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No hay cadenas disponibles para filtrar.</p>
        )}
      </div>

      {/* Opcional: Botón para aplicar filtros si no se aplica al instante */}
      {/* <div className="mt-auto pt-4 border-t">
        <Button className="w-full" onClick={onClose}>Aplicar</Button>
      </div> */}
    </div>
  );
} 