import React, { useState, useEffect, useRef } from 'react'; // Añadir useRef
import { Button } from '../../components/ui/button'; // Ruta relativa
import { Input } from '../../components/ui/input'; // Ruta relativa
import { Label } from '../../components/ui/label'; // Ruta relativa
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'; // Ruta relativa
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../../components/ui/dialog'; // Ruta relativa
import { PantryItem, CreatePantryItemData, UpdatePantryItemData, Category, COMMON_PANTRY_UNITS } from './types';
import { suggestCategory } from './lib/categorySuggestor'; // Importar la función de sugerencia
import { useDebounce } from '../../hooks/useDebounce'; // Ruta relativa
// import { useForm, SubmitHandler } from 'react-hook-form'; // Podríamos usar react-hook-form
// import { zodResolver } from '@hookform/resolvers/zod'; // Para validación con Zod
// import * as z from 'zod';

interface AddPantryItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePantryItemData | UpdatePantryItemData, closeModal: boolean) => Promise<void>; // Añadir flag para cerrar modal
  itemToEdit?: PantryItem | null; // Para modo edición
  categories: Category[];
  // onSubmitAndAddAnother?: (data: CreatePantryItemData) => Promise<void>; // Opción alternativa, pero manejar en onSubmit es más simple
}

// TODO: Definir schema de validación con Zod si se usa react-hook-form
// const formSchema = z.object({ ... });

export function AddPantryItemForm({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
  categories,
}: AddPantryItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // TODO: Usar react-hook-form o manejar estado manualmente
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState(''); // Fase 2
  const [price, setPrice] = useState<number | ''>(''); // Fase 2
  const [notes, setNotes] = useState(''); // Fase 2
  const [minStock, setMinStock] = useState<number | ''>(''); // Fase 2
  const [targetStock, setTargetStock] = useState<number | ''>(''); // Fase 2
  const [tags, setTags] = useState(''); // Fase 2 - Input como string separado por comas
  const [categoryManuallySelected, setCategoryManuallySelected] = useState(false); // Mantener solo una declaración
  const itemNameInputRef = useRef<HTMLInputElement>(null); // Ref para enfocar input de nombre
  // const [categoryManuallySelected, setCategoryManuallySelected] = useState(false); // Eliminar duplicado

  const debouncedItemName = useDebounce(itemName, 400); // Debounce para sugerencia de categoría

  useEffect(() => {
    // Pre-rellenar formulario si estamos editando
    if (itemToEdit) {
      setItemName(itemToEdit.ingredient?.name || ''); // Usar el nuevo nombre de la relación
      setQuantity(itemToEdit.quantity ?? '');
      setUnit(itemToEdit.unit || '');
      setCategoryId(itemToEdit.category_id || '');
      setExpiryDate(itemToEdit.expiry_date || '');
      setLocation(itemToEdit.location || ''); // Fase 2
      setPrice(itemToEdit.price ?? ''); // Fase 2
      setNotes(itemToEdit.notes || ''); // Fase 2
      setMinStock(itemToEdit.min_stock ?? ''); // Fase 2
      setTargetStock(itemToEdit.target_stock ?? ''); // Fase 2
      setTags(itemToEdit.tags?.join(', ') || ''); // Convertir array a string
    } else {
      // Resetear formulario al abrir para añadir nuevo
      setItemName('');
      setQuantity('');
      setUnit(COMMON_PANTRY_UNITS[0] || ''); // Unidad por defecto
      setCategoryId('');
      setExpiryDate('');
      setLocation(''); // Fase 2
      setPrice(''); // Fase 2
      setNotes(''); // Fase 2
      setMinStock(''); // Fase 2
      setTargetStock(''); // Fase 2
      setTags(''); // Fase 2
      // Verificar si existe itemToEdit y su category_id
      setCategoryManuallySelected(itemToEdit ? !!itemToEdit.category_id : false);
      // No enfocar al editar
    }
  }, [itemToEdit, isOpen]); // Depender de isOpen para resetear al abrir

  // Función interna para manejar ambos botones de submit
  const handleFormSubmit = async (closeModalAfterSubmit: boolean) => {
    // event.preventDefault(); // No necesario si se llama desde onClick de los botones type="submit"
    setIsSubmitting(true);
    // TODO: Implementar validación más robusta (ej. con Zod)

    let formData: CreatePantryItemData | UpdatePantryItemData;

    const commonData = {
        quantity: quantity === '' ? null : Number(quantity),
        unit: unit || null,
        category_id: categoryId || null,
        expiry_date: expiryDate || null,
        location: location || null, // Fase 2
        price: price === '' ? null : Number(price), // Fase 2
        notes: notes || null, // Fase 2
        min_stock: minStock === '' ? null : Number(minStock), // Fase 2
        target_stock: targetStock === '' ? null : Number(targetStock), // Fase 2
        // Convertir string de tags a array, limpiando espacios y filtrando vacíos
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) || null, // Fase 2
    };

    if (itemToEdit) {
        // Modo Edición: Crear objeto UpdatePantryItemData (sin ingredient_name)
        formData = { ...commonData };
    } else {
        // Modo Creación: Crear objeto CreatePantryItemData
        if (!itemName.trim()) {
            // TODO: Mostrar error de validación al usuario
            console.error("El nombre del ingrediente es requerido.");
            setIsSubmitting(false);
            return;
        }
        formData = {
            ...commonData,
            ingredient_name: itemName.trim(),
        };
    }

    // Resetear flag de selección manual al cerrar
    if (!isOpen) {
        setCategoryManuallySelected(false);
    }

    // Resetear campos específicos para "Añadir Otro"
    const resetForAddAnother = () => {
        setItemName('');
        setQuantity('');
        // Mantener unidad y categoría? O resetear? Por ahora reseteamos cantidad y nombre.
        // setUnit(COMMON_PANTRY_UNITS[0] || '');
        // setCategoryId(''); // Mantener categoría?
        setExpiryDate('');
        setLocation(''); // Resetear ubicación? O mantener? Por ahora reseteamos.
        setPrice('');
        setNotes('');
        setMinStock('');
        setTargetStock('');
        setTags(''); // Resetear tags
        setCategoryManuallySelected(false); // Permitir nueva sugerencia
        itemNameInputRef.current?.focus(); // Enfocar para el siguiente item
    };

    try {
      await onSubmit(formData, closeModalAfterSubmit); // Pasar el flag
      if (closeModalAfterSubmit) {
         onClose(); // Cerrar modal si el envío es exitoso y se pidió cerrar
      } else {
         resetForAddAnother(); // Limpiar formulario para el siguiente item
      }
      // await onSubmit(formData); // Llamada original movida arriba
      // onClose(); // Cierre movido arriba
    } catch (error) {
      console.error("Error submitting pantry item:", error);
      // TODO: Mostrar mensaje de error al usuario
    } finally {
      setIsSubmitting(false);
    }
  };

  // Efecto para sugerir categoría basado en el nombre (debounced)
  useEffect(() => {
    // Solo sugerir si estamos creando un item nuevo Y el usuario no ha seleccionado categoría manualmente
    if (!itemToEdit && debouncedItemName && !categoryManuallySelected) {
      const suggestedId = suggestCategory(debouncedItemName); // Usar keywords por defecto por ahora
      if (suggestedId && suggestedId !== categoryId) {
        console.log(`Suggesting category ${suggestedId} for "${debouncedItemName}"`);
        setCategoryId(suggestedId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedItemName, itemToEdit, categoryManuallySelected]); // No incluir categoryId para evitar loop

  // Handler para cuando el usuario cambia la categoría manualmente
  const handleCategoryChange = (value: string) => {
      setCategoryId(value);
      setCategoryManuallySelected(true); // Marcar que el usuario intervino
  };

  // No renderizar nada si no está abierto
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{itemToEdit ? 'Editar Item' : 'Añadir Item a la Despensa'}</DialogTitle>
          {/* <DialogDescription>...</DialogDescription> */}
        </DialogHeader>
        <form /* onSubmit removido, se maneja en botones */ className="grid gap-4 py-4">
          {/* Nombre del Ingrediente (solo creación) */}
          {!itemToEdit && (
            <> {/* Abrir Fragmento */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemName" className="text-right">
                Nombre*
              </Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="col-span-3"
                required
                // TODO: Añadir autocompletado inteligente aquí
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Ubicación
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                placeholder="Ej: Nevera, Despensa..."
              />
            </div>
            {/* Precio (Fase 2) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Precio
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="col-span-3"
                placeholder="Opcional (ej: 1.50)"
                step="0.01"
              />
          </div>
          {/* Notas (Fase 2) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notas
            </Label>
            <Input // Podría ser Textarea si se esperan notas largas
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Opcional..."
            />
           </div>
           {/* Stock Mínimo (Fase 2) */}
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="minStock" className="text-right">
               Stock Mín.
             </Label>
             <Input
               id="minStock"
               type="number"
               value={minStock}
               onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
               className="col-span-3"
               placeholder="Opcional"
               step="any"
             />
           </div>
           {/* Stock Objetivo (Fase 2) */}
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="targetStock" className="text-right">
               Stock Obj.
             </Label>
             <Input
               id="targetStock"
               type="number"
               value={targetStock}
               onChange={(e) => setTargetStock(e.target.value === '' ? '' : Number(e.target.value))}
               className="col-span-3"
               placeholder="Opcional"
               step="any"
             />
           </div>
           {/* Tags (Fase 2) */}
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="tags" className="text-right">
               Etiquetas
             </Label>
             <Input
               id="tags"
               value={tags}
               onChange={(e) => setTags(e.target.value)}
               className="col-span-3"
               placeholder="Ej: sin gluten, vegano, oferta"
             />
             <p className="col-start-2 col-span-3 text-xs text-muted-foreground -mt-3">
               Separadas por comas.
             </p>
          </div>
          </>
          )} {/* Fin del bloque de creación de item */}
           {/* Mostrar nombre si se edita (no editable aquí) */}
           {itemToEdit && (
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right">Nombre</Label>
               <p className="col-span-3 font-medium">{itemToEdit.ingredient?.name || 'N/A'}</p>
             </div>
           )}

          {/* Cantidad */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Cantidad
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="col-span-3"
              placeholder="Ej: 1, 500, 0.5"
              step="any" // Permitir decimales
            />
          </div>

          {/* Unidad */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unidad
            </Label>
            {/* Usar Input con datalist para permitir unidades comunes y personalizadas */}
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="col-span-3"
              placeholder="Ej: kg, L, unidad, paquete"
              list="common-units" // Asociar con datalist
            />
            <datalist id="common-units">
                {COMMON_PANTRY_UNITS.map(u => (
                    <option key={u} value={u} />
                ))}
            </datalist>
            {/* <Select value={unit} onValueChange={setUnit}> ... </Select> */}
          </div>

          {/* Categoría */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoría {/* TODO: Marcar como sugerida si !categoryManuallySelected? */}
            </Label>
            <Select value={categoryId} onValueChange={handleCategoryChange}> {/* Usar nuevo handler */}
                 <SelectTrigger id="category" className="col-span-3">
                     <SelectValue placeholder="Selecciona categoría..." />
                 </SelectTrigger>
                 <SelectContent>
                     {categories.map(cat => (
                         <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                     ))}
                 </SelectContent>
             </Select>
          </div>

           {/* Fecha de Caducidad */}
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiryDate" className="text-right">
              Caducidad
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Fin del formulario */}
        </form>
        {/* Footer con botones */}
        <DialogFooter className="sm:justify-between gap-2">
           {/* Botón Cancelar */}
           <DialogClose asChild>
             <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
           </DialogClose>
           <div className="flex gap-2">
              {/* Botón Guardar y Añadir Otro (solo en modo creación) */}
              {!itemToEdit && (
                 <Button
                    type="button" // Cambiado a button para manejar submit manualmente
                    variant="secondary"
                    onClick={() => handleFormSubmit(false)} // No cerrar modal
                    disabled={isSubmitting}
                 >
                    {isSubmitting ? 'Guardando...' : 'Guardar y Añadir Otro'}
                 </Button>
              )}
              {/* Botón Guardar / Añadir */}
              <Button
                 type="button" // Cambiado a button para manejar submit manualmente
                 onClick={() => handleFormSubmit(true)} // Cerrar modal y usar handleFormSubmit
                 disabled={isSubmitting}
              >
                 {isSubmitting ? 'Guardando...' : (itemToEdit ? 'Guardar Cambios' : 'Añadir Item')}
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}