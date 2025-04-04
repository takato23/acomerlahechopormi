import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from '@/components/ui/Spinner';
import { Trash2 } from 'lucide-react';

interface ClearPantryDialogProps {
  onConfirm: () => Promise<void>;
  itemCount: number;
  // No necesitamos triggerButton como prop
}

// Usar React.forwardRef para aceptar la ref
export const ClearPantryDialog = React.forwardRef<
  HTMLButtonElement, // Tipo del elemento al que se reenvía la ref (el botón)
  ClearPantryDialogProps
>(({ onConfirm, itemCount }, ref) => { // Recibir la ref como segundo argumento
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      // El diálogo se cierra solo
    } catch (error) {
      console.error("Error confirming clear pantry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {/* Pasar la ref recibida al Button */}
        <Button ref={ref} variant="destructive" size="icon" aria-label="Vaciar despensa">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará <strong>todos los {itemCount} items</strong> de tu despensa.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            {isLoading ? "Eliminando..." : "Sí, vaciar despensa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

// Añadir displayName para debugging
ClearPantryDialog.displayName = "ClearPantryDialog";