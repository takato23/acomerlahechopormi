import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChefHat, ChevronDown, ChevronUp, Clock, FileText, Plus, Star, Timer, Utensils } from 'lucide-react';
import type { MealType } from '../types';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    date: string;
    mealType: MealType;
    name: string;
    mode: 'create' | 'edit';
    mealId?: string;
    prepTime?: number;
    cookTime?: number;
    difficulty?: 'Fácil' | 'Medio' | 'Difícil';
    notes?: string;
  }) => Promise<boolean> | boolean;
  defaultDate: Date;
  defaultMealType?: MealType;
  defaultName?: string;
  mode?: 'create' | 'edit';
  mealId?: string;
  prepTime?: number;
  cookTime?: number;
  difficulty?: 'Fácil' | 'Medio' | 'Difícil';
  notes?: string;
}

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

export function AddMealModal({
  isOpen,
  onClose,
  onConfirm,
  defaultDate,
  defaultMealType,
  defaultName,
  mode = 'create',
  mealId,
  prepTime: defaultPrepTime,
  cookTime: defaultCookTime,
  difficulty: defaultDifficulty,
  notes: defaultNotes,
}: AddMealModalProps) {
  const [date, setDate] = useState<string>(format(defaultDate, 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'Almuerzo');
  const [name, setName] = useState(defaultName ?? '');
  const [prepTime, setPrepTime] = useState<number | undefined>();
  const [cookTime, setCookTime] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Medio' | 'Difícil' | undefined>();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDate(format(defaultDate, 'yyyy-MM-dd'));
    setMealType(defaultMealType ?? 'Almuerzo');
    setName(defaultName ?? '');
    setPrepTime(defaultPrepTime);
    setCookTime(defaultCookTime);
    setDifficulty(defaultDifficulty);
    setNotes(defaultNotes ?? '');
    setShowAdvanced(
      Boolean(
        (defaultPrepTime ?? 0) ||
        (defaultCookTime ?? 0) ||
        defaultDifficulty ||
        (defaultNotes && defaultNotes.length > 0),
      ),
    );
    setShowValidation(false);
  }, [isOpen, defaultDate, defaultMealType, defaultName, mode, mealId, defaultPrepTime, defaultCookTime, defaultDifficulty, defaultNotes]);

  const reset = () => {
    setDate(format(defaultDate, 'yyyy-MM-dd'));
    setMealType(defaultMealType ?? 'Almuerzo');
    setName(defaultName ?? '');
    setPrepTime(defaultPrepTime);
    setCookTime(defaultCookTime);
    setDifficulty(defaultDifficulty);
    setNotes(defaultNotes ?? '');
    setIsSaving(false);
    setShowAdvanced(false);
    setShowValidation(false);
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      setShowValidation(true);
      return;
    }
    setIsSaving(true);
    try {
      const success = await onConfirm({
        date,
        mealType,
        name: name.trim(),
        mode,
        mealId,
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        difficulty: difficulty || undefined,
        notes: notes.trim() || undefined,
      });
      if (success) {
        onClose();
        reset();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      reset();
    }
  };

  const isEditMode = mode === 'edit';

  const getMealTypeIcon = (type: MealType) => {
    switch (type) {
      case 'Desayuno': return '🌅';
      case 'Almuerzo': return '☀️';
      case 'Merienda': return '🕐';
      case 'Cena': return '🌙';
      default: return '🍽️';
    }
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Fácil': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Difícil': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {isEditMode ? 'Editar comida' : 'Agregar comida'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditMode
              ? `Actualizá la comida para ${format(new Date(date), "EEEE d 'de' MMMM", { locale: es })}.`
              : `Registrá una comida para ${format(new Date(date), "EEEE d 'de' MMMM", { locale: es })}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meal-date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Fecha
              </Label>
              <Input
                id="meal-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-type" className="flex items-center gap-2 text-sm font-medium">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                Tipo de comida
              </Label>
              <Select value={mealType} onValueChange={(value: MealType) => setMealType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de comida" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="flex items-center gap-2">
                      <span>{getMealTypeIcon(type)}</span>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-name" className="flex items-center gap-2 text-sm font-medium">
              <ChefHat className="h-4 w-4 text-muted-foreground" />
              Nombre de la comida
            </Label>
            <Input
              id="meal-name"
              type="text"
              placeholder="Ej: Pasta bolognesa, Ensalada César…"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (showValidation) setShowValidation(false);
              }}
            />
            {showValidation && !name.trim() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                ⚠️ Ingresá un nombre antes de guardar.
              </p>
            )}
          </div>

          <div className="rounded-custom border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Detalles opcionales</span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                {showAdvanced ? (
                  <>
                    Ocultar
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Mostrar
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="prep-time" className="text-sm font-medium text-muted-foreground">
                      <Timer className="mr-1 inline h-4 w-4 text-muted-foreground" />
                      Preparación (min)
                    </Label>
                    <Input
                      id="prep-time"
                      type="number"
                      placeholder="15"
                      min="1"
                      max="300"
                      value={prepTime ?? ''}
                      onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cook-time" className="text-sm font-medium text-muted-foreground">
                      <Clock className="mr-1 inline h-4 w-4 text-muted-foreground" />
                      Cocción (min)
                    </Label>
                    <Input
                      id="cook-time"
                      type="number"
                      placeholder="30"
                      min="1"
                      max="600"
                      value={cookTime ?? ''}
                      onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium text-muted-foreground">
                      <Star className="mr-1 inline h-4 w-4 text-muted-foreground" />
                      Dificultad
                    </Label>
                    <Select
                      value={difficulty}
                      onValueChange={(value: 'Fácil' | 'Medio' | 'Difícil') => setDifficulty(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">
                          <Badge className={`text-xs ${getDifficultyColor('Fácil')}`}>Fácil</Badge>
                        </SelectItem>
                        <SelectItem value="Medio">
                          <Badge className={`text-xs ${getDifficultyColor('Medio')}`}>Medio</Badge>
                        </SelectItem>
                        <SelectItem value="Difícil">
                          <Badge className={`text-xs ${getDifficultyColor('Difícil')}`}>Difícil</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meal-notes" className="text-sm font-medium text-muted-foreground">
                    <FileText className="mr-1 inline h-4 w-4 text-muted-foreground" />
                    Notas adicionales
                  </Label>
                  <Textarea
                    id="meal-notes"
                    placeholder="Ingredientes especiales, sustituciones o recordatorios…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isEditMode ? 'Guardando cambios…' : 'Agregando…'}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {isEditMode ? 'Guardar cambios' : 'Agregar comida'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddMealModal;
