import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedPantryInput } from '../lib/pantryParser'; // Importar tipo desde pantryParser

interface PreviewAndConfirmProps {
  parsedData: ParsedPantryInput;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  suggestedCategoryName?: string | null; // Si tenemos el nombre de la categoría sugerida
}

export function PreviewAndConfirm({
  parsedData,
  onConfirm,
  onEdit,
  onCancel,
  isLoading,
  suggestedCategoryName,
}: PreviewAndConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <Card className="p-3 mt-2 bg-muted/50">
        <div className="flex flex-col gap-2">
          {/* Info Principal */}
          <div className="flex flex-col">
            <span className="text-sm font-medium mb-1">¿Añadir este ítem?</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">
                {parsedData.ingredientName}
              </span>
              {(parsedData.quantity !== undefined && parsedData.quantity !== null) && (
                <span className="text-muted-foreground">
                  {parsedData.quantity} {parsedData.unit || 'un.'}
                </span>
              )}
              {suggestedCategoryName && (
                <span className="text-muted-foreground">
                  en {suggestedCategoryName}
                </span>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="default"
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={isLoading}
              className={cn(
                "flex-1",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
              className="px-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cancelar</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}