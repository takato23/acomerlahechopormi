import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import UnifiedPantryInput from './UnifiedPantryInput';
import type { CreatePantryItemData, PantryItem, UpdatePantryItemData } from '../types';

export type PantryItemModalMode = 'create' | 'edit';

interface PantryItemModalProps {
  open: boolean;
  mode: PantryItemModalMode;
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (payload: CreatePantryItemData | UpdatePantryItemData) => Promise<void>;
  item?: PantryItem | null;
}

type FormState = {
  ingredientName: string;
  quantity: string;
  unit: string;
  categoryId: string;
  expiryDate: string;
  minStock: string;
  notes: string;
};

const defaultFormState: FormState = {
  ingredientName: '',
  quantity: '',
  unit: '',
  categoryId: '',
  expiryDate: '',
  minStock: '',
  notes: '',
};

const quantityToInput = (value: number | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? String(value) : '';

export const PantryItemModal: React.FC<PantryItemModalProps> = ({
  open,
  mode,
  categories,
  onClose,
  onSubmit,
  item,
}) => {
  const { user } = useAuth();
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormState(defaultFormState);
      setIsSubmitting(false);
      return;
    }

    if (mode === 'edit' && item) {
      setFormState({
        ingredientName: item.ingredient?.name || '',
        quantity: quantityToInput(item.quantity),
        unit: item.unit || '',
        categoryId: item.category_id || '',
        expiryDate: item.expiry_date ? item.expiry_date.split('T')[0] : '',
        minStock: quantityToInput(item.min_stock),
        notes: item.notes || '',
      });
    } else if (mode === 'create') {
      setFormState(defaultFormState);
    }
  }, [open, mode, item]);

  const categoryOptions = useMemo(() => categories ?? [], [categories]);

  const handleParsedData = (data: CreatePantryItemData) => {
    setFormState((prev) => ({
      ...prev,
      ingredientName: data.ingredient_name ?? prev.ingredientName,
      quantity: data.quantity !== undefined && data.quantity !== null ? String(data.quantity) : prev.quantity,
      unit: data.unit ?? prev.unit,
      categoryId: data.category_id ?? prev.categoryId,
      expiryDate: data.expiry_date ?? prev.expiryDate,
    }));
    toast.success('Datos parseados listos para editar.');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!formState.ingredientName.trim()) {
      toast.error('El nombre del ingrediente es obligatorio.');
      return;
    }

    if (mode === 'create' && !user) {
      toast.error('Debes iniciar sesión para añadir ítems.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const payload: CreatePantryItemData = {
          ingredient_name: formState.ingredientName.trim(),
          quantity: formState.quantity ? Number(formState.quantity) : 1,
          unit: formState.unit ? formState.unit : null,
          category_id: formState.categoryId || null,
          expiry_date: formState.expiryDate || null,
          notes: formState.notes ? formState.notes.trim() : null,
          min_stock: formState.minStock ? Number(formState.minStock) : null,
          user_id: user!.id,
        };
        await onSubmit(payload);
        toast.success('Ítem añadido correctamente.');
      } else if (mode === 'edit') {
        const payload: UpdatePantryItemData = {
          quantity: formState.quantity ? Number(formState.quantity) : null,
          unit: formState.unit ? formState.unit : null,
          category_id: formState.categoryId || null,
          expiry_date: formState.expiryDate || null,
          notes: formState.notes ? formState.notes.trim() : null,
          min_stock: formState.minStock ? Number(formState.minStock) : null,
        };
        await onSubmit(payload);
        toast.success('Cambios guardados.');
      }
      onClose();
    } catch (error) {
      console.error('[PantryItemModal] Error submitting pantry item:', error);
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error al guardar el ítem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'edit' ? 'Editar ítem de despensa' : 'Añadir ítem a la despensa';
  const description =
    mode === 'edit'
      ? 'Actualiza los detalles del producto seleccionado.'
      : 'Puedes usar la entrada rápida para autocompletar los campos o llenarlos manualmente.';

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === 'create' && (
          <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 sm:p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Usa el campo de entrada rápida para parsear frases como "2 litros de leche" y rellenar el formulario.
            </p>
            <UnifiedPantryInput
              mode="modal"
              onItemAdded={() => undefined}
              availableCategories={categoryOptions}
              onEditRequest={handleParsedData}
            />
          </div>
        )}

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pantry-modal-name">Nombre</Label>
            <Input
              id="pantry-modal-name"
              value={formState.ingredientName}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, ingredientName: event.target.value }))
              }
              placeholder="Ej: Tomates, harina, leche..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pantry-modal-quantity">Cantidad</Label>
              <Input
                id="pantry-modal-quantity"
                type="number"
                min={0}
                value={formState.quantity}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, quantity: event.target.value }))
                }
                placeholder="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pantry-modal-unit">Unidad</Label>
              <Input
                id="pantry-modal-unit"
                value={formState.unit}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, unit: event.target.value }))
                }
                placeholder="kg, L, unidades..."
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pantry-modal-category">Categoría</Label>
            <Select
              value={formState.categoryId || undefined}
              onValueChange={(value) => setFormState((prev) => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger id="pantry-modal-category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pantry-modal-expiry">Fecha de caducidad</Label>
              <Input
                id="pantry-modal-expiry"
                type="date"
                value={formState.expiryDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, expiryDate: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pantry-modal-min-stock">Stock mínimo</Label>
              <Input
                id="pantry-modal-min-stock"
                type="number"
                min={0}
                value={formState.minStock}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, minStock: event.target.value }))
                }
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pantry-modal-notes">Notas</Label>
            <Textarea
              id="pantry-modal-notes"
              value={formState.notes}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Información adicional, ubicación, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Añadir ítem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PantryItemModal;
