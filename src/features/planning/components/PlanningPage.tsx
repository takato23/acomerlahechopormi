import { useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { LoadTemplateDialog } from './LoadTemplateDialog';
import { AutocompleteConfigDialog } from './AutocompleteConfigDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/Spinner';
import { usePlanningStore } from '@/stores/planningStore';
import { ShoppingCart } from 'lucide-react';
import { ShoppingListDisplay } from './ShoppingListDisplay'; // Importar nuevo componente

export function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSaveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [isLoadTemplateOpen, setLoadTemplateOpen] = useState(false);
  const [isAutocompleteOpen, setAutocompleteOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
  const weekEnd = addDays(weekStart, 6); // Domingo

  const {
    plannedMeals,
    isLoading,
    error,
    isAutocompleting,
    handleAutocompleteWeek,
    calculateShoppingListForWeek, // Importar acción
    isCalculatingShoppingList // Importar estado de carga
  } = usePlanningStore();

  const handlePreviousWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  // Formatea la fecha para mostrar el rango de la semana
  const weekRangeText = `${format(weekStart, 'PPP', { locale: es })} - ${format(weekEnd, 'PPP', { locale: es })}`;

  return (
    <div className="container py-6 space-y-6">
      {/* Encabezado con navegación y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousWeek}>&lt;</Button>
          <h2 className="text-lg font-semibold">{weekRangeText}</h2>
          <Button variant="outline" onClick={handleNextWeek}>&gt;</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setLoadTemplateOpen(true)}
          >
            Cargar Plantilla
          </Button>
          <Button
            variant="outline"
            onClick={() => setSaveTemplateOpen(true)}
          >
            Guardar como Plantilla
          </Button>
          <Button
            variant="outline"
            onClick={() => setAutocompleteOpen(true)}
          >
            Autocompletar
          </Button>
          <Button
            variant="default" // O el variant que prefieras
            onClick={() => calculateShoppingListForWeek(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'))}
            disabled={isCalculatingShoppingList || isLoading} // Deshabilitar si está cargando comidas o lista
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isCalculatingShoppingList ? 'Generando...' : 'Lista de Compras'}
          </Button>
        </div>
      </div>

      {/* Contenido principal: Grilla de la semana */}
      <div className="relative min-h-[500px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[500px]">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            {error}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            {/* Aquí va la grilla de planificación semanal */}
            {/* Implementar la vista de la semana con las comidas planificadas */}
          </ScrollArea>
        )}
      </div>

      {/* Mostrar la lista de compras generada */}
      <ShoppingListDisplay />

      {/* Diálogos */}
      <SaveTemplateDialog
        isOpen={isSaveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
      />

      <LoadTemplateDialog
        isOpen={isLoadTemplateOpen}
        onClose={() => setLoadTemplateOpen(false)}
        weekStartDate={format(weekStart, 'yyyy-MM-dd')}
      />

      <AutocompleteConfigDialog
        isOpen={isAutocompleteOpen}
        onClose={() => setAutocompleteOpen(false)}
        onConfirm={(config) => handleAutocompleteWeek(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'), config)}
        isProcessing={isAutocompleting} // Renombrar prop a isProcessing
      />
    </div>
  );
}