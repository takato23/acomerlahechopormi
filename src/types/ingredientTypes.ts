// src/types/ingredientTypes.ts
export interface Ingredient {
  id: string; // Generalmente un UUID
  name: string;
  category_id: string; // ID de la categoría a la que pertenece
  default_unit: string | null; // Unidad por defecto (ej. 'gr', 'ml', 'ud')
}