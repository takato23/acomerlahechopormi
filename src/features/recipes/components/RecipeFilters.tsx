import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Category } from '@/types/categoryTypes';
import { getCategories } from '@/services/dataService';
import { RecipeFilters as RecipeFiltersType } from '@/types/recipeTypes';

interface Props {
  filters: RecipeFiltersType;
  onFiltersChange: (filters: Partial<RecipeFiltersType>) => void;
}

export function RecipeFilters({ filters, onFiltersChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ searchTerm: value });
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...(filters.categories || []), categoryId]
      : (filters.categories || []).filter(id => id !== categoryId);
    
    onFiltersChange({ categories: newCategories });
  };

  const handlePrepTimeChange = (value: number[]) => {
    onFiltersChange({ prepTime: value[0] });
  };

  const handleFavoritesChange = (checked: boolean) => {
    onFiltersChange({ favorites: checked });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search">Buscar recetas</Label>
        <Input
          id="search"
          type="search"
          placeholder="Buscar por nombre..."
          value={filters.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Categorías</h3>
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando categorías...</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={filters.categories?.includes(category.id)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-normal"
                >
                  {category.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <Label>Tiempo de preparación (minutos)</Label>
        <Slider
          value={[filters.prepTime || 0]}
          onValueChange={handlePrepTimeChange}
          max={120}
          step={5}
          className="mt-2"
        />
        <div className="mt-1 text-sm text-muted-foreground">
          Hasta {filters.prepTime || 0} minutos
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="favorites"
          checked={filters.favorites}
          onCheckedChange={(checked) =>
            handleFavoritesChange(checked as boolean)
          }
        />
        <Label htmlFor="favorites" className="text-sm font-normal">
          Solo favoritas
        </Label>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => onFiltersChange({
          searchTerm: '',
          categories: [],
          prepTime: 0,
          favorites: false
        })}
      >
        Limpiar filtros
      </Button>
    </div>
  );
}