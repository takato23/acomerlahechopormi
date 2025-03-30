import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Usar RadioGroup
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import type { DifficultyPreference } from '../userTypes';

interface DifficultyPreferenceProps {
  currentPreference: DifficultyPreference | null | undefined;
  onUpdatePreference: (preference: DifficultyPreference | null) => Promise<boolean>; 
}

// Opciones y etiquetas
const difficultyOptions: { value: DifficultyPreference; label: string; description: string }[] = [
  { value: 'easy', label: 'Fácil', description: 'Recetas rápidas y sencillas.' },
  { value: 'medium', label: 'Medio', description: 'Recetas con algunos pasos más.' },
  { value: 'hard', label: 'Difícil', description: 'Recetas elaboradas o técnicas.' },
];

export function DifficultyPreference({ currentPreference, onUpdatePreference }: DifficultyPreferenceProps) {
  // Usar 'none' internamente si currentPreference es null/undefined
  const [selectedPref, setSelectedPref] = useState<string>(currentPreference || 'none');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleValueChange = (value: string) => {
    setSelectedPref(value);
    setError(null);
    setSuccess(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    // Convertir 'none' a null antes de guardar
    const valueToSave = selectedPref === 'none' ? null : selectedPref as DifficultyPreference;
    
    const updateSuccessful = await onUpdatePreference(valueToSave);
    
    setIsSaving(false);
    if (updateSuccessful) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('No se pudo guardar la preferencia.');
    }
  };

  // Comprobar si ha cambiado respecto al valor original (incluyendo null/undefined como 'none')
  const hasChanged = selectedPref !== (currentPreference || 'none');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencia de Dificultad</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedPref} 
          onValueChange={handleValueChange}
          disabled={isSaving}
          className="space-y-3"
        >
          {/* Opción para deseleccionar */}
          <div className="flex items-center space-x-2">
             <RadioGroupItem value="none" id="difficulty-none" />
             <Label htmlFor="difficulty-none" className="font-normal text-muted-foreground">
               Sin especificar
             </Label>
           </div>
           {/* Opciones de dificultad */}
          {difficultyOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`difficulty-${option.value}`} />
              <Label htmlFor={`difficulty-${option.value}`} className="font-normal">
                {option.label}
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Preferencia guardada.</p>}
        </div>
        <Button 
          onClick={handleSaveChanges} 
          disabled={!hasChanged || isSaving}
        >
          {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
          Guardar Cambios
        </Button>
      </CardFooter>
    </Card>
  );
}