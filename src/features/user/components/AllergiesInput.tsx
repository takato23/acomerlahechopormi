import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Usar Textarea
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { ShieldAlert } from 'lucide-react'; // Icono relevante

interface AllergiesInputProps {
  currentValue: string | null | undefined;
  onUpdateValue: (value: string | null) => Promise<boolean>; 
}

export function AllergiesInput({ currentValue, onUpdateValue }: AllergiesInputProps) {
  const [inputValue, setInputValue] = useState<string>(currentValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sincronizar input si la prop cambia externamente
  useEffect(() => {
    setInputValue(currentValue || '');
  }, [currentValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setError(null);
    setSuccess(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const valueToSave = inputValue.trim() === '' ? null : inputValue.trim();

    const updateSuccessful = await onUpdateValue(valueToSave);
    
    setIsSaving(false);
    if (updateSuccessful) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('No se pudo guardar la información.');
    }
  };

  // Comprobar si ha cambiado
  const hasChanged = inputValue !== (currentValue || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <ShieldAlert className="h-5 w-5 text-muted-foreground"/>
           Alergias y Restricciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <Label htmlFor="allergies-restrictions">Indica alergias o ingredientes a evitar</Label>
          <Textarea 
            id="allergies-restrictions"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ej: Alergia a los frutos secos, evitar cerdo, sin gluten..."
            rows={4} // Ajustar altura
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Esta información podría usarse en el futuro para filtrar recetas.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Información guardada.</p>}
        </div>
        <Button 
          onClick={handleSaveChanges} 
          disabled={!hasChanged || isSaving}
        >
          {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
          Guardar Información
        </Button>
      </CardFooter>
    </Card>
  );
}