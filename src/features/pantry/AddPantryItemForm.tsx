// src/features/pantry/AddPantryItemForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { PantryItem, CreatePantryItemData, UpdatePantryItemData, Ingredient, Category } from './types';
import { FormItemData } from './formTypes';
import { addPantryItem, updatePantryItem } from './pantryService';
import { getCategories } from '../shopping-list/services/categoryService';
import { parseShoppingInput, ParsedShoppingInput } from '../shopping-list/lib/inputParser'; // Importar parser
import { inferCategory } from '../shopping-list/lib/categoryInference'; // Importar inferencia
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IngredientCombobox } from './components/IngredientCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddPantryItemFormProps {
  itemToEdit?: FormItemData | null;
  onSave: (item: PantryItem) => void;
  onCancel: () => void;
  onError?: (message: string) => void; // Hacer opcional
}

export function AddPantryItemForm({
  itemToEdit,
  onSave,
  onCancel,
  onError, // Recibir prop opcional
}: AddPantryItemFormProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [rawInputText, setRawInputText] = useState<string>(''); // Estado para input crudo

  // Un ítem es existente si es de tipo PantryItem (tiene id)
  const isEditing = Boolean(itemToEdit && 'id' in itemToEdit);

  useEffect(() => {
    if (itemToEdit) {
      // Si es un ítem existente (tipo PantryItem)
      if ('id' in itemToEdit) {
        const item = itemToEdit as PantryItem;
        const initialIngredient: Ingredient = {
          id: item.ingredient_id,
          name: item.ingredients?.name ?? '',
          created_at: '',
        };
        setSelectedIngredient(initialIngredient);
        setQuantity(item.quantity?.toString() ?? '');
        setUnit(item.unit ?? '');
        setExpiryDate(item.expiry_date ?? '');
        // Usar ?? null para manejar undefined
        setSelectedCategoryId(item.category_id ?? null);
      }
      // Si son datos parciales (Quick Add)
      else {
        if (itemToEdit.ingredients?.name) {
          setSelectedIngredient({
            id: itemToEdit.ingredient_id ?? '--new--',
            name: itemToEdit.ingredients.name,
            created_at: '',
          });
        }
        setQuantity(itemToEdit.quantity?.toString() ?? '');
        setUnit(itemToEdit.unit ?? '');
        setSelectedCategoryId(itemToEdit.category_id ?? null);
      }
    } else {
      // Reset completo
      setSelectedIngredient(null);
      setQuantity('');
      setUnit('');
      setExpiryDate('');
      setSelectedCategoryId(null);
    }
  }, [itemToEdit]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories();
        setAvailableCategories(cats);
      } catch (err) {
        console.error("Error loading categories for form:", err);
      }
    }
    loadCategories();
  }, []);

  const handleIngredientSelect = useCallback((ingredient: Ingredient | null, isNew = false) => {
    setSelectedIngredient(ingredient);
    if (isNew && ingredient) {
      setRawInputText(ingredient.name); // Guardar input crudo si es nuevo
    } else {
      setRawInputText(''); // Limpiar si no es nuevo
      // Mantener la lógica de unidad por defecto si existe y el campo unit está vacío
      if (ingredient && !isNew && ingredient.default_unit && !unit) {
        setUnit(ingredient.default_unit);
      }
    }
  }, [unit]); // Dependencia solo de unit para la lógica de unidad por defecto

  // Efecto para parsear e inferir cuando cambia el input crudo
  useEffect(() => {
    if (!rawInputText) return;

    const processInput = async () => {
      const parsed = parseShoppingInput(rawInputText);
      const inferredCatId = await inferCategory(parsed.name);

      // Actualizar solo si los campos están vacíos
      if (!quantity && parsed.quantity !== null) {
        setQuantity(parsed.quantity.toString());
      }
      if (!unit && parsed.unit !== null) {
        setUnit(parsed.unit);
      }
      if (!selectedCategoryId && inferredCatId !== null) {
        setSelectedCategoryId(inferredCatId);
      }
      // Actualizar el nombre del ingrediente seleccionado por si el parser lo modificó (ej: capitalización)
      if (selectedIngredient && selectedIngredient.name !== parsed.name) {
           setSelectedIngredient(prev => prev ? { ...prev, name: parsed.name } : null);
      }
    };

    processInput();
    // Limpiar rawInputText después de procesar para evitar re-ejecuciones innecesarias
    // Opcional: podrías querer mantenerlo si el usuario sigue editando el nombre
    // setRawInputText('');

  }, [rawInputText, quantity, unit, selectedCategoryId, selectedIngredient]); // Dependencias relevantes

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    onError?.(''); // Llamar solo si existe

    const quantityValue = quantity.trim() === '' ? null : parseFloat(quantity);
    if (quantity.trim() !== '' && isNaN(quantityValue!)) {
      onError?.('La cantidad debe ser un número válido.'); // Llamar solo si existe
      setIsSaving(false);
      return;
    }

    if (!selectedIngredient?.name) {
      onError?.('Debes seleccionar o crear un ingrediente.'); // Llamar solo si existe
      setIsSaving(false);
      return;
    }

    const baseData = {
      quantity: quantityValue,
      unit: unit.trim() === '' ? null : unit.trim(),
      expiry_date: expiryDate || null,
      category_id: selectedCategoryId,
    };

    try {
      let savedItem: PantryItem | null = null;
      
      // Si estamos editando un ítem existente
      if (isEditing && itemToEdit && 'id' in itemToEdit) {
        const updateData: UpdatePantryItemData = baseData;
        savedItem = await updatePantryItem(itemToEdit.id, updateData);
      }
      // Si es nuevo (ya sea desde Quick Add o completamente nuevo)
      else {
        const createData: CreatePantryItemData = {
          ...baseData,
          ingredient_name: selectedIngredient.name,
        };
        savedItem = await addPantryItem(createData);
      }

      if (savedItem) {
        onSave(savedItem);
      } else {
        onError?.(`Error al ${isEditing ? 'actualizar' : 'añadir'} el item.`); // Llamar solo si existe
      }
    } catch (error) {
      console.error(`Error saving pantry item:`, error);
      onError?.(`Ocurrió un error al ${isEditing ? 'actualizar' : 'añadir'} el item.`); // Llamar solo si existe
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="ingredientCombobox">Ingrediente</Label>
        <IngredientCombobox
          selectedIngredient={selectedIngredient}
          onSelect={handleIngredientSelect}
          disabled={isSaving || isEditing}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ej: 100"
            disabled={isSaving}
            step="any"
          />
        </div>
        <div>
          <Label htmlFor="unit">Unidad</Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Ej: gr, ml, unidad"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select
            value={selectedCategoryId ?? undefined}
            onValueChange={(value) => setSelectedCategoryId(value === 'none' ? null : value)}
            disabled={isSaving}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Seleccionar categoría..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Sin Categoría --</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="expiryDate">Fecha Vencimiento</Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : (isEditing ? 'Actualizar Item' : 'Añadir Item')}
        </Button>
      </div>
    </form>
  );
}