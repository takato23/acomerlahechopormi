import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Clock } from 'lucide-react';

interface TimePreferenceProps {
  currentTime: number | null | undefined;
  onUpdateTime: (time: number | null) => Promise<boolean>; 
}

export function TimePreference({ currentTime, onUpdateTime }: TimePreferenceProps) {
  const [timeInput, setTimeInput] = useState<string>(currentTime?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sincronizar input si la prop cambia externamente
  useEffect(() => {
    setTimeInput(currentTime?.toString() || '');
  }, [currentTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
    setError(null);
    setSuccess(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const timeValue = timeInput.trim() === '' ? null : parseInt(timeInput, 10);

    // Validar que sea un número positivo o null
    if (timeInput.trim() !== '' && (isNaN(timeValue!) || timeValue! <= 0)) {
      setError('Ingresa un número de minutos válido (mayor a 0).');
      setIsSaving(false);
      return;
    }

    const updateSuccessful = await onUpdateTime(timeValue);
    
    setIsSaving(false);
    if (updateSuccessful) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('No se pudo guardar la preferencia de tiempo.');
    }
  };

  // Comprobar si ha cambiado
  const hasChanged = timeInput !== (currentTime?.toString() || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Clock className="h-5 w-5 text-muted-foreground"/>
           Tiempo Máximo de Preparación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <Label htmlFor="max-prep-time">Tiempo máximo (en minutos)</Label>
          <Input 
            id="max-prep-time"
            type="number"
            value={timeInput}
            onChange={handleInputChange}
            placeholder="Ej: 30 (dejar vacío si no hay límite)"
            min="1" // Mínimo 1 minuto si se especifica
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Ayuda a filtrar recetas que se ajusten a tu tiempo disponible.
          </p>
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
          Guardar Tiempo
        </Button>
      </CardFooter>
    </Card>
  );
}