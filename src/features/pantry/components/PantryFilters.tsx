import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Category } from '../types'; // Asumiendo que Category está en types.ts
import { Search } from 'lucide-react';

interface PantryFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  showOnlyExpiringSoon: boolean;
  onShowOnlyExpiringSoonChange: (show: boolean) => void;
  availableCategories: Category[];
}

export function PantryFilters({
  searchTerm,
  onSearchTermChange,
  selectedCategoryId,
  onCategoryChange,
  showOnlyExpiringSoon,
  onShowOnlyExpiringSoonChange,
  availableCategories,
}: PantryFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card">
      {/* Búsqueda por Nombre */}
      <div className="flex-grow">
        <Label htmlFor="pantry-search" className="sr-only">Buscar en Despensa</Label>
        <div className="relative">
           <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             id="pantry-search"
             type="text"
             placeholder="Buscar por nombre..."
             value={searchTerm}
             onChange={(e) => onSearchTermChange(e.target.value)}
             className="pl-8 h-10" // Padding izquierdo para icono
           />
        </div>
      </div>

      {/* Filtro por Categoría */}
      <div className="sm:w-48">
        <Label htmlFor="pantry-category-filter" className="sr-only">Filtrar por Categoría</Label>
        <Select
          // Pasar undefined si es null para que funcione el placeholder
          value={selectedCategoryId ?? undefined}
          // El onValueChange ya maneja el caso de string vacío (que no debería ocurrir ahora)
          onValueChange={(value) => onCategoryChange(value || null)}
        >
          <SelectTrigger id="pantry-category-filter" className="h-10">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="">Todas las categorías</SelectItem> */} {/* Eliminado: Causa error en Radix. El placeholder se muestra cuando el value es null/undefined */}
            {/* Añadir opción para Sin Categoría si es relevante */}
            <SelectItem value="uncategorized">Sin Categoría</SelectItem>
            {availableCategories
                .filter(cat => cat.id !== 'uncategorized') // Excluir la default 'uncategorized' si la añadimos manualmente
                .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                    </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro Próximos a Vencer */}
      <div className="flex items-center space-x-2 pt-2 sm:pt-0 sm:border-l sm:pl-4">
        <Switch
          id="expiring-soon-filter"
          checked={showOnlyExpiringSoon}
          onCheckedChange={onShowOnlyExpiringSoonChange}
        />
        <Label htmlFor="expiring-soon-filter" className="text-sm whitespace-nowrap">
          Próximos a vencer
        </Label>
      </div>
    </div>
  );
}