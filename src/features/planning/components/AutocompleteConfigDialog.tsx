import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { MealType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: {
    selectedDays: string[];
    selectedMealTypes: MealType[];
    usePreferences: boolean;
  }) => Promise<void>;
  isLoading: boolean;
}

const DIAS_SEMANA = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' }
];

const TIPOS_COMIDA: { id: MealType; label: string }[] = [
  { id: 'Desayuno', label: 'Desayuno' },
  { id: 'Almuerzo', label: 'Almuerzo' },
  { id: 'Merienda', label: 'Merienda' },
  { id: 'Cena', label: 'Cena' }
];

export const AutocompleteConfigDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(DIAS_SEMANA.map(d => d.id));
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>(['Cena']);
  const [usePreferences, setUsePreferences] = useState(true);

  const handleConfirm = async () => {
    if (selectedDays.length === 0) {
      return;
    }
    if (selectedMealTypes.length === 0) {
      return;
    }

    await onConfirm({
      selectedDays,
      selectedMealTypes,
      usePreferences
    });
  };

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(current =>
      current.includes(dayId)
        ? current.filter(d => d !== dayId)
        : [...current, dayId]
    );
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    setSelectedMealTypes(current =>
      current.includes(mealType)
        ? current.filter(t => t !== mealType)
        : [...current, mealType]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de Autocompletado</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Días de la Semana */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Días a completar</Label>
            <div className="grid grid-cols-2 gap-4">
              {DIAS_SEMANA.map(({ id, label }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${id}`}
                    checked={selectedDays.includes(id)}
                    onCheckedChange={() => handleDayToggle(id)}
                  />
                  <Label htmlFor={`day-${id}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tipos de Comida */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tipos de comida</Label>
            <div className="grid grid-cols-2 gap-4">
              {TIPOS_COMIDA.map(({ id, label }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`meal-${id}`}
                    checked={selectedMealTypes.includes(id)}
                    onCheckedChange={() => handleMealTypeToggle(id)}
                  />
                  <Label htmlFor={`meal-${id}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Usar Preferencias */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-preferences"
              checked={usePreferences}
              onCheckedChange={(checked) => setUsePreferences(!!checked)}
            />
            <Label htmlFor="use-preferences" className="text-sm">
              Usar preferencias del perfil (dieta, alergias)
            </Label>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedDays.length === 0 || selectedMealTypes.length === 0}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Generando...
              </>
            ) : (
              'Autocompletar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};