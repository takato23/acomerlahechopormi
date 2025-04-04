import React from 'react';
import { Category, PantryItem } from '../types';
import { Input } from '@/components/ui/input';
import { FavoriteTags } from './FavoriteTags';
import { CategorySelect } from './CategorySelect';
import { ClearPantryDialog } from './ClearPantryDialog';
// No necesitamos Button ni Trash2 aquí ahora
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PantryFiltersSectionProps {
  categories: Category[];
  filters: {
    searchTerm: string;
    categoryId: string;
    tags: string;
  };
  onFilterChange: (filters: PantryFiltersSectionProps['filters']) => void;
  isDesktop: boolean;
  showFiltersSheet: boolean;
  setShowFiltersSheet: (show: boolean) => void;
  pantryItems?: PantryItem[];
  onClearPantry?: () => Promise<void>;
}

export default function PantryFiltersSection({
  categories,
  filters,
  onFilterChange,
  isDesktop,
  showFiltersSheet,
  setShowFiltersSheet,
  pantryItems = [],
  onClearPantry
}: PantryFiltersSectionProps) {
  const favoriteItems = pantryItems.filter(item => item.is_favorite);

  const handleFavoriteTagClick = (itemName: string) => {
    onFilterChange({
      ...filters,
      searchTerm: filters.searchTerm === itemName ? '' : itemName,
      categoryId: 'all'
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Tags de Favoritos */}
        <FavoriteTags
          favoriteItems={favoriteItems}
          onTagClick={handleFavoriteTagClick}
          activeTag={filters.searchTerm}
        />

        {/* Barra de búsqueda, filtros y botón de limpiar */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Input de Búsqueda */}
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar en la despensa..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Contenedor para Select y Botón */}
          <div className="flex gap-2 items-center w-full sm:w-auto">
            {/* Div wrapper para que Select crezca en móvil */}
            <div className="flex-grow">
              <CategorySelect
                categories={categories}
                value={filters.categoryId}
                onChange={(value) => onFilterChange({ ...filters, categoryId: value })}
              />
            </div>

            {/* Botón Vaciar Despensa (Dialogo envuelto en Tooltip) */}
            {onClearPantry && pantryItems.length > 0 && (
              <Tooltip>
                {/* El TooltipTrigger ahora envuelve directamente a ClearPantryDialog */}
                <TooltipTrigger asChild>
                   <ClearPantryDialog
                     onConfirm={onClearPantry}
                     itemCount={pantryItems.length}
                     // Ya no pasamos triggerButton, ClearPantryDialog lo define
                   />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vaciar toda la despensa</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}