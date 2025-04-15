import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePlanningStore } from '@/stores/planningStore';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveTemplateDialog({ isOpen, onClose }: SaveTemplateDialogProps) {
  const [templateName, setTemplateName] = useState('');
  const { saveCurrentWeekAsTemplate, isLoadingTemplates } = usePlanningStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    await saveCurrentWeekAsTemplate(templateName);
    setTemplateName('');
    onClose();
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
          <DialogTitle>Guardar como Plantilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la plantilla"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            disabled={isLoadingTemplates}
          />
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoadingTemplates}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!templateName.trim() || isLoadingTemplates}
            >
              {isLoadingTemplates ? <Spinner className="mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}