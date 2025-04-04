import React from 'react';
import { PantryItem } from '../types'; // Asegúrate que PantryItem esté definido correctamente en este path
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils'; // Asegúrate que cn esté disponible y configurado
import { differenceInDays, isPast, parseISO, isValid } from 'date-fns'; // Usando date-fns para manejo de fechas

interface PantryAccordionItemRowProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string | number) => void; // Ajusta el tipo de ID si es diferente (e.g., number)
}

const PantryAccordionItemRow: React.FC<PantryAccordionItemRowProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparar solo fechas

  let expiryDate: Date | null = null;
  let isExpired = false;
  let isNearExpiry = false;
  let daysUntilExpiry: number | null = null;
  let displayDate: string | null = null;

  if (item.expiry_date) {
    try {
      // Intentar parsear la fecha. Asumir formato ISO 8601 o un objeto Date.
      const parsedDate = typeof item.expiry_date === 'string' ? parseISO(item.expiry_date) : item.expiry_date;

      // Validar si la fecha parseada es válida
      if (parsedDate instanceof Date && isValid(parsedDate)) {
          expiryDate = new Date(parsedDate); // Crear nueva instancia para evitar mutaciones
          expiryDate.setHours(0, 0, 0, 0); // Normalizar a medianoche
          displayDate = expiryDate.toLocaleDateString(); // Formatear para mostrar

          isExpired = isPast(expiryDate);
          daysUntilExpiry = differenceInDays(expiryDate, today);
          // Considerar "near expiry" si faltan 3 días o menos y no está vencido
          isNearExpiry = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 3;
      } else {
          console.warn(`Invalid date format or value for item ${item.id}: ${item.expiry_date}`);
          // No establecer expiryDate si no es válida
      }
    } catch (error) {
        console.error(`Error processing date for item ${item.id}: ${item.expiry_date}`, error);
        // No establecer expiryDate en caso de error
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el clic se propague al contenedor padre (ej. acordeón)
    onEdit(item);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el clic se propague
    onDelete(item.id);
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/50 rounded-md transition-colors duration-150 ease-in-out group">
      {/* Left Content */}
      <div className="flex flex-col items-start flex-grow mr-2 overflow-hidden min-w-0"> {/* Añadido min-w-0 para correcto truncado */}
        <span className="text-sm font-medium truncate w-full" title={item.ingredient?.name ?? 'Ingrediente desconocido'}>
          {item.ingredient?.name ?? 'Ingrediente desconocido'}
        </span>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5"> {/* flex-wrap para fechas largas */}
          <span>
            {item.quantity} {item.unit}
          </span>
          {displayDate && (
            <span
              className={cn(
                'flex items-center gap-1 whitespace-nowrap', // Evitar salto de línea en fecha
                { 'text-destructive font-medium': isExpired },
                { 'text-yellow-600 dark:text-yellow-500 font-medium': isNearExpiry }
              )}
              title={`Vence: ${displayDate}${isExpired ? ' (Vencido)' : isNearExpiry ? ` (Vence en ${daysUntilExpiry} días)` : ''}`}
            >
              <CalendarClock className="h-3 w-3 flex-shrink-0" /> {/* Evitar que el icono se encoja */}
              {isExpired ? 'Vencido' : displayDate}
            </span>
          )}
        </div>
      </div>

      {/* Right Content - Actions */}
      {/* Mostrar botones en hover o foco para un look más limpio? Por ahora siempre visibles */}
      <div className="flex items-center flex-shrink-0 gap-1 ml-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleEditClick}
          aria-label={`Editar ${item.ingredient?.name ?? 'ítem'}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive/90"
          onClick={handleDeleteClick}
          aria-label={`Eliminar ${item.ingredient?.name ?? 'ítem'}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default PantryAccordionItemRow;