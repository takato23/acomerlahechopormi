import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sparkles, Target, Wallet, Lightbulb, Info } from 'lucide-react';
import type { GoalComparison, WeeklyReport } from '../types';
import { cn } from '@/lib/utils';

interface AiStatusSummary {
  hasKey: boolean;
  source: 'user' | 'env' | null;
}

interface InsightsDockProps {
  className?: string;
  aiStatus: AiStatusSummary;
  aiBannerMessage: string;
  estimatedCost?: number | null;
  goalProgress?: GoalComparison | null;
  weeklyReport?: WeeklyReport | null;
  visionContent?: ReactNode;
}

const getGoalBadge = (goal?: GoalComparison | null) => {
  if (!goal) return null;
  switch (goal.status) {
    case 'on-track':
      return (
        <Badge variant="outline" className="rounded-full border-emerald-200 text-emerald-700">
          Objetivos en camino ({goal.percentage}%)
        </Badge>
      );
    case 'over':
      return (
        <Badge variant="outline" className="rounded-full border-amber-200 text-amber-700">
          Sobre objetivo (+{Math.abs(goal.difference)}%)
        </Badge>
      );
    case 'under':
      return (
        <Badge variant="outline" className="rounded-full border-sky-200 text-sky-700">
          Por debajo ({Math.abs(goal.difference)}%)
        </Badge>
      );
    default:
      return null;
  }
};

const getAiSourceLabel = (source: AiStatusSummary['source']) => {
  if (source === 'user') return 'Clave personal';
  if (source === 'env') return 'Clave del equipo';
  return 'Configurar clave';
};

export function InsightsDock({
  className,
  aiStatus,
  aiBannerMessage,
  estimatedCost,
  goalProgress,
  weeklyReport,
  visionContent,
}: InsightsDockProps) {

  const hasWeeklyReport = Boolean(
    weeklyReport && ((weeklyReport.most_used_ingredients ?? []).length > 0 || (weeklyReport.suggestions ?? []).length > 0),
  );

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 text-sm lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto',
        className,
      )}
    >

      <Accordion
        type="multiple"
        defaultValue={['automation', 'goals']}
        className="rounded-custom border border-border/60 bg-background/80 shadow-custom-sm"
      >
        <AccordionItem value="automation" className="border-border/60 first:rounded-t-custom last:rounded-b-custom">
          <AccordionTrigger className="px-4 text-left text-sm font-semibold">
            <span className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              IA y automatización
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
            <p className="text-foreground">{aiBannerMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant={aiStatus.hasKey ? 'secondary' : 'outline'}
                className="rounded-full px-3 py-1 text-[11px]"
              >
                {aiStatus.hasKey ? 'Clave activa' : 'Necesita clave'}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                {getAiSourceLabel(aiStatus.source)}
              </Badge>
            </div>
            <Button
              variant="minimal"
              size="sm"
              className="mt-3 gap-1 px-0 text-xs font-semibold text-primary"
              onClick={onOpenSettings}
            >
              Ajustar preferencias
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="goals" className="border-border/60 last:rounded-b-custom">
          <AccordionTrigger className="px-4 text-left text-sm font-semibold">
            <span className="flex items-center gap-2 text-foreground">
              <Target className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Nutrición y presupuesto
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
            {goalProgress ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {getGoalBadge(goalProgress)}
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                    Variación {Math.abs(goalProgress.difference)}%
                  </Badge>
                </div>
                {goalProgress.recommendation ? (
                  <p className="leading-relaxed text-foreground">{goalProgress.recommendation}</p>
                ) : (
                  <p className="leading-relaxed">
                    Vas por buen camino. Mantené tus proporciones actuales para sostener el progreso.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-custom border border-dashed border-border/70 bg-muted/40 p-3 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  Configurá tus objetivos nutricionales para ver recomendaciones personalizadas.
                </p>
                <Button
                  variant="minimal"
                  size="sm"
                  className="mt-3 gap-2 px-0 text-xs font-semibold text-primary"
                  onClick={onOpenSettings}
                >
                  Actualizar objetivos
                </Button>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>
                Coste semanal estimado:{' '}
                <span className="font-semibold text-foreground">
                  {typeof estimatedCost === 'number' ? `$${estimatedCost.toFixed(2)}` : '—'}
                </span>
              </span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="insights" className="border-border/60 last:rounded-b-custom">
          <AccordionTrigger className="px-4 text-left text-sm font-semibold">
            <span className="flex items-center gap-2 text-foreground">
              <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Insights destacados
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
            {hasWeeklyReport ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                    Ingredientes frecuentes
                  </p>
                  <p className="mt-1 text-foreground">
                    {(weeklyReport?.most_used_ingredients ?? []).slice(0, 3).join(', ') || 'Sin datos'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                    Recomendaciones
                  </p>
                  <ul className="mt-1 space-y-1 text-foreground">
                    {(weeklyReport?.suggestions ?? []).slice(0, 2).map((item) => (
                      <li key={item} className="leading-relaxed">
                        • {item}
                      </li>
                    ))}
                    {(weeklyReport?.suggestions ?? []).slice(0, 2).length === 0 ? (
                      <li className="leading-relaxed text-muted-foreground">Completá tu plan para ver recomendaciones.</li>
                    ) : null}
                  </ul>
                </div>
                <Button
                  variant="minimal"
                  size="sm"
                  className="gap-2 px-0 text-xs font-semibold text-primary"
                  onClick={onOpenStats}
                >
                  Ver informe completo
                </Button>
              </div>
            ) : (
              <div className="rounded-custom border border-dashed border-border/70 bg-muted/40 p-3 text-sm">
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  Generá o completá tu plan semanal para destrabar insights automáticos.
                </p>
                <Button
                  variant="minimal"
                  size="sm"
                  className="mt-3 gap-2 px-0 text-xs font-semibold text-primary"
                  onClick={onOpenStats}
                >
                  Abrir resumen
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {visionContent ? (
        <div className="rounded-custom border border-dashed border-border/60 bg-muted/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Notas visuales</h3>
          <div className="mt-3">{visionContent}</div>
        </div>
      ) : null}
    </aside>
  );
}

export default InsightsDock;
