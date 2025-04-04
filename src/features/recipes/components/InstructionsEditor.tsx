// src/features/recipes/components/InstructionsEditor.tsx
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

interface InstructionsEditorProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  disabled?: boolean;
}

const InstructionsEditor: React.FC<InstructionsEditorProps> = ({ value = [], onChange, disabled = false }) => {
  const [internalSteps, setInternalSteps] = useState<string[]>(value);

  // Sincronizar estado interno si el valor externo cambia
  React.useEffect(() => {
    // Solo actualiza si el valor externo es realmente diferente para evitar bucles infinitos
    if (JSON.stringify(value) !== JSON.stringify(internalSteps)) {
        setInternalSteps(value);
    }
  }, [value]);

  const handleStepChange = useCallback((index: number, newValue: string) => {
    const updatedSteps = [...internalSteps];
    updatedSteps[index] = newValue;
    setInternalSteps(updatedSteps);
    onChange(updatedSteps);
  }, [internalSteps, onChange]);

  const addStep = useCallback(() => {
    // Si no hay pasos, inicializa con uno vacío. Si ya hay, añade uno nuevo vacío.
    const updatedSteps = internalSteps.length === 0 ? [''] : [...internalSteps, ''];
    setInternalSteps(updatedSteps);
    onChange(updatedSteps);
  }, [internalSteps, onChange]);

  const removeStep = useCallback((index: number) => {
    const updatedSteps = internalSteps.filter((_, i) => i !== index);
    setInternalSteps(updatedSteps);
    onChange(updatedSteps);
  }, [internalSteps, onChange]);

  // Si el valor inicial está vacío o nulo, asegúrate de que haya al menos un input vacío para empezar
  React.useEffect(() => {
    if (!value || value.length === 0) {
      setInternalSteps(['']);
    }
  }, []); // Solo se ejecuta al montar

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Instrucciones
      </label>
      {internalSteps.map((step, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span className="text-gray-500 dark:text-gray-400 font-medium w-6 text-right">{index + 1}.</span>
          <Input
            type="text"
            value={step}
            onChange={(e) => handleStepChange(index, e.target.value)}
            placeholder={`Paso ${index + 1}`}
            className="flex-grow"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeStep(index)}
            aria-label={`Eliminar paso ${index + 1}`}
            // Permitir eliminar incluso si es el último paso, para poder dejar las instrucciones vacías si se desea.
            disabled={disabled}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStep}
        disabled={disabled}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Añadir Paso
      </Button>
       {internalSteps.length === 0 && !disabled && (
         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Añade el primer paso de la receta.</p>
       )}
    </div>
  );
};

export default InstructionsEditor;