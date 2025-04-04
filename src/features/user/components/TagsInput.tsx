import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label'; // Importar Label
import { cn } from '@/lib/utils'; // Para combinar clases

interface TagsInputProps {
  label: string;
  placeholder?: string;
  currentTags?: string[] | null;
  onUpdateTags: (newTags: string[]) => Promise<boolean>;
  className?: string; // Permitir clases adicionales
  id?: string; // Para asociar con Label
}

export function TagsInput({
  label,
  placeholder = "Añade tags...",
  currentTags,
  onUpdateTags,
  className,
  id = 'tags-input' // ID por defecto
}: TagsInputProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado interno con props cuando cambien externamente
  useEffect(() => {
    setTags(currentTags || []);
  }, [currentTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null); // Limpiar error al escribir
  };

  const addTag = useCallback(async (tagToAdd: string) => {
    const newTag = tagToAdd.trim();
    if (newTag && !tags.includes(newTag)) {
      const newTagsList = [...tags, newTag];
      setIsSaving(true);
      setError(null);
      try {
        const success = await onUpdateTags(newTagsList);
        if (success) {
          setTags(newTagsList); // Actualizar estado interno solo si la API tuvo éxito
          setInputValue(''); // Limpiar input
        } else {
          setError("Error al guardar el tag.");
        }
      } catch (err) {
        console.error("Error updating tags:", err);
        setError("Error inesperado al guardar.");
      } finally {
        setIsSaving(false);
      }
    } else if (tags.includes(newTag)) {
      setError(`"${newTag}" ya existe.`);
      setInputValue(''); // Limpiar input aunque exista
    } else {
      setInputValue(''); // Limpiar input si estaba vacío o solo espacios
    }
     // Devolver foco al input después de añadir/error
     inputRef.current?.focus();
  }, [tags, onUpdateTags]);

  const removeTag = useCallback(async (tagToRemove: string) => {
    const newTagsList = tags.filter(tag => tag !== tagToRemove);
    setIsSaving(true);
    setError(null);
    try {
      const success = await onUpdateTags(newTagsList);
      if (success) {
        setTags(newTagsList); // Actualizar estado interno
      } else {
        setError("Error al eliminar el tag.");
      }
    } catch (err) {
      console.error("Error removing tag:", err);
      setError("Error inesperado al eliminar.");
    } finally {
      setIsSaving(false);
    }
     // Devolver foco al input después de eliminar
     inputRef.current?.focus();
  }, [tags, onUpdateTags]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Evitar submit de formulario si existe
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Opcional: eliminar último tag con backspace si el input está vacío
      // removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
       <Label htmlFor={id} className="text-slate-700">{label}</Label>
      <div className="flex items-center space-x-2 p-2 border border-slate-300 rounded-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
        <div className="flex flex-wrap gap-1 flex-grow">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={isSaving}
                className="rounded-full hover:bg-slate-300 disabled:opacity-50"
                aria-label={`Eliminar ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Añadir más..."}
            disabled={isSaving}
            className="flex-1 border-none shadow-none focus-visible:ring-0 h-auto p-0 m-0 min-w-[80px]" // Estilo minimalista
          />
        </div>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
      </div>
       {error && <p className="text-sm text-destructive pt-1">{error}</p>}
    </div>
  );
}