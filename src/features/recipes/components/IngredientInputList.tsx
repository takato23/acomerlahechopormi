import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { CreateIngredientData } from '../recipeTypes';
import { IngredientItem } from './IngredientItem';

interface IngredientInputListProps {
  ingredients: CreateIngredientData[];
  onChange: (ingredients: CreateIngredientData[]) => void;
}

export function IngredientInputList({
  ingredients,
  onChange,
}: IngredientInputListProps) {
  // Añadir un nuevo ingrediente vacío a la lista
  const handleAddIngredient = () => {
    onChange([
      ...ingredients,
      {
        ingredient_name: '',
        quantity: null,
        unit: null,
      },
    ]);
  };

  // Actualizar un ingrediente existente
  const handleUpdateIngredient = (index: number, updatedIngredient: CreateIngredientData) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = updatedIngredient;
    onChange(updatedIngredients);
  };

  // Eliminar un ingrediente
  const handleDeleteIngredient = (index: number) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    onChange(updatedIngredients);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <IngredientItem
            key={index}
            ingredient={ingredient}
            onUpdate={(updatedIngredient) =>
              handleUpdateIngredient(index, updatedIngredient)
            }
            onDelete={() => handleDeleteIngredient(index)}
            index={index}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddIngredient}
        className="w-full flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Añadir ingrediente
      </Button>
    </div>
  );
}