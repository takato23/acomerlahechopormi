import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ParsedPantryInput } from '../lib/pantryParser';
import { suggestCategory } from '../lib/categorySuggestor';
import { CreatePantryItemData } from '../types';
import { notifyError } from '@/lib/notifications';
import { Spinner } from '@/components/ui/Spinner';
import { X, Edit3, Check, ChevronsUpDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface InteractivePreviewProps {
  initialData: ParsedPantryInput;
  usedFallback?: boolean; // Para indicar si se usó el parseo por defecto
  availableCategories: Array<{ id: string; name: string }>;
  onConfirm: (itemData: CreatePantryItemData, addAnother: boolean) => Promise<void>; // Callback al confirmar (con flag para añadir otro)
  onCancel: () => void; // Callback al cancelar
  onEditDetails?: (itemData: CreatePantryItemData) => void; // Opcional: para abrir form completo
}

export function InteractivePreview({
  initialData,
  usedFallback = false,
  availableCategories,
  onConfirm,
  onCancel,
  onEditDetails,
}: InteractivePreviewProps) {
  const [itemData, setItemData] = useState<ParsedPantryInput>(initialData);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [price, setPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [targetStock, setTargetStock] = useState<number | ''>('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    setItemData(initialData);
    setSelectedCategoryId(initialData.suggestedCategoryId ?? null);
    setExpiryDate('');
    setLocation('');
    setPrice('');
    setNotes('');
    setMinStock('');
    setTargetStock('');
    setTags('');
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestedCategory = async () => {
      try {
        const suggestedId = await suggestCategory(itemData.ingredientName);
        if (isMounted && suggestedId) {
          setSelectedCategoryId(prev => prev ?? suggestedId);
          setItemData(prev => ({ ...prev, suggestedCategoryId: suggestedId }));
        }
      } catch (error) {
        console.error('Error al sugerir categoría:', error);
      }
    };

    fetchSuggestedCategory();
    return () => {
      isMounted = false;
    };
  }, [itemData.ingredientName]);

  const parseTagsInput = (input: string) => {
    const parsed = input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    return parsed.length > 0 ? parsed : undefined;
  };

  const handleConfirm = async (addAnother: boolean) => {
    setIsSubmitting(true);

    const finalData: CreatePantryItemData = {
      ingredient_name: itemData.ingredientName.toLowerCase(), // Normalizar a minúsculas
      quantity: itemData.quantity ?? 1,
      unit: itemData.unit ?? 'u',
      category_id: selectedCategoryId, // Usar la categoría seleccionada o sugerida
      expiry_date: expiryDate || null,
      location: location || null,
      price: price === '' ? null : Number(price),
      notes: notes || null,
      min_stock: minStock === '' ? null : Number(minStock),
      target_stock: targetStock === '' ? null : Number(targetStock),
      tags: parseTagsInput(tags),
    };

    try {
      await onConfirm(finalData, addAnother); // Llamar al callback del padre
      // El padre (UnifiedPantryInput) se encargará de limpiar su estado si addAnother es false
    } catch (error) {
      // El error ya debería manejarse en onConfirm, pero podemos añadir un fallback
      console.error("Error confirming item from preview:", error);
      notifyError('No pudimos confirmar el ítem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (onEditDetails) {
      const dataForEdit: CreatePantryItemData = {
        ingredient_name: itemData.ingredientName,
        quantity: itemData.quantity,
        unit: itemData.unit,
        category_id: selectedCategoryId,
        expiry_date: expiryDate || null,
        location: location || null,
        price: price === '' ? null : Number(price),
        notes: notes || null,
        min_stock: minStock === '' ? null : Number(minStock),
        target_stock: targetStock === '' ? null : Number(targetStock),
        tags: parseTagsInput(tags),
      };
      onEditDetails(dataForEdit);
    }
  };

  const suggestedCategoryName = selectedCategoryId
    ? availableCategories.find(cat => cat.id === selectedCategoryId)?.name
    : 'Sugerir...';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-2 p-4 border rounded-md shadow-sm bg-card text-card-foreground"
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold">Confirmar Ítem</h4>
        <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Cancelar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Datos Parseados */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <p className="font-medium truncate" title={itemData.ingredientName}>{itemData.ingredientName}</p>
          {usedFallback && <p className="text-xs text-amber-600">(Nombre inferido)</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Cantidad</Label>
          <p className="font-medium">{itemData.quantity ?? '-'}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Unidad</Label>
          <p className="font-medium">{itemData.unit ?? '-'}</p>
        </div>
      </div>

      {/* Categoría Sugerida/Seleccionada */}
      <div className="mb-3">
        <Label htmlFor="preview-category" className="text-xs text-muted-foreground">Categoría</Label>
        <Select
            value={selectedCategoryId ?? undefined} // Usar undefined en lugar de '' para el placeholder
            onValueChange={(value) => setSelectedCategoryId(value)}
            disabled={isSubmitting}
        >
            <SelectTrigger id="preview-category" className="h-9">
                <SelectValue placeholder="Selecciona categoría..." />
            </SelectTrigger>
            <SelectContent>
                {availableCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
                 {/* Eliminar opción deshabilitada con valor "", el placeholder del trigger es suficiente */}
            </SelectContent>
        </Select>
         {itemData.suggestedCategoryId && selectedCategoryId === itemData.suggestedCategoryId && (
             <p className="text-xs text-muted-foreground mt-1">(Sugerida)</p>
         )}
      </div>

      {/* Detalles Opcionales */}
      <Accordion type="single" collapsible value={detailsOpen ? "details" : ""} onValueChange={(value) => setDetailsOpen(value === "details")}>
        <AccordionItem value="details" className="border-b-0">
          <AccordionTrigger className="text-sm py-2 hover:no-underline">
            <span className="flex items-center gap-1">
              <ChevronsUpDown className="h-3 w-3" /> Añadir Detalles (Opcional)
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="grid gap-2">
              <div>
                <Label htmlFor="preview-expiry" className="text-xs text-muted-foreground">Fecha de Caducidad</Label>
                <Input
                  id="preview-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9"
                />
              </div>
              {/* Campo Ubicación */}
              <div>
                <Label htmlFor="preview-location" className="text-xs text-muted-foreground">Ubicación</Label>
                <Input
                  id="preview-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Nevera, Despensa..."
                  disabled={isSubmitting}
                  className="h-9"
                />
              </div>
              {/* Campo Precio */}
              <div>
                <Label htmlFor="preview-price" className="text-xs text-muted-foreground">Precio</Label>
                <Input
                  id="preview-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej: 1.50"
                  step="0.01"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="preview-notes" className="text-xs text-muted-foreground">Notas</Label>
                <Textarea
                  id="preview-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega observaciones..."
                  disabled={isSubmitting}
                  className="min-h-[72px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="preview-min-stock" className="text-xs text-muted-foreground">Stock mín.</Label>
                  <Input
                    id="preview-min-stock"
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Opcional"
                    step="any"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="preview-target-stock" className="text-xs text-muted-foreground">Stock obj.</Label>
                  <Input
                    id="preview-target-stock"
                    type="number"
                    value={targetStock}
                    onChange={(e) => setTargetStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Opcional"
                    step="any"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="preview-tags" className="text-xs text-muted-foreground">Etiquetas</Label>
                <Input
                  id="preview-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ej: sin gluten, oferta"
                  disabled={isSubmitting}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Separa por comas para añadir múltiples etiquetas.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Acciones */}
      <div className="flex justify-between items-center mt-4 gap-2 flex-wrap">
         {onEditDetails && (
             <Button variant="outline" size="sm" onClick={handleEdit} disabled={isSubmitting} className="flex-grow sm:flex-grow-0">
                 <Edit3 className="h-4 w-4 mr-1" /> Editar Detalles
             </Button>
         )}
         <div className="flex gap-2 flex-grow justify-end">
             <Button variant="secondary" size="sm" onClick={() => handleConfirm(true)} disabled={isSubmitting}>
                 {isSubmitting ? <Spinner size="sm" className="mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                 Confirmar y Añadir Otro
             </Button>
             <Button size="sm" onClick={() => handleConfirm(false)} disabled={isSubmitting}>
                 {isSubmitting ? <Spinner size="sm" className="mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                 Confirmar
             </Button>
         </div>
      </div>
    </motion.div>
  );
}
