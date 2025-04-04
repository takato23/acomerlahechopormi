import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckSquare, Square, Trash, X } from 'lucide-react';

interface PantrySelectionControlsProps {
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onEnterSelectionMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCancelSelection: () => void;
  onDeleteSelected: () => void;
  totalVisibleItems: number;
}

const PantrySelectionControls: React.FC<PantrySelectionControlsProps> = ({
  isSelectionMode,
  selectedItems,
  onEnterSelectionMode,
  onSelectAll,
  onDeselectAll,
  onCancelSelection,
  onDeleteSelected,
  totalVisibleItems,
}) => {
  if (!isSelectionMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onEnterSelectionMode}
        aria-label="Activar modo selección"
      >
        <CheckSquare className="mr-2 h-4 w-4" />
        Seleccionar
      </Button>
    );
  }

  const selectedCount = selectedItems.size;

  return (
    <div className="flex items-center gap-2">
      {/* Contador de selección */}
      <span className="text-sm">
        {selectedCount} de {totalVisibleItems} seleccionados
      </span>

      {/* Botones de selección */}
      <Button
        variant="outline"
        size="sm"
        onClick={selectedCount === totalVisibleItems ? onDeselectAll : onSelectAll}
      >
        {selectedCount === totalVisibleItems ? (
          <Square className="mr-2 h-4 w-4" />
        ) : (
          <CheckSquare className="mr-2 h-4 w-4" />
        )}
        {selectedCount === totalVisibleItems ? 'Deseleccionar todo' : 'Seleccionar todo'}
      </Button>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedCount === 0}
          >
            <Trash className="mr-2 h-4 w-4" />
            Eliminar ({selectedCount})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar items seleccionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {selectedCount} {selectedCount === 1 ? 'item' : 'items'} de tu despensa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteSelected}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Botón cancelar selección */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancelSelection}
      >
        <X className="mr-2 h-4 w-4" />
        Cancelar
      </Button>
    </div>
  );
};

export default PantrySelectionControls;