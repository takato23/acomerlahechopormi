import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { parsePantryInput, ParseResult } from '../lib/pantryParser';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import { InteractivePreview } from './InteractivePreview';
import { useDebounce } from '@/hooks/useDebounce';
import { CreatePantryItemData } from '../types';
import { addPantryItem } from '../pantryService';
import { suggestCategory } from '../lib/categorySuggestor';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth/AuthContext';

// Lazy load componentes pesados
const BarcodeScanner = lazy(() => import('./barcode/BarcodeScanner'));
// const VoiceInput = lazy(() => import('./voice/VoiceInput')); // Comentado para prueba
import VoiceInput from './voice/VoiceInput'; // Importación directa para prueba

interface UnifiedPantryInputProps {
  onItemAdded: () => void;
  availableCategories: Array<{ id: string; name: string }>;
  onEditRequest?: (data: CreatePantryItemData) => void;
}

const UnifiedPantryInput: React.FC<UnifiedPantryInputProps> = ({
  onItemAdded,
  availableCategories,
  onEditRequest,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [parseResultForPreview, setParseResultForPreview] = useState<ParseResult | null>(null);
  const debouncedTranscript = useDebounce('', 2000);
  const { user } = useAuth();

  // --- NUEVO LOG ---
  useEffect(() => {
    if (user) {
      console.log(`[UnifiedPantryInput] User ID from useAuth: ${user.id}`);
    } else {
      console.log(`[UnifiedPantryInput] User from useAuth is null/undefined.`);
    }
  }, [user]); // Ejecutar cuando user cambie

  const handleParseAttempt = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    setIsLoading(true);
       console.log(`[UnifiedPantryInput] Attempting to parse: "${trimmedInput}"`);
    setTimeout(() => {
      const result = parsePantryInput(trimmedInput);
       console.log('[UnifiedPantryInput] parsePantryInput result (manual):', result);
      setIsLoading(false);

      if (result.success) {
        console.log("Parsed Data:", result.data, "Fallback:", result.usedFallback);
        setParseResultForPreview(result);
        toast.info(`Parseado: ${result.data.quantity ?? '?'} ${result.data.unit ?? ''} ${result.data.ingredientName}`);
      } else {
        console.error("Parse Error:", result.error);
        setParseResultForPreview(null);
        let errorMessage = 'No se pudo entender la entrada.';
        if (result.error === 'empty_input') {
          errorMessage = 'Por favor, introduce un ítem.';
        }
        toast.error(errorMessage);
      }
    }, 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!parseResultForPreview) {
        handleParseAttempt();
      }
    } else if (event.key === 'Escape') {
      if (parseResultForPreview) {
        setParseResultForPreview(null);
      } else {
        setInputValue('');
      }
    }
  };

  const handleConfirmAdd = async (itemDataFromPreview: CreatePantryItemData, addAnother: boolean) => {
    if (!user) {
      toast.error("Error: Usuario no autenticado.");
      return;
    }

    setIsLoading(true);
    try {
      const itemDataWithUser: CreatePantryItemData = {
        ...itemDataFromPreview,
        user_id: user.id
      };

      await addPantryItem(itemDataWithUser);
      toast.success(`"${itemDataWithUser.ingredient_name}" añadido!`);
      setParseResultForPreview(null);
      setInputValue('');
      onItemAdded();
    } catch (error) {
      console.error("Error adding item from unified input:", error);
      const errorMessage = (error instanceof Error && error.message) 
         ? error.message 
         : (typeof error === 'object' && error !== null && 'message' in error) 
         ? String(error.message)
         : "Error al añadir el ítem.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDetailsRequest = (itemData: CreatePantryItemData) => {
    if (onEditRequest) {
      setParseResultForPreview(null);
      setInputValue('');
      onEditRequest(itemData);
    } else {
      toast.info("La edición detallada no está habilitada aquí.");
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    setInputValue(barcode);
  };

  const handleVoiceTranscript = async (text: string) => {
    if (!text || isLoading || parseResultForPreview || isProcessingVoice) {
      return;
    }
     if (!user) {
       toast.error("Error: Usuario no autenticado para procesar voz.");
       return;
     }

    try {
      setIsProcessingVoice(true);
      setInputValue(text);
      console.log(`[UnifiedPantryInput] Processing voice input: "${text}"`);

      const result = parsePantryInput(text);
      console.log('[UnifiedPantryInput] Parse result:', result);

      if (result.success) {
        console.log('[UnifiedPantryInput] Voice parse successful:', result.data);
        const parsedData = result.data;

        // 1. Intentar inferir la categoría
        let finalCategoryId: string | null = null; // Inicializar a null, ya que parsedData no tiene category_id
        try {
          // Usar ingredientName (camelCase) de parsedData
          const suggestedCategoryId = await suggestCategory(parsedData.ingredientName);
          if (suggestedCategoryId) {
            console.log(`[UnifiedPantryInput] Suggested category: ${suggestedCategoryId}`);
            finalCategoryId = suggestedCategoryId; // Asignar la categoría sugerida
          } else {
             console.log('[UnifiedPantryInput] No category suggestion found.');
          }
        } catch (suggestionError) {
          console.error('[UnifiedPantryInput] Error suggesting category:', suggestionError);
          // Continuar sin categoría si hay error
        }

        // 2. Preparar los datos finales INCLUYENDO user_id y corrigiendo quantity
        const itemToAdd: CreatePantryItemData = {
          ingredient_name: parsedData.ingredientName,
          quantity: parsedData.quantity ?? 1,
          unit: parsedData.unit,
          category_id: finalCategoryId,
          user_id: user.id
        };

        // 3. Llamar a addPantryItem directamente
        setIsLoading(true);
        try {
           await addPantryItem(itemToAdd);
           toast.success(`"${itemToAdd.ingredient_name}" añadido por voz!`);
           setParseResultForPreview(null);
           setInputValue('');
           onItemAdded();
        } catch (addError) {
           console.error("Error adding voice item directly:", addError);
           const errorMessage = (addError instanceof Error && addError.message) 
             ? addError.message 
             : (typeof addError === 'object' && addError !== null && 'message' in addError) 
             ? String(addError.message)
             : "Error al añadir el ítem por voz.";
           toast.error(errorMessage);
        } finally {
           setIsLoading(false);
        }

      } else {
        console.error("Voice Parse Error:", result.error);
        toast.error(`No se entendió: "${text}". Intenta de nuevo o edita manualmente.`);
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
      toast.error("Error al procesar la entrada de voz");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Ej: 2 kg Harina, Leche 1 litro, 5 Manzanas..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (parseResultForPreview) {
              setParseResultForPreview(null);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading || (isProcessingVoice)}
          readOnly={isProcessingVoice}
          className="h-10 flex-grow"
        />
        
        <Suspense fallback={<Button variant="outline" size="icon" disabled className="h-10 w-10"><Spinner size="sm" /></Button>}>
          <BarcodeScanner
            isLoading={isLoading}
            onBarcodeDetected={handleBarcodeDetected}
          />
        </Suspense>

        {/* <Suspense fallback={<Button variant="outline" size="icon" disabled className="h-10 w-10"><Spinner size="sm" /></Button>}> */}
          <VoiceInput
            isLoading={isLoading}
            isProcessingVoice={isProcessingVoice}
            onTranscriptReceived={handleVoiceTranscript}
          />
        {/* </Suspense> */}

        <Button
          onClick={handleParseAttempt}
          disabled={isLoading || isProcessingVoice || !inputValue.trim() || !!parseResultForPreview}
          className="h-10"
          aria-label="Añadir ítem manualmente"
        >
          {isLoading && !isProcessingVoice ? (
            <Spinner size="sm" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {parseResultForPreview?.success && (
          <InteractivePreview
            key={inputValue}
            initialData={parseResultForPreview.data}
            usedFallback={parseResultForPreview.usedFallback}
            availableCategories={availableCategories}
            onConfirm={handleConfirmAdd}
            onCancel={() => setParseResultForPreview(null)}
            onEditDetails={onEditRequest ? handleEditDetailsRequest : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedPantryInput;