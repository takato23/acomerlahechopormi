import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { usePlanningStore } from '@/stores/planningStore';
import { Spinner } from '@/components/ui/Spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LoadTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  weekStartDate: string;
}

export function LoadTemplateDialog({ isOpen, onClose, weekStartDate }: LoadTemplateDialogProps) {
  const {
    templates,
    isLoadingTemplates,
    templateError,
    fetchTemplates,
    applyTemplateToCurrentWeek,
    deleteTemplate
  } = usePlanningStore();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const handleApplyTemplate = async (templateId: string) => {
    if (window.confirm('¿Estás seguro de que deseas aplicar esta plantilla? Las comidas existentes se mantendrán.')) {
      await applyTemplateToCurrentWeek(templateId, weekStartDate);
      onClose();
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      await deleteTemplate(templateId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "w-[340px] min-w-[300px] max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto",
          "p-6"
        )}
      >
        <DialogHeader>
          <DialogTitle>Cargar Plantilla</DialogTitle>
        </DialogHeader>

        {isLoadingTemplates ? (
          <div className="flex justify-center p-4">
            <Spinner size="lg" />
          </div>
        ) : templateError ? (
          <div className="text-center text-red-500 p-4">
            {templateError}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            No hay plantillas guardadas
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Creada el {format(new Date(template.created_at), 'PPP', { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {template.template_data.meals.length} comidas
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        Aplicar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}