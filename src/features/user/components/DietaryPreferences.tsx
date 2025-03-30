import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import type { DietaryPreference } from '../userTypes';

interface DietaryPreferencesProps {
  currentPreference: DietaryPreference | null | undefined;
  onUpdatePreference: (preference: DietaryPreference | null) => Promise<boolean>; // Devuelve si fue exitoso
}

const preferenceOptions: { value: DietaryPreference | 'none'; label: string }[] = [
  { value: 'none', label: 'Sin especificar' },
  { value: 'omnivore', label: 'Omnívoro' },
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
];

export function DietaryPreferences({ currentPreference, onUpdatePreference }: DietaryPreferencesProps) {
  const [selectedPref, setSelectedPref] = useState<string>(currentPreference || 'none');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectChange = (value: string) => {
    setSelectedPref(value);
    // Resetear mensajes al cambiar
    setError(null);
    setSuccess(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    const valueToSave = selectedPref === 'none' ? null : selectedPref as DietaryPreference;
    
    const updateSuccessful = await onUpdatePreference(valueToSave);
    
    setIsSaving(false);
    if (updateSuccessful) {
      setSuccess(true);
      // Opcional: resetear success después de un tiempo
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('No se pudo guardar la preferencia.');
    }
  };

  const hasChanged = selectedPref !== (currentPreference || 'none');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias Alimenticias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="dietary-preference">Tu dieta</Label>
          <Select 
            value={selectedPref} 
            onValueChange={handleSelectChange}
            disabled={isSaving}
          >
            <SelectTrigger id="dietary-preference">
              <SelectValue placeholder="Selecciona tu preferencia" />
            </SelectTrigger>
            <SelectContent>
              {preferenceOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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