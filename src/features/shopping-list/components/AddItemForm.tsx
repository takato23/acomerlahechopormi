import React, { useState } from 'react';
import { notifyError } from '@/lib/notifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseShoppingInput, ParsedShoppingInput } from '../lib/inputParser';

interface AddItemFormProps {
  onAddItem: (parsedItem: ParsedShoppingInput) => Promise<void> | void;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = value.trim();
    if (!trimmed) {
      notifyError('Escribí un ítem para agregar.');
      return;
    }

    const parsed = parseShoppingInput(trimmed);

    setIsSubmitting(true);
    try {
      await onAddItem(parsed);
      setValue('');
    } catch (error) {
      console.error('[AddItemForm] Error al añadir ítem:', error);
      notifyError('No pudimos agregar el ítem. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ej: 2 tomates maduros"
        aria-label="Nuevo ítem"
        disabled={isSubmitting}
      />
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Añadiendo…' : 'Agregar'}
      </Button>
    </form>
  );
}
