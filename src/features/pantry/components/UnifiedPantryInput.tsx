import React, { useState, useEffect } from 'react'; // Fusionar importaciones
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, ScanLine, Mic, MicOff } from 'lucide-react'; // Añadir iconos Mic
import { parsePantryInput, ParseResult } from '../lib/pantryParser';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import { InteractivePreview } from './InteractivePreview';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'; // Importar hook
import { AnimatePresence } from 'framer-motion'; // Para animación
// Importar tipos necesarios
import { CreatePantryItemData } from '../types';
import { addPantryItem } from '../pantryService'; // Importar servicio

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
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechIsSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();
  const [parseResultForPreview, setParseResultForPreview] = useState<ParseResult | null>(null);

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
        await addPantryItem(itemData); // Llamar al servicio
        toast.success(`"${itemData.ingredient_name}" añadido!`);
        setParseResultForPreview(null); // Cerrar preview
        if (addAnother) {
          setInputValue(''); // Limpiar input para el siguiente
          // Opcional: enfocar input de nuevo
        } else {
          setInputValue(''); // Limpiar input también al cerrar
        }
        onItemAdded(); // Notificar al padre
      } catch (error) {
         console.error("Error adding item from unified input:", error);
         toast.error(error instanceof Error ? error.message : "Error al añadir el ítem.");
         // No cerramos la preview en caso de error, para que el usuario pueda reintentar o editar
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

  // Efecto para actualizar el input cuando la transcripción finaliza
  useEffect(() => {
      if (!isListening && transcript) {
          setInputValue(transcript);
          // Opcional: Limpiar transcripción después de usarla?
      }
  }, [isListening, transcript]);

  // Efecto para mostrar errores de reconocimiento de voz
  useEffect(() => {
      if (speechError) {
          toast.error(speechError);
      }
  }, [speechError]);
// }; <<-- Comentario eliminado o mantenido, no afecta
// Eliminar la llave de cierre incorrecta de esta línea

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
          disabled={isLoading}
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
                disabled={isLoading}
                className="h-10 w-10"
                aria-label={isListening ? "Detener dictado" : "Iniciar dictado"}
             >
                 {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
             </Button>
         )}
        {/* </Button> // Eliminar esta etiqueta extra */}
         {/* Botón Añadir */}
        <Button
          onClick={handleParseAttempt}
          disabled={isLoading || !inputValue.trim() || !!parseResultForPreview}
          className="h-10"
          aria-label="Añadir ítem"
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <Plus className="h-4 w-4" /> // Mantener icono Plus
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