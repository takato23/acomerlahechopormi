import React, { useMemo } from 'react';
import { PantryItem } from '../types'; // Asegúrate que PantryItem esté definido correctamente en este path
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
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
  // Procesar información de vencimiento
  const expiryInfo = useMemo(() => {
    if (!item.expiry_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const parsedDate = typeof item.expiry_date === 'string' ? parseISO(item.expiry_date) : item.expiry_date;
      if (!(parsedDate instanceof Date) || !isValid(parsedDate)) return null;

      const expiryDate = new Date(parsedDate);
      expiryDate.setHours(0, 0, 0, 0);

      const isExpired = isPast(expiryDate);
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      let status: 'expired' | 'urgent' | 'warning' | 'good' = 'good';
      let message = '';

      if (isExpired) {
        status = 'expired';
        message = 'Vencido';
      } else if (daysUntilExpiry <= 1) {
        status = 'urgent';
        message = `Vence ${daysUntilExpiry === 0 ? 'hoy' : 'mañana'}`;
      } else if (daysUntilExpiry <= 3) {
        status = 'warning';
        message = `Vence en ${daysUntilExpiry} días`;
      } else {
        status = 'good';
        message = expiryDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short'
        });
      }

      return { status, message };
    } catch {
      return null;
    }
  }, [item.expiry_date]);

  // Componente visual para el estado de vencimiento
  const ExpiryIndicator = useMemo(() => {
    if (!expiryInfo) return null;

    const { status, message } = expiryInfo;

    const getStatusConfig = () => {
      switch (status) {
        case 'expired':
          return {
            bgColor: 'bg-red-100 dark:bg-red-900/20',
            textColor: 'text-red-700 dark:text-red-400',
            icon: AlertTriangle,
            iconColor: 'text-red-500'
          };
        case 'urgent':
          return {
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            textColor: 'text-orange-700 dark:text-orange-400',
            icon: AlertTriangle,
            iconColor: 'text-orange-500'
          };
        case 'warning':
          return {
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
            textColor: 'text-yellow-700 dark:text-yellow-400',
            icon: AlertTriangle,
            iconColor: 'text-yellow-500'
          };
        case 'good':
          return {
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            textColor: 'text-green-700 dark:text-green-400',
            icon: CheckCircle,
            iconColor: 'text-green-500'
          };
      }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
      <div className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor
      )}>
        <Icon className={cn('h-3 w-3', config.iconColor)} />
        {message}
      </div>
    );
  }, [expiryInfo]);

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
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mt-0.5"> {/* flex-wrap para elementos largos */}
          <span className="text-muted-foreground">
            {item.quantity} {item.unit}
          </span>
          {ExpiryIndicator}
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