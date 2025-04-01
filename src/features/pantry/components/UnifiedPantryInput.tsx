import React, { useState, useEffect, useCallback } from 'react'; // Añadir useCallback
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, ScanLine, Mic, MicOff, Loader2 } from 'lucide-react'; // Añadir Loader2
import { parsePantryInput, ParseResult, ParsedPantryInput } from '../lib/pantryParser'; // Importar ParsedPantryInput
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import { InteractivePreview } from './InteractivePreview';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useDebounce } from '@/hooks/useDebounce'; // Importar useDebounce
import { AnimatePresence } from 'framer-motion';
// Importar tipos necesarios
import { CreatePantryItemData } from '../types';
import { addPantryItem } from '../pantryService';

interface UnifiedPantryInputProps {
  onItemAdded: () => void; // Callback cuando un item se añade exitosamente
  availableCategories: Array<{ id: string; name: string }>;
  // Prop para manejar la solicitud de edición detallada (abrir form completo)
  onEditRequest?: (data: CreatePantryItemData) => void;
}

export function UnifiedPantryInput({
  onItemAdded,
  availableCategories,
  onEditRequest, // Añadir prop
}: UnifiedPantryInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false); // Estado para procesamiento de voz
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechIsSupported,
    startListening,
    stopListening,
    // Añadir resetTranscript si existe en el hook, si no, manejarlo manualmente
    // resetTranscript // Descomentar si existe
  } = useSpeechRecognition();
  const [parseResultForPreview, setParseResultForPreview] = useState<ParseResult | null>(null);
  const debouncedTranscript = useDebounce(transcript, 2000); // Debounce de 2 segundos

  const handleParseAttempt = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    setIsLoading(true);
    // Simular un pequeño delay para feedback visual si el parseo es muy rápido
    setTimeout(() => {
      const result = parsePantryInput(trimmedInput);
      setIsLoading(false);

      if (result.success) {
        console.log("Parsed Data:", result.data, "Fallback:", result.usedFallback);
        setParseResultForPreview(result);
        // Aquí mostraremos el componente InteractivePreview
        // Por ahora, solo logueamos
        toast.info(`Parseado: ${result.data.quantity ?? '?'} ${result.data.unit ?? ''} ${result.data.ingredientName}`);
      } else {
        console.error("Parse Error:", result.error);
        setParseResultForPreview(null); // Limpiar preview anterior si falla
        let errorMessage = 'No se pudo entender la entrada.';
        if (result.error === 'empty_input') {
          errorMessage = 'Por favor, introduce un ítem.';
        }
        toast.error(errorMessage);
      }
    }, 150); // Pequeño delay artificial
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Si la preview está abierta, Enter debería confirmar (lógica en InteractivePreview)
      // Si no, Enter intenta parsear
      if (!parseResultForPreview) {
         handleParseAttempt();
      }
    } else if (event.key === 'Escape') {
       // Si la preview está abierta, Escape debería cerrarla (lógica en InteractivePreview)
       // Si no, quizás limpiar el input?
       if (parseResultForPreview) {
           setParseResultForPreview(null); // Cerrar preview con Escape
       } else {
           setInputValue(''); // Limpiar input si no hay preview
       }
    }
  };

  // Función que se pasará a InteractivePreview para manejar la confirmación
  const handleConfirmAdd = async (itemData: CreatePantryItemData, addAnother: boolean) => {
      setIsLoading(true); // Usar el estado de carga del input unificado
   try {
     await addPantryItem(itemData);
     toast.success(`"${itemData.ingredient_name}" añadido!`);
     setParseResultForPreview(null);
     setInputValue(''); // Limpiar input siempre al confirmar
     onItemAdded();
     // Opcional: enfocar input si addAnother es true
     // if (addAnother) { document.getElementById('pantry-input')?.focus(); }
   } catch (error) {
     console.error("Error adding item from unified input:", error);
     toast.error(error instanceof Error ? error.message : "Error al añadir el ítem.");
     // Mantener preview abierta en caso de error
   } finally {
     setIsLoading(false);
   }
  };

  // Función que se pasará a InteractivePreview para manejar la solicitud de edición detallada
  const handleEditDetailsRequest = (itemData: CreatePantryItemData) => {
      if (onEditRequest) {
          setParseResultForPreview(null); // Cerrar preview
          setInputValue(''); // Limpiar input
          onEditRequest(itemData); // Llamar al callback del padre
      } else {
          // Si no hay handler para edición detallada, podríamos mostrar un mensaje
          toast.info("La edición detallada no está habilitada aquí.");
      }
  };

  const handleBarcodeDetected = (barcode: string) => {
      setInputValue(barcode); // Rellenar input con el código
      setIsScannerOpen(false); // Cerrar modal
      // Opcional: intentar parsear inmediatamente? Por ahora dejamos que el usuario pulse Añadir.
  };

  // Efecto para mostrar errores de reconocimiento de voz
  useEffect(() => {
    if (speechError) {
      toast.error(`Error de voz: ${speechError}`);
      setIsProcessingVoice(false); // Asegurar que no se quede procesando si hay error
    }
  }, [speechError]);

  // --- Inicio: Lógica de Auto-Submit por Voz con Debounce ---
  const handleAutoSubmitFromVoice = useCallback(async (text: string) => {
    if (!text || isListening || isLoading || parseResultForPreview) {
      // No procesar si no hay texto, si aún está escuchando,
      // si ya hay otra operación en curso, o si hay una preview manual abierta
      return;
    }

    // Mostrar el texto reconocido en el input ANTES de procesar
    setInputValue(text);
    console.log("Voice transcript set to input:", text); // Log para verificar

    setIsProcessingVoice(true); // Indicar inicio de procesamiento (visual, p.ej. spinner en Mic)
    // Quitar toast genérico de procesamiento, el usuario ve el texto y el spinner
    // toast.info("Procesando entrada de voz...");

    // Pequeño delay para que el usuario vea el texto y el estado se refleje en UI (input readOnly)
    await new Promise(resolve => setTimeout(resolve, 100));

    setIsLoading(true); // Indicar carga real (parseo + API call)
    console.log("Starting parsing and API call for:", text); // Log

    const result = parsePantryInput(text);
    console.log("Parsing result for voice input:", result); // Log para depurar "papas"

    if (result.success) {
      try {
        // Convertir ParsedPantryInput a CreatePantryItemData (asumiendo estructura similar)
        // Puede necesitar ajustes si los tipos difieren significativamente
        const itemData: CreatePantryItemData = {
          ingredient_name: result.data.ingredientName,
          quantity: result.data.quantity,
          unit: result.data.unit,
          // category_id se asignará por defecto o por lógica posterior si es necesario
        };
        await addPantryItem(itemData);
        toast.success(`"${result.data.ingredientName}" añadido por voz!`);
        setInputValue(''); // Limpiar input en éxito
        // resetTranscript?.(); // Limpiar transcripción si la función existe en el hook
        onItemAdded();
      } catch (error) {
        console.error("Error adding item from voice input:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al añadir el ítem por voz.";
        console.error("Error in addPantryItem from voice:", error); // Log detallado del error
        toast.error(`Error al añadir "${text}": ${errorMessage}`);
        // No es necesario setInputValue(text) aquí, ya se hizo al inicio de la función
      }
    } else {
      console.error("Voice Parse Error:", result.error);
      toast.error(`No se entendió: "${text}". Intenta de nuevo o edita manualmente.`);
      // No es necesario setInputValue(text) aquí, ya se hizo al inicio de la función
    }

    setIsLoading(false);
    setIsProcessingVoice(false); // Finalizar procesamiento de voz
  }, [isListening, isLoading, parseResultForPreview, onItemAdded]); // Quitar resetTranscript si no existe/usa

  useEffect(() => {
    // Solo intentar auto-submit si hay un transcript debounced, no estamos escuchando,
    // no hay otra carga en curso y no hay una preview manual abierta.
    if (debouncedTranscript && !isListening && !isLoading && !parseResultForPreview) {
      handleAutoSubmitFromVoice(debouncedTranscript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTranscript, isListening]); // Las dependencias originales son correctas para el trigger.
  // La lógica interna de handleAutoSubmitFromVoice ya verifica isLoading y parseResultForPreview.
  // --- Fin: Lógica de Auto-Submit por Voz con Debounce ---

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Ej: 2 kg Harina, Leche 1 litro, 5 Manzanas..."
          value={inputValue}
          onChange={(e) => {
              setInputValue(e.target.value);
              // Opcional: limpiar preview si el usuario sigue escribiendo?
              if (parseResultForPreview) {
                  setParseResultForPreview(null);
              }
          }}
          onKeyDown={handleKeyDown}
          // Deshabilitar si está escuchando o si está cargando (submit manual).
          // Hacerlo readOnly si está procesando voz (para ver el texto pero no editar).
          disabled={isListening || (isLoading && !isProcessingVoice)}
          readOnly={isProcessingVoice}
          className="h-10 flex-grow"
        />
         {/* Botón Escanear */}
         <Button
            variant="outline"
            size="icon"
            onClick={() => setIsScannerOpen(true)}
            disabled={isLoading}
            className="h-10 w-10"
            aria-label="Escanear código de barras"
         >
             <ScanLine className="h-4 w-4" />
         </Button>
          {/* Botón Dictar/Detener */}
         {speechIsSupported && (
             <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading} // No deshabilitar mientras escucha, solo durante carga general
                className={`h-10 w-10 ${isListening ? 'animate-pulse' : ''}`} // Añadir pulso al escuchar
                aria-label={isListening ? "Detener dictado" : "Iniciar dictado"}
             >
                {isListening
                   ? <MicOff className="h-4 w-4" />
                   : isProcessingVoice // Mostrar spinner si está procesando voz
                   ? <Loader2 className="h-4 w-4 animate-spin" />
                   : <Mic className="h-4 w-4" />}
             </Button>
         )}
        {/* </Button> // Eliminar esta etiqueta extra */}
         {/* Botón Añadir */}
        <Button
          onClick={handleParseAttempt}
          // Deshabilitar si está cargando, escuchando, procesando voz, input vacío o hay preview manual
          disabled={isLoading || isListening || isProcessingVoice || !inputValue.trim() || !!parseResultForPreview}
          className="h-10"
          aria-label="Añadir ítem manualmente"
        >
          {isLoading && !isProcessingVoice ? ( // Mostrar spinner solo si la carga NO es por voz
            <Spinner size="sm" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Renderizar InteractivePreview condicionalmente con animación */}
      <AnimatePresence>
        {parseResultForPreview?.success && (
          <InteractivePreview
            key={inputValue} // Usar key para forzar re-render si cambia el input original
            initialData={parseResultForPreview.data}
            usedFallback={parseResultForPreview.usedFallback}
            availableCategories={availableCategories}
            onConfirm={handleConfirmAdd} // Pasar la función de confirmación
            onCancel={() => setParseResultForPreview(null)} // Función para cancelar/cerrar
            onEditDetails={onEditRequest ? handleEditDetailsRequest : undefined} // Pasar handler de edición si existe
          />
        )}
      </AnimatePresence>

       {/* Modal del Escáner */}
       <BarcodeScannerModal
           isOpen={isScannerOpen}
           onClose={() => setIsScannerOpen(false)}
           onDetected={handleBarcodeDetected}
       />
   </div>
 ); // Esta es la correcta para el return
 // Eliminar el ); extra de esta línea
}