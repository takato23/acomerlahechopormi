import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanningStore } from '@/stores/planningStore';
import { RefreshCw, Copy, Trash2 } from 'lucide-react';

const formatRange = (start: string, end: string) => {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM", { locale: es })}`;
  } catch (error) {
    return `${start} - ${end}`;
  }
};

export function PlanningHistory() {
  const {
    templates,
    fetchTemplates,
    isLoadingTemplates,
    deleteTemplate,
    applyTemplateToCurrentWeek,
    mealPlanHistory,
    fetchMealPlanHistory,
    isLoadingHistory,
    duplicateMealPlanFromHistory,
    currentStartDate,
    currentEndDate,
  } = usePlanningStore();

  useEffect(() => {
    if (!templates.length) {
      void fetchTemplates();
    }
  }, [templates.length, fetchTemplates]);

  useEffect(() => {
    if (currentStartDate && currentEndDate) {
      void fetchMealPlanHistory();
    }
  }, [currentStartDate, currentEndDate, fetchMealPlanHistory]);

  const handleApplyTemplate = (templateId: string) => {
    if (!currentStartDate) return;
    void applyTemplateToCurrentWeek(templateId, currentStartDate);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base font-semibold">Plantillas guardadas</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void fetchTemplates()}
            disabled={isLoadingTemplates}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingTemplates ? (
            <Skeleton className="h-16 w-full" />
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no has guardado plantillas semanales.
            </p>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
              >
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-foreground">{template.name}</span>
                  <span className="text-muted-foreground text-xs">
                    Guardada el {format(parseISO(template.created_at), "d MMM y", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    Aplicar
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => void deleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base font-semibold">Semanas anteriores</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void fetchMealPlanHistory()}
            disabled={isLoadingHistory}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingHistory ? (
            <Skeleton className="h-16 w-full" />
          ) : mealPlanHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No encontramos semanas anteriores guardadas todavía.
            </p>
          ) : (
            mealPlanHistory.map(plan => (
              <div
                key={plan.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
              >
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-foreground">{plan.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatRange(plan.start_date, plan.end_date)}
                  </span>
                  <Badge variant="outline" className="mt-1 w-fit text-xs">
                    {plan.meal_count} comidas
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void duplicateMealPlanFromHistory(plan.id)}
                >
                  <Copy className="h-4 w-4 mr-2" /> Duplicar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

