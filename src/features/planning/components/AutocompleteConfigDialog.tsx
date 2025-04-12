import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckedState } from '@radix-ui/react-checkbox'; // Importar CheckedState
import { Checkbox } from '@/components/ui/checkbox'; // Añadido Checkbox
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { MealType } from '@/features/planning/types';
import { type StyleModifier } from '@/features/recipes/generationService'; // Importar StyleModifier
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Importar Select
import { Input } from '@/components/ui/input'; // Importar Input

// Definir DayOfWeek localmente o usar string directamente. Usaremos string.
type DayOfWeek = string; // O simplemente usar string[] abajo

// Constantes para días y comidas
const ALL_DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const ALL_MEALS: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']; // Quitado 'Snack'

// Tipos
type AutocompleteMode = 'optimize-pantry' | 'flexible-suggestions';

export interface AutocompleteConfig {
  mode: AutocompleteMode;
  days: string[];
  meals: MealType[];
  styleModifier?: StyleModifier | null; // Añadir modificador de estilo opcional
  cocinaEspecificaValue?: string; // Añadir valor para cocina específica opcional
}

/**
 * Props for the AutocompleteConfigDialog component.
 */
interface AutocompleteConfigDialogProps {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Callback function when the dialog is closed. */
  onClose: () => void;
  /** Callback function when the confirm button is clicked. Passes the full configuration. */
  onConfirm: (config: AutocompleteConfig) => void; // Actualizado para pasar AutocompleteConfig
  /** Whether the confirmation action is currently processing. */
  isProcessing: boolean;
  /** Initial configuration to populate the dialog */
  initialConfig?: Partial<AutocompleteConfig>;
}

/**
 * A dialog component to configure the autocomplete mode for meal planning.
 * Allows the user to choose between optimizing based on pantry items or receiving flexible suggestions.
 */
export const AutocompleteConfigDialog: React.FC<AutocompleteConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  initialConfig = {},
}) => {
  const [selectedMode, setSelectedMode] = useState<AutocompleteMode>(initialConfig.mode ?? 'optimize-pantry');
  const [selectedDays, setSelectedDays] = useState<string[]>(initialConfig.days ?? [...ALL_DAYS]); // Usar string[]
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(initialConfig.meals ?? [...ALL_MEALS]);
  const [selectedStyleModifier, setSelectedStyleModifier] = useState<StyleModifier | null>(initialConfig.styleModifier ?? null);
  const [selectedCocinaValue, setSelectedCocinaValue] = useState<string>(initialConfig.cocinaEspecificaValue ?? '');
  // Debug: Log state changes
  useEffect(() => {
    console.log('State updated:', { selectedDays, selectedMeals });
  }, [selectedDays, selectedMeals]);

  // Reset state when dialog opens/closes or initialConfig changes
  // Reset state only when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log("Resetting state on dialog open"); // Log para confirmar
      setSelectedMode(initialConfig.mode ?? 'optimize-pantry');
      setSelectedDays(initialConfig.days ?? [...ALL_DAYS]);
      setSelectedMeals(initialConfig.meals ?? [...ALL_MEALS]);
      setSelectedStyleModifier(initialConfig.styleModifier ?? null); // Resetear estilo
      setSelectedCocinaValue(initialConfig.cocinaEspecificaValue ?? ''); // Resetear valor cocina
    }
  }, [isOpen]); // Depender SOLO de isOpen para el reset


  const handleDayChange = (dayId: string) => (checked: CheckedState) => {
    console.log('Checkbox change event (Day):', dayId, 'Checked:', checked); // DEBUG LOG
    const isChecked = checked === true;
    setSelectedDays(current => {
      console.log('handleDayChange - Current selected days:', current); // DEBUG LOG
      const newState = isChecked
        ? [...current, dayId]
        : current.filter(d => d !== dayId);
      console.log('handleDayChange - New selected days:', newState); // DEBUG LOG
      return newState;
    });
  };

  const handleMealChange = (mealType: MealType) => (checked: CheckedState) => {
    console.log('Checkbox change event (Meal):', mealType, 'Checked:', checked); // DEBUG LOG
    const isChecked = checked === true;
    setSelectedMeals(current => {
      console.log('handleMealChange - Current selected meals:', current); // DEBUG LOG
      const newState = isChecked
        ? [...current, mealType]
        : current.filter(m => m !== mealType);
      console.log('handleMealChange - New selected meals:', newState); // DEBUG LOG
      return newState;
    });
  };

  const handleSelectAllDays = (checked: CheckedState) => {
    setSelectedDays(checked === true ? [...ALL_DAYS] : []);
  };

  const handleSelectAllMeals = (checked: CheckedState) => {
    setSelectedMeals(checked === true ? [...ALL_MEALS] : []);
  };


  const handleConfirm = () => {
    const config: AutocompleteConfig = {
      mode: selectedMode,
      days: selectedDays,
      meals: selectedMeals,
      styleModifier: selectedStyleModifier, // Incluir modificador
      // Incluir valor solo si el modificador es 'cocina-especifica'
      cocinaEspecificaValue: selectedStyleModifier === 'cocina-especifica' ? selectedCocinaValue : undefined,
    };
    onConfirm(config);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Autocompletado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Mode Selection */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Modo de Autocompletado</Label>
            <RadioGroup
              value={selectedMode}
              onValueChange={(value) => setSelectedMode(value as AutocompleteMode)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="optimize-pantry" id="optimize-pantry" />
                <Label htmlFor="optimize-pantry">Optimizar Despensa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flexible-suggestions" id="flexible-suggestions" />
                <Label htmlFor="flexible-suggestions">Sugerencias Flexibles</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Day Selection */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Días a considerar</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="select-all-days"
                checked={selectedDays.length === ALL_DAYS.length}
                onCheckedChange={handleSelectAllDays} // Pasar handler directamente
                aria-label="Seleccionar todos los días"
              />
              <Label htmlFor="select-all-days" className="font-medium">Seleccionar Todos</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_DAYS.map((day) => { // Usar llaves {}
                // Comentario movido o eliminado si no es necesario
                return ( // Añadir return explícito
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={(checked) => {
                        console.log('Day checkbox clicked:', { day, checked });
                        if (checked === true) {
                          setSelectedDays(current => [...current, day]);
                        } else {
                          setSelectedDays(current => current.filter(d => d !== day));
                        }
                      }}
                      aria-labelledby={`day-label-${day}`}
                    />
                    <Label htmlFor={`day-${day}`} id={`day-label-${day}`} className="font-normal cursor-pointer">
                      {day}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meal Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Tipos de Comida a considerar</Label>
             <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="select-all-meals"
                checked={selectedMeals.length === ALL_MEALS.length}
                onCheckedChange={handleSelectAllMeals} // Pasar handler directamente
                aria-label="Seleccionar todos los tipos de comida"
              />
              <Label htmlFor="select-all-meals" className="font-medium">Seleccionar Todos</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_MEALS.map((meal) => { // Usar llaves {}
                 // Comentario movido o eliminado
                 return ( // Añadir return explícito
                   <div key={meal} className="flex items-center space-x-2">
                     <Checkbox
                       id={`meal-${meal}`}
                       checked={selectedMeals.includes(meal)}
                       onCheckedChange={(checked) => {
                         console.log('Meal checkbox clicked:', { meal, checked });
                         if (checked === true) {
                           setSelectedMeals(current => [...current, meal]);
                         } else {
                           setSelectedMeals(current => current.filter(m => m !== meal));
                         }
                       }}
                       aria-labelledby={`meal-label-${meal}`}
                     />
                     <Label htmlFor={`meal-${meal}`} id={`meal-label-${meal}`} className="font-normal cursor-pointer">
                       {meal}
                     </Label>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* Style Modifier Selection */}
        <div>
          <Label className="text-base font-semibold mb-2 block">Estilo de Receta (Opcional)</Label>
          <Select
             value={selectedStyleModifier ?? '_none'} // Usar '_none' para valor nulo/default
             onValueChange={(value) => {
                 const newModifier = value === '_none' ? null : value as StyleModifier;
                 setSelectedStyleModifier(newModifier);
                 // Limpiar valor de cocina si se cambia a otro estilo
                 if (newModifier !== 'cocina-especifica') {
                     setSelectedCocinaValue('');
                 }
             }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estilo por defecto..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Estilo por defecto</SelectItem>
              <SelectItem value="rapido">Rápido y Fácil</SelectItem>
              <SelectItem value="saludable">Saludable y Ligero</SelectItem>
              <SelectItem value="creativo">Creativo / Aventurero</SelectItem>
              <SelectItem value="cocina-especifica">Cocina Específica...</SelectItem>
            </SelectContent>
          </Select>

          {/* Input para Cocina Específica (condicional) */}
          {selectedStyleModifier === 'cocina-especifica' && (
             <div className="mt-2">
                 <Label htmlFor="cocina-especifica-value">Tipo de cocina</Label>
                 <Input
                     id="cocina-especifica-value"
                     value={selectedCocinaValue}
                     onChange={(e) => setSelectedCocinaValue(e.target.value)}
                     placeholder="Ej: Italiana, Mexicana, Asiática..."
                     className="mt-1"
                 />
             </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isProcessing}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
             type="button"
             onClick={handleConfirm}
             disabled={isProcessing || selectedDays.length === 0 || selectedMeals.length === 0} // Disable if no days or meals selected
           >
            {isProcessing ? <Spinner size="sm" className="mr-2" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};