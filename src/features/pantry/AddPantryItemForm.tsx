import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PantryItem, CreatePantryItemData, UpdatePantryItemData, Category, COMMON_PANTRY_UNITS } from './types';
import { suggestCategory } from './lib/categorySuggestor';
import { useDebounce } from '@/hooks/useDebounce';

interface AddPantryItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePantryItemData | UpdatePantryItemData, closeModal: boolean) => Promise<void>;
  itemToEdit?: PantryItem | null | undefined;
  categories: Category[];
  initialData?: CreatePantryItemData | null;
}

const AddPantryItemForm: React.FC<AddPantryItemFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
  categories,
  initialData = null,
}) => {
  // Estados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [targetStock, setTargetStock] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [categoryManuallySelected, setCategoryManuallySelected] = useState(false);
  const itemNameInputRef = useRef<HTMLInputElement>(null);

  const normalizeTagsInput = (input: string) => {
    const parsed = input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    return parsed.length > 0 ? parsed : undefined;
  };

  const debouncedItemName = useDebounce(itemName, 400);

  // Efectos
  useEffect(() => {
    if (itemToEdit) {
      setItemName(itemToEdit.ingredient?.name || '');
      setQuantity(itemToEdit.quantity ?? '');
      setUnit(itemToEdit.unit || '');
      setCategoryId(itemToEdit.category_id || '');
      setExpiryDate(itemToEdit.expiry_date || '');
      setLocation(itemToEdit.location || '');
      setPrice(itemToEdit.price ?? '');
      setNotes(itemToEdit.notes || '');
      setMinStock(itemToEdit.min_stock ?? '');
      setTargetStock(itemToEdit.target_stock ?? '');
      setTags(itemToEdit.tags?.join(', ') || '');
      setCategoryManuallySelected(Boolean(itemToEdit.category_id));
    } else if (initialData) {
      setItemName(initialData.ingredient_name ?? '');
      setQuantity(initialData.quantity ?? '');
      setUnit(initialData.unit || COMMON_PANTRY_UNITS[0] || '');
      setCategoryId(initialData.category_id || '');
      setExpiryDate(initialData.expiry_date || '');
      setLocation(initialData.location || '');
      setPrice(initialData.price ?? '');
      setNotes(initialData.notes || '');
      setMinStock(initialData.min_stock ?? '');
      setTargetStock(initialData.target_stock ?? '');
      setTags(initialData.tags?.join(', ') || '');
      setCategoryManuallySelected(Boolean(initialData.category_id));
    } else {
      setItemName('');
      setQuantity('');
      setUnit(COMMON_PANTRY_UNITS[0] || '');
      setCategoryId('');
      setExpiryDate('');
      setLocation('');
      setPrice('');
      setNotes('');
      setMinStock('');
      setTargetStock('');
      setTags('');
      setCategoryManuallySelected(false);
    }
  }, [itemToEdit, isOpen, initialData]);

  useEffect(() => {
    if (!itemToEdit && debouncedItemName && !categoryManuallySelected) {
      let isActive = true;
      suggestCategory(debouncedItemName).then((suggestedId) => {
        if (isActive && suggestedId && suggestedId !== categoryId) {
          setCategoryId(suggestedId);
        }
      });
      return () => {
        isActive = false;
      };
    }
  }, [debouncedItemName, itemToEdit, categoryManuallySelected, categoryId]);

  // Handlers
  const handleFormSubmit = async (closeModalAfterSubmit: boolean) => {
    setIsSubmitting(true);

    let formData: CreatePantryItemData | UpdatePantryItemData;

    const commonData = {
      quantity: quantity === '' ? null : Number(quantity),
      unit: unit || null,
      category_id: categoryId || null,
      expiry_date: expiryDate || null,
      location: location || null,
      price: price === '' ? null : Number(price),
      notes: notes || null,
      min_stock: minStock === '' ? null : Number(minStock),
      target_stock: targetStock === '' ? null : Number(targetStock),
      tags: normalizeTagsInput(tags),
    };

    if (itemToEdit) {
      formData = { ...commonData };
    } else {
      if (!itemName.trim()) {
        console.error("El nombre del ingrediente es requerido.");
        setIsSubmitting(false);
        return;
      }
      formData = {
        ...commonData,
        ingredient_name: itemName.trim(),
      };
    }

    if (!isOpen) {
      setCategoryManuallySelected(false);
    }

    const resetForAddAnother = () => {
      setItemName('');
      setQuantity('');
      setUnit(COMMON_PANTRY_UNITS[0] || '');
      setCategoryId('');
      setExpiryDate('');
      setLocation('');
      setPrice('');
      setNotes('');
      setMinStock('');
      setTargetStock('');
      setTags('');
      setCategoryManuallySelected(false);
      itemNameInputRef.current?.focus();
    };

    try {
      await onSubmit(formData, closeModalAfterSubmit);
      if (closeModalAfterSubmit) {
        onClose();
      } else {
        resetForAddAnother();
      }
    } catch (error) {
      console.error("Error submitting pantry item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setCategoryManuallySelected(true);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{itemToEdit ? 'Editar Item' : 'Añadir Item a la Despensa'}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4 py-4">
          {!itemToEdit ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemName" className="text-right text-slate-700">
                Nombre*
              </Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                required
                ref={itemNameInputRef}
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-slate-700">Nombre</Label>
              <p className="col-span-3 font-medium">{itemToEdit.ingredient?.name || 'N/A'}</p>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right text-slate-700">
              Ubicación
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: Nevera, Despensa..."
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right text-slate-700">
              Precio
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Opcional (ej: 1.50)"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right text-slate-700">
              Notas
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Opcional..."
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStock" className="text-right text-slate-700">
              Stock mín.
            </Label>
            <Input
              id="minStock"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Opcional"
              step="any"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetStock" className="text-right text-slate-700">
              Stock obj.
            </Label>
            <Input
              id="targetStock"
              type="number"
              value={targetStock}
              onChange={(e) => setTargetStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Opcional"
              step="any"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right text-slate-700">
              Etiquetas
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: sin gluten, oferta"
              />
              <p className="text-xs text-muted-foreground">
                Separa por comas. Guardaremos cada etiqueta por separado.
              </p>
            </div>
          </div>

 23 lines left untouched

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right text-slate-700">
              Cantidad
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 1, 500, 0.5"
              step="any"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right text-slate-700">
              Unidad
            </Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: kg, L, unidad, paquete"
              list="common-units"
            />
            <datalist id="common-units">
              {COMMON_PANTRY_UNITS.map(u => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right text-slate-700">
              Categoría
            </Label>
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category" className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500">
                <SelectValue placeholder="Selecciona categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiryDate" className="text-right text-slate-700">
              Caducidad
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="col-span-3 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </form>

        <DialogFooter className="sm:justify-between gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
          </DialogClose>
          <div className="flex gap-2">
            {!itemToEdit && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleFormSubmit(false)}
                disabled={isSubmitting}
                className="bg-slate-100 text-slate-900 hover:bg-slate-200"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar y Añadir Otro'}
              </Button>
            )}
            <Button
              type="button"
              onClick={() => handleFormSubmit(true)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? 'Guardando...' : (itemToEdit ? 'Guardar Cambios' : 'Añadir Item')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPantryItemForm;
