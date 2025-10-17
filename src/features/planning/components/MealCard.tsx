import { Fragment, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ChefHat,
  ListPlus,
  MoreHorizontal,
  Play,
  Scale,
  SkipForward,
  ThermometerSnowflake,
  Trash2,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MealStatus, PlannedMeal } from '../types';

interface MealCardProps {
  meal: PlannedMeal;
  compact?: boolean;
  showActions?: boolean;
  onExecute?: () => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddMissingIngredients?: () => void;
  onGenerateAlternative?: () => void;
}

const difficultyLabels = {
  simple: 'Fácil',
  medium: 'Media',
  complex: 'Avanzada',
};

export function MealCard({
  meal,
  compact = false,
  showActions = true,
  onExecute,
  onSkip,
  onEdit,
  onDelete,
  onAddMissingIngredients,
  onGenerateAlternative,
}: MealCardProps) {
  const missingIngredients = meal.ingredient_status?.filter((status) => !status.available) ?? [];
  const availableIngredients = meal.ingredient_status?.filter((status) => status.available) ?? [];
  const totalTime = (meal.prep_time_minutes ?? 0) + (meal.cook_time_minutes ?? 0);
  const feasibilityScore = meal.feasibility_score ?? null;
  const costEstimate = meal.cost_estimate;
  const nutritionalInfo = meal.nutritional_info;
  const equipmentWarnings = meal.equipment_warnings ?? [];
  const imageUrl = meal.recipes?.image_url ?? null;
  const missingCount = missingIngredients.length;

  const summaryItems = [
    {
      label: 'Calorías',
      value: nutritionalInfo?.calories ? `${Math.round(nutritionalInfo.calories)} kcal` : '—',
    },
    {
      label: 'Prep + cocción',
      value: totalTime > 0 ? `${totalTime} min` : '—',
    },
    {
      label: 'Faltantes',
      value: missingCount > 0 ? `${missingCount}` : '0',
    },
  ];

  const shouldShowBadges = feasibilityScore !== null || meal.difficulty || costEstimate !== undefined;

  const statusBadge = useMemo(() => {
    switch (meal.status as MealStatus | undefined) {
      case 'executed':
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            Ejecutada
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Omitida
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Confirmada
          </Badge>
        );
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  }, [meal.status]);

  const compactStatus = useMemo(() => {
    switch (meal.status as MealStatus | undefined) {
      case 'executed':
        return {
          label: 'Realizada',
          className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        };
      case 'skipped':
        return {
          label: 'Omitida',
          className: 'border-red-200 bg-red-50 text-red-600',
        };
      case 'confirmed':
        return {
          label: 'Confirmada',
          className: 'border-blue-200 bg-blue-50 text-blue-600',
        };
      default:
        return {
          label: 'Pendiente',
          className: 'border-muted text-muted-foreground',
        };
    }
  }, [meal.status]);

  const title = useMemo(() => {
    if (meal.recipes?.title) return meal.recipes.title;
    if (meal.custom_title) return meal.custom_title;
    return 'Comida sin nombre';
  }, [meal.custom_title, meal.recipes?.title]);

  const hasSecondaryActions = Boolean(onExecute || onSkip || onAddMissingIngredients || onGenerateAlternative);

  if (compact) {
    return (
      <Card className="group relative overflow-hidden border border-border/40 bg-card/80 px-0 py-0 shadow-sm transition hover:border-primary/50">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            className="flex flex-1 items-center justify-between gap-3 px-3 py-2 text-left text-xs transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground line-clamp-2">{title}</span>
              <span className="text-[11px] text-muted-foreground">
                {meal.recipes?.title ? 'Receta guardada' : 'Entrada manual'}
              </span>
              {compactStatus && (
                <span
                  className={cn(
                    'w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight',
                    compactStatus.className,
                  )}
                >
                  {compactStatus.label}
                </span>
              )}
            </div>
          </button>

          {showActions && (
            <div className="flex items-center gap-1 pr-2 opacity-0 transition group-hover:opacity-100">
              {hasSecondaryActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4} className="w-48 text-sm">
                    {onExecute && (
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          onExecute();
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" /> Marcar como realizada
                      </DropdownMenuItem>
                    )}
                    {onSkip && (
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          onSkip();
                        }}
                      >
                        <SkipForward className="mr-2 h-4 w-4" /> Marcar como omitida
                      </DropdownMenuItem>
                    )}
                    {onAddMissingIngredients && (
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddMissingIngredients();
                        }}
                      >
                        <ListPlus className="mr-2 h-4 w-4" /> Añadir faltantes
                      </DropdownMenuItem>
                    )}
                    {onGenerateAlternative && (
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          onGenerateAlternative();
                        }}
                      >
                        <ChefHat className="mr-2 h-4 w-4" /> Ver alternativa IA
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar comida</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  const renderSecondaryBadges = () => (
    <div className="flex flex-wrap gap-2 text-xs">
      {feasibilityScore !== null && (
        <Badge
          variant={feasibilityScore > 79 ? 'secondary' : feasibilityScore > 49 ? 'outline' : 'destructive'}
        >
          Factibilidad {feasibilityScore}
        </Badge>
      )}
      {meal.difficulty && (
        <Badge variant="outline" className="flex items-center gap-1">
          <ChefHat className="h-3 w-3" />
          {difficultyLabels[meal.difficulty]}
        </Badge>
      )}
      {costEstimate !== undefined && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Scale className="h-3 w-3" /> ${costEstimate.toFixed(2)}
        </Badge>
      )}
    </div>
  );

  return (
    <Card className={cn('shadow-sm', compact && 'border-dashed border-muted')}>
      <CardContent className={cn('space-y-4 p-4', compact && 'space-y-3 p-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn('text-base font-semibold', compact && 'text-sm')}>{title}</h3>
              {statusBadge}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExecute}>
                  <Play className="mr-2 h-4 w-4" /> Marcar como realizada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSkip}>
                  <SkipForward className="mr-2 h-4 w-4" /> Marcar como omitida
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddMissingIngredients}>
                  <ListPlus className="mr-2 h-4 w-4" /> Añadir faltantes a compras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onGenerateAlternative}>
                  <ChefHat className="mr-2 h-4 w-4" /> Comparar alternativa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {imageUrl && (
          <div className={cn('overflow-hidden rounded-md', compact ? 'h-20' : 'h-40')}>
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className={cn('grid gap-3 text-xs text-muted-foreground', compact ? 'grid-cols-2' : 'grid-cols-3')}>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col rounded-md border border-dashed border-muted bg-muted/20 p-2"
            >
              <span className="text-[11px] uppercase tracking-wide">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>

        {shouldShowBadges && renderSecondaryBadges()}

        {!compact && nutritionalInfo && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {nutritionalInfo.protein !== undefined && <span>Proteínas: {nutritionalInfo.protein} g</span>}
            {nutritionalInfo.carbs !== undefined && <span>Carbohidratos: {nutritionalInfo.carbs} g</span>}
            {nutritionalInfo.fat !== undefined && <span>Grasas: {nutritionalInfo.fat} g</span>}
            {nutritionalInfo.fiber !== undefined && <span>Fibra: {nutritionalInfo.fiber} g</span>}
          </div>
        )}

        {!compact && !!equipmentWarnings.length && (
          <div className="flex flex-wrap gap-2 text-xs text-amber-600">
            {equipmentWarnings.map((warning) => (
              <Badge key={warning} variant="outline" className="border-amber-400 text-amber-600">
                <AlertTriangle className="mr-1 h-3 w-3" /> {warning}
              </Badge>
            ))}
          </div>
        )}

        {!!missingIngredients.length && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700">
            <p className="flex items-center gap-2 font-medium">
              <ThermometerSnowflake className="h-4 w-4" /> Ingredientes faltantes
            </p>
            <ul className="mt-2 space-y-1">
              {missingIngredients.map((item) => (
                <li key={item.ingredient_name}>
                  {item.ingredient_name}{' '}
                  <span className="text-[10px] text-rose-500">
                    necesita {item.quantity_needed - item.quantity_available} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
            {onAddMissingIngredients && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={onAddMissingIngredients}>
                Añadir faltantes a la lista
              </Button>
            )}
          </div>
        )}

        {!compact && availableIngredients.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span>Disponibles: </span>
            {availableIngredients.slice(0, 5).map((ingredient, index) => (
              <Fragment key={`${ingredient.ingredient_name}-${index}`}>
                {ingredient.ingredient_name}
                {index < Math.min(availableIngredients.length, 5) - 1 && ', '}
              </Fragment>
            ))}
            {availableIngredients.length > 5 && '…'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MealCard;
