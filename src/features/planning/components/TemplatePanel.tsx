import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  ChefHat,
  Plus,
  Search,
  Star,
  Users,
  Clock,
  DollarSign,
  Target,
  Loader2
} from 'lucide-react';
import { TemplateService } from '../services/templateService';
import type { PlanningTemplate, TemplateCategory } from '../types';
import { notifyError, notifySuccess } from '@/lib/notifications';

type TemplateWithOwnership = PlanningTemplate & { isUserTemplate?: boolean };

interface TemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateId: string) => Promise<boolean> | boolean;
  onCreateTemplate?: () => void;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  personal: 'Personal',
  healthy: 'Saludable',
  budget: 'Económico',
  quick: 'Rápido',
  family: 'Familiar',
  seasonal: 'Estacional',
  diet: 'Dieta'
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  personal: 'bg-purple-100 text-purple-800',
  healthy: 'bg-green-100 text-green-800',
  budget: 'bg-blue-100 text-blue-800',
  quick: 'bg-orange-100 text-orange-800',
  family: 'bg-pink-100 text-pink-800',
  seasonal: 'bg-yellow-100 text-yellow-800',
  diet: 'bg-red-100 text-red-800'
};

export function TemplatePanel({
  isOpen,
  onClose,
  onApplyTemplate,
  onCreateTemplate
}: TemplatePanelProps) {
  const [templates, setTemplates] = useState<TemplateWithOwnership[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateWithOwnership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const [userTemplates, publicTemplates] = await Promise.all([
        TemplateService.getUserTemplates(),
        TemplateService.getPublicTemplates(20)
      ]);

      // Combinar y marcar cuáles son del usuario
      const allTemplates = [
        ...userTemplates.map(t => ({ ...t, isUserTemplate: true })),
        ...publicTemplates.map(t => ({ ...t, isUserTemplate: false }))
      ];

      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      notifyError('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered: TemplateWithOwnership[] = templates;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleApplyTemplate = async (template: TemplateWithOwnership) => {
    try {
      setApplyingTemplateId(template.id);
      const applied = await onApplyTemplate(template.id);

      if (applied) {
        if (!template.isUserTemplate) {
          await TemplateService.incrementUsageCount(template.id);
        }
        notifySuccess(`Plantilla "${template.name}" aplicada`);
        onClose();
      } else {
        notifyError('No se pudo aplicar la plantilla seleccionada');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      notifyError('Error al aplicar la plantilla');
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const TemplateCard = ({ template }: { template: TemplateWithOwnership }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {template.name}
              {template.isUserTemplate && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </CardTitle>
            {template.description && (
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            )}
          </div>
          {template.is_public && <Users className="h-4 w-4 text-gray-400" />}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge className={CATEGORY_COLORS[template.category]}>
            {CATEGORY_LABELS[template.category]}
          </Badge>
          {!template.isUserTemplate && template.usage_count > 0 && (
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {template.usage_count}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {template.template_data.metadata.difficulty_level || 'Media'}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            ~${template.template_data.metadata.estimated_cost || 'N/A'}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleApplyTemplate(template)}
            className="flex-1"
            disabled={applyingTemplateId === template.id}
          >
            {applyingTemplateId === template.id ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando…
              </>
            ) : (
              'Aplicar'
            )}
          </Button>
          {template.isUserTemplate && (
            <Button size="sm" variant="outline">
              <Target className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Plantillas de Planificación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de búsqueda y filtros */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar plantillas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(key as TemplateCategory)}
                >
                  {label}
                </Button>
              ))}
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                Todas
              </Button>
            </div>
          </div>

          {/* Contenido principal */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Plantillas del usuario */}
                {filteredTemplates.some(t => t.isUserTemplate) && (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Mis Plantillas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates
                          .filter(t => t.isUserTemplate)
                          .map(template => (
                            <TemplateCard key={template.id} template={template} />
                          ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-200" />
                    <div className="border-t border-gray-200" />
                  </>
                )}

                {/* Plantillas públicas */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Plantillas Populares</h3>
                  {filteredTemplates.filter(t => !t.isUserTemplate).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTemplates
                        .filter(t => !t.isUserTemplate)
                        .map(template => (
                          <TemplateCard key={template.id} template={template} />
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No se encontraron plantillas públicas
                    </p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer con acciones */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {filteredTemplates.length} plantillas encontradas
            </div>
            <div className="flex gap-2">
              {onCreateTemplate && (
                <Button onClick={onCreateTemplate} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plantilla
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
