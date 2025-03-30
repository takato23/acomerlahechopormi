import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { CreateIngredientData } from '../recipeTypes';
import { COMMON_UNITS, UNIT_LABELS } from '../recipeTypes';

interface IngredientItemProps {
  ingredient: CreateIngredientData;
  onUpdate: (updatedIngredient: CreateIngredientData) => void;
  onDelete: () => void;
  index: number;
}

export function IngredientItem({
  ingredient,
  onUpdate,
  onDelete,
  index,
}: IngredientItemProps) {
  const handleChange = (
    field: keyof CreateIngredientData,
    value: string | number | null
  ) => {
    onUpdate({
      ...ingredient,
      [field]: value,
    });
  };

  return (
    <div className="flex items-start space-x-2 mb-2">
      {/* Nombre del ingrediente */}
      <div className="flex-grow">
        <Input
          type="text"
          value={ingredient.ingredient_name}
          onChange={(e) => handleChange('ingredient_name', e.target.value)}
          placeholder="Nombre del ingrediente"
          aria-label={`Nombre del ingrediente ${index + 1}`}
        />
      </div>

      {/* Cantidad */}
      <div className="w-24">
        <Input
          type="number"
          value={ingredient.quantity || ''}
          onChange={(e) =>
            handleChange(
              'quantity',
              e.target.value ? parseFloat(e.target.value) : null
            )
          }
          placeholder="Cantidad"
          aria-label={`Cantidad del ingrediente ${index + 1}`}
          min="0"
          step="any"
        />
      </div>

      {/* Unidad */}
      <div className="w-32">
        <select
          value={ingredient.unit || ''}
          onChange={(e) => handleChange('unit', e.target.value || null)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={`Unidad del ingrediente ${index + 1}`}
        >
          <option value="">Sin unidad</option>
          {COMMON_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {UNIT_LABELS[unit]}
            </option>
          ))}
        </select>
      </div>

      {/* Botón eliminar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        aria-label={`Eliminar ingrediente ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}