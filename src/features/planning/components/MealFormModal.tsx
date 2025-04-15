// src/features/planning/components/MealFormModal.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'; // Añadir DialogDescription
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/Spinner'; // Importar Spinner
import { Sparkles } from 'lucide-react'; // Importar icono Sparkles
import type { PlannedMeal, MealType, UpsertPlannedMealData, MealAlternativeRequestContext, MealAlternative } from '../types'; // Importar tipos
import type { Recipe } from '../../../types/recipeTypes'; // Corregir ruta de importación
import { format } from 'date-fns'; // Importar format
import { es } from 'date-fns/locale'; // Importar locale español
import { cn } from '@/lib/utils'; // Importar cn

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  mealType: MealType | null;
  mealToEdit?: PlannedMeal | null;
  userRecipes: Recipe[];
  onSave: (data: UpsertPlannedMealData, mealId?: string) => Promise<void>; // Hacerla async
  onRequestAlternatives: (context: MealAlternativeRequestContext) => Promise<MealAlternative[] | null>; // Callback para buscar alternativas
}

// Definir mealTypeLabels aquí o pasarlo como prop
// Usar los valores exactos del enum como claves y valores
const mealTypeLabels: { [key in MealType]: string } = {
  'Desayuno': 'Desayuno',
  'Almuerzo': 'Almuerzo',
  'Merienda': 'Merienda',
  'Cena': 'Cena',
};

export function MealFormModal({
  isOpen,
  onClose,
  date,
  mealType,
  mealToEdit,
  userRecipes,
  onSave,
  onRequestAlternatives,
}: MealFormModalProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [customMealName, setCustomMealText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<MealAlternative[] | null>(null); // Estado para alternativas
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false); // Estado de carga para alternativas

  const isEditing = Boolean(mealToEdit);

  useEffect(() => {
    if (isOpen) {
      setError(null); // Limpiar error al abrir
      if (isEditing && mealToEdit) {
        setSelectedRecipeId(mealToEdit.recipe_id || '');
        setCustomMealText(mealToEdit.custom_meal_name || '');
      } else {
        // Resetear al abrir para añadir nuevo
        setSelectedRecipeId('');
        setCustomMealText('');
      }
      // Siempre limpiar alternativas al abrir
      setAlternatives(null); 
      setIsLoadingAlternatives(false);
    }
  }, [isOpen, isEditing, mealToEdit]);

  const handleSave = async () => {
    if (!date || !mealType) return; // Asegurarse de tener fecha y tipo

    setIsSaving(true);
    setError(null);

    const dataToSave: UpsertPlannedMealData = {
      plan_date: format(date, 'yyyy-MM-dd'), // Usar plan_date y formatear fecha
      meal_type: mealType,
      recipe_id: selectedRecipeId || null,
      custom_meal_name: selectedRecipeId ? null : (customMealName.trim() || null),
    };

    // Validar que al menos uno (receta o texto) esté presente
    if (!dataToSave.recipe_id && !dataToSave.custom_meal_name) {
      setError('Debes seleccionar una receta o escribir un nombre de comida.');
      setIsSaving(false);
      return;
    }

    try {
      await onSave(dataToSave, mealToEdit?.id);
      // onClose(); // El padre se encargará de cerrar si onSave tiene éxito
    } catch (err) {
      setError('Error al guardar la comida.');
      console.error("Error saving meal:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Lógica para Alternativas (Dentro del componente) ---
  const handleRequestAlternativesClick = async () => {
    if (!mealType || (!selectedRecipeId && !customMealName.trim())) {
      // No hay contexto suficiente para buscar alternativas
      return;
    }
    setIsLoadingAlternatives(true);
    setAlternatives(null); // Limpiar previas
    setError(null); // Limpiar errores previos

    const context: MealAlternativeRequestContext = {
      meal_type: mealType,
      recipe_id: selectedRecipeId || null,
      custom_meal_name: customMealName.trim() || null,
    };

    try {
      const result = await onRequestAlternatives(context);
      setAlternatives(result);
      if (!result || result.length === 0) {
        // Opcional: Mostrar mensaje si no hay alternativas
        // setError("No se encontraron alternativas."); 
      }
    } catch (err) {
      console.error("Error requesting alternatives:", err);
      setError("Error al buscar alternativas.");
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const handleSelectAlternative = (alternative: MealAlternative) => {
    if (alternative.type === 'recipe') {
      setSelectedRecipeId(alternative.id);
      setCustomMealText(''); // Limpiar texto si se selecciona receta
    } else { // type === 'custom'
      setCustomMealText(alternative.text);
      setSelectedRecipeId(''); // Limpiar receta si se selecciona texto
    }
    setAlternatives(null); // Ocultar lista después de seleccionar
  };
  // --- Fin Lógica para Alternativas ---

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent
        className={cn(
          // Aplicar mismo tamaño que RecipePreviewDialog
          "w-[340px] min-w-[300px] max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto",
          // Mantener estilos de padding, etc.
          "p-6"
        )}
        aria-describedby="meal-form-description-visible"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Comida' : 'Añadir Comida'}
            {date && mealType && (
              <span className="block text-sm font-normal text-muted-foreground">
                {mealTypeLabels[mealType] ?? mealType} - {format(date, 'eeee d MMM', { locale: es })}
              </span>
            )}
            <DialogDescription id="meal-form-description-visible">
              {isEditing ? 'Modifica los detalles de tu comida.' : 'Añade una receta o escribe un nombre para tu comida.'}
            </DialogDescription>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {/* Selector de Receta */}
          <div>
            <Label htmlFor="recipe-select">Seleccionar Receta (Opcional)</Label>
            <Select
              value={selectedRecipeId}
              onValueChange={(value: string) => {
                setSelectedRecipeId(value === '_none' ? '' : value);
                if (value !== '_none') setCustomMealText(''); // Limpiar texto si se selecciona receta
              }}
              disabled={isSaving}
            >
              <SelectTrigger id="recipe-select">
                <SelectValue placeholder="Elige una receta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">-- Ninguna --</SelectItem>
                {userRecipes.map(recipe => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center text-sm text-muted-foreground">O</div>

          {/* Input Texto Libre */}
          <div>
            <Label htmlFor="custom-meal">Escribir Nombre de Comida</Label>
            <Input
              id="custom-meal"
              value={customMealName}
              onChange={(e) => {
                setCustomMealText(e.target.value);
                if (e.target.value) setSelectedRecipeId(''); // Limpiar receta si se escribe texto
              }}
              placeholder="Ej: Milanesas con puré"
              disabled={isSaving}
            />
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          {/* Sección de Alternativas */}
          <div className="mt-4 pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleRequestAlternativesClick}
              disabled={isSaving || isLoadingAlternatives || (!selectedRecipeId && !customMealName.trim())}
            >
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> {/* Ocultar icono decorativo */}
              {isLoadingAlternatives ? 'Buscando...' : 'Buscar Alternativas'}
            </Button>

            {isLoadingAlternatives && (
              <div className="mt-4 flex justify-center">
                <Spinner size="sm" />
              </div>
            )}

            {/* Corregir estructura JSX y check de null para alternatives */}
            {alternatives && alternatives.length > 0 && (
              <div className="mt-4 space-y-2" aria-live="polite"> {/* Añadir aria-live para anunciar la aparición de sugerencias */}
                {/* Usar h4 para el título y asociarlo a la lista */}
                <h4 id="suggestions-heading" className="text-sm font-medium text-muted-foreground">Sugerencias:</h4>
                <ul aria-labelledby="suggestions-heading" className="max-h-32 overflow-y-auto rounded-md border border-border/30 bg-muted/30 p-2">
                  {/* Asegurarse que alternatives no es null antes de mapear */}
                  {alternatives?.map((alt, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        className="w-full text-left p-2 text-sm rounded hover:bg-primary/10 text-foreground/90"
                        onClick={() => handleSelectAlternative(alt)}
                      >
                        {alt.type === 'recipe' ? alt.title : alt.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {alternatives && alternatives.length === 0 && !isLoadingAlternatives && (
                 <p className="mt-3 text-sm text-center text-muted-foreground">No se encontraron alternativas.</p>
             )}
          </div>
          {/* Fin Sección de Alternativas */}

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}