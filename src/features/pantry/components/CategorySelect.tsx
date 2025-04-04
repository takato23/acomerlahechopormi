import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from '../types';
import { Star, Filter } from 'lucide-react';

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  // Agrupar categorías por tipo
  const groupedCategories = useMemo(() => {
    const commonCategories = categories.filter(c => 
      c.is_common || c.name.toLowerCase().includes('basic') || 
      ['frutas', 'verduras', 'carnes', 'lácteos'].includes(c.name.toLowerCase())
    );
    const otherCategories = categories.filter(c => 
      !commonCategories.includes(c)
    );

    return {
      common: commonCategories,
      other: otherCategories
    };
  }, [categories]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <SelectValue placeholder="Filtrar por categoría" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* Filtros especiales */}
        <SelectGroup>
          <SelectLabel>Filtros</SelectLabel>
          <SelectItem value="all">Todas las categorías</SelectItem>
          <SelectItem value="favorites">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
              Favoritos
            </div>
          </SelectItem>
        </SelectGroup>

        {/* Categorías comunes */}
        {groupedCategories.common.length > 0 && (
          <SelectGroup>
            <SelectLabel>Categorías comunes</SelectLabel>
            {groupedCategories.common.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Otras categorías */}
        {groupedCategories.other.length > 0 && (
          <SelectGroup>
            <SelectLabel>Otras categorías</SelectLabel>
            {groupedCategories.other.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}