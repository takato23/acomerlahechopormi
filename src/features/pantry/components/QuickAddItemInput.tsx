import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { parsePantryInput } from '../lib/pantryParser';
import { suggestCategory } from '../lib/categorySuggestor'; // Corregir nombre de función importada
import { addPantryItem } from '../pantryService';
import { PantryItem, CreatePantryItemData } from '../types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import { PreviewAndConfirm } from './PreviewAndConfirm';
import { AnimatePresence } from 'framer-motion';

interface QuickAddItemInputProps {
  onItemAdded: () => void;
  // Nueva prop para manejar solicitudes de edición detallada
  onEditRequest?: (data: CreatePantryItemData) => void;
  // Opcional: Pasar las categorías disponibles para mostrar nombre en preview
  availableCategories?: Array<{ id: string; name: string }>;
}

export function QuickAddItemInput({
  onItemAdded,
  onEditRequest,
  availableCategories = [],
}: QuickAddItemInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parsePantryInput> | null>(null);
  const [lastAddedItem, setLastAddedItem] = useState<PantryItem | null>(null);

  const handleTryAdd = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const parsed = parsePantryInput(trimmedInput);

    // Verificar el éxito y acceder a 'data'
    if (!parsed || !parsed.success || !parsed.data.ingredientName) {
      toast.error('No se pudo entender la entrada. Intenta "Cantidad Unidad Nombre" o "Nombre Cantidad Unidad".');
      return;
    }

    // Sugerir categoría y guardar en preview
    // Usar la función importada correctamente
    // Asegurarse de que parsed sea exitoso antes de acceder a data
    const suggestedCategoryId = parsed.success ? suggestCategory(parsed.data.ingredientName) : null;
    setParsedPreview({
      ...parsed,
      // Añadir suggestedCategoryId solo al objeto 'data' si el parseo fue exitoso
      ...(parsed.success ? { data: { ...parsed.data, suggestedCategoryId } } : parsed)
    });
  };

  const handleConfirmAdd = async () => {
    if (!parsedPreview) return;

    setIsAdding(true);
    try {
      const itemData: CreatePantryItemData = {
        // Acceder a través de 'data' si parsedPreview es exitoso
        ingredient_name: parsedPreview.success ? parsedPreview.data.ingredientName : '', // Valor por defecto si no es exitoso
        quantity: parsedPreview.success ? parsedPreview.data.quantity : null,
        unit: parsedPreview.success ? parsedPreview.data.unit : null,
        category_id: parsedPreview.success ? parsedPreview.data.suggestedCategoryId : null,
      };

      const newItem = await addPantryItem(itemData);

      if (newItem) {
        toast.success(
          <div className="flex flex-col gap-1">
            {/* Corregir ingredients a ingredient y acceder a data */}
            <span>{`"${newItem.ingredient?.name ?? (parsedPreview.success ? parsedPreview.data.ingredientName : '')}" añadido.`}</span>
            {onEditRequest && (
              <button
                onClick={() => {
                  onEditRequest(itemData);
                  toast.dismiss();
                }}
                className="text-sm text-primary hover:underline text-left"
              >
                Editar detalles →
              </button>
            )}
          </div>,
          { duration: 5000 }
        );
        setLastAddedItem(newItem);
        setInputValue('');
        setParsedPreview(null);
        onItemAdded();
      } else {
        toast.error('Error al añadir el ítem.');
      }
    } catch (error) {
      console.error("Error adding pantry item via quick add:", error);
      toast.error(error instanceof Error ? error.message : 'Error desconocido al añadir ítem.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditDetails = () => {
    if (!parsedPreview || !onEditRequest) return;

    const itemData: CreatePantryItemData = {
      // Acceder a través de 'data' si parsedPreview es exitoso
      ingredient_name: parsedPreview.success ? parsedPreview.data.ingredientName : '',
      quantity: parsedPreview.success ? parsedPreview.data.quantity : null,
      unit: parsedPreview.success ? parsedPreview.data.unit : null,
      category_id: parsedPreview.success ? parsedPreview.data.suggestedCategoryId : null,
    };

    onEditRequest(itemData);
    setParsedPreview(null);
    setInputValue('');
  };

  const handleCancelPreview = () => {
    setParsedPreview(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (parsedPreview) {
        handleConfirmAdd();
      } else {
        handleTryAdd();
      }
    } else if (event.key === 'Escape' && parsedPreview) {
      handleCancelPreview();
    }
  };

  // Encontrar el nombre de la categoría sugerida si existe
  // Acceder a través de 'data' si parsedPreview es exitoso
  const suggestedCategoryId = parsedPreview?.success ? parsedPreview.data.suggestedCategoryId : null;
  const suggestedCategoryName = suggestedCategoryId
    ? availableCategories.find(cat => cat.id === suggestedCategoryId)?.name
    : null;

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Ej: 2 kg Harina, Leche 1 litro, 5 Manzanas..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAdding}
          className="h-10 flex-grow"
        />
        <Button
          onClick={parsedPreview ? handleConfirmAdd : handleTryAdd}
          disabled={isAdding || !inputValue.trim()}
          className="h-10"
        >
          {isAdding ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {parsedPreview ? 'Confirmar' : 'Añadir'}
        </Button>
      </div>

      <AnimatePresence>
        {parsedPreview && (
          <PreviewAndConfirm
            // Pasar parsedPreview.data si es exitoso, sino un objeto vacío o manejarlo en PreviewAndConfirm
            parsedData={parsedPreview.success ? parsedPreview.data : { quantity: null, unit: null, ingredientName: '' }}
            onConfirm={handleConfirmAdd}
            onEdit={handleEditDetails}
            onCancel={handleCancelPreview}
            isLoading={isAdding}
            suggestedCategoryName={suggestedCategoryName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}