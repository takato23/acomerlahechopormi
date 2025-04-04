import React from 'react';
import { Input } from '../../../components/ui/input'; // Ruta relativa
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'; // Ruta relativa
import { Category } from '../types';
import { Label } from '../../../components/ui/label'; // Ruta relativa

interface PantryFiltersProps {
  categories: Category[];
  onFilterChange: (filters: { searchTerm: string; categoryId: string; tags: string }) => void;
  currentFilters: { searchTerm: string; categoryId: string; tags: string }; // Renombrar prop
}

export function PantryFilters({ categories, onFilterChange, currentFilters }: PantryFiltersProps) {
  // Eliminar estados internos, leer directamente de props

  // Handlers para notificar cambios al padre
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...currentFilters, searchTerm: event.target.value });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...currentFilters, categoryId: value });
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...currentFilters, tags: event.target.value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 border rounded-lg bg-muted/40">
      {/* Filtro por Nombre */}
      <div className="flex-1">
        <Label htmlFor="search-term" className="text-xs mb-1 block">Buscar por nombre:</Label>
        <Input
          id="search-term"
          placeholder="Buscar item..."
          value={currentFilters.searchTerm} // Leer de props
          onChange={handleSearchChange} // Usar handler
          className="h-9"
        />
      </div>

      {/* Filtro por Categoría */}
      <div className="w-full sm:w-1/3">
         <Label htmlFor="category-filter" className="text-xs mb-1 block">Filtrar por categoría:</Label>
         <Select value={currentFilters.categoryId} onValueChange={handleCategoryChange}> {/* Leer de props, usar handler */}
             <SelectTrigger id="category-filter" className="h-9">
                 <SelectValue placeholder="Todas" />
             </SelectTrigger>
             <SelectContent>
                 <SelectItem value="all">Todas las categorías</SelectItem>
                 {categories.map(cat => (
                     <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                 ))}
                 <SelectItem value="unassigned">Sin categoría</SelectItem> {/* Opción para items sin categoría */}
             </SelectContent>
         </Select>
      </div>

      {/* Filtro por Tags */}
      <div className="w-full sm:w-1/3">
         <Label htmlFor="tags-filter" className="text-xs mb-1 block">Filtrar por etiquetas:</Label>
         <Input
           id="tags-filter"
           placeholder="Ej: oferta, sin tacc"
           value={currentFilters.tags} // Leer de props
           onChange={handleTagsChange} // Usar handler
           className="h-9"
         />
          <p className="text-xs text-muted-foreground mt-1">
             Separadas por comas.
          </p>
      </div>
    </div>
  );
}