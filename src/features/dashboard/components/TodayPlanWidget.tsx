import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { motion } from 'framer-motion'; 
import { ArrowRight, CalendarClock, UtensilsCrossed } from 'lucide-react'; // Añadir UtensilsCrossed
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PlannedMeal as ImportedPlannedMeal } from '@/features/planning/types'; // Importar con alias para evitar colisión si se redefine localmente
import { ArrowRight as NewArrowRight, CalendarCheck, UtensilsCrossed as NewUtensilsCrossed, Sunrise, Sun, Moon } from 'lucide-react'; // <-- Iconos actualizados
import { cn } from '@/lib/utils';

// Usar tipo importado y mejorar tipo MealType
type PlannedMeal = ImportedPlannedMeal;
// TODO: Considerar crear un enum o tipo más estricto para MealType globalmente
type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena' | string; 

// Reintroducir la interfaz de props
interface TodayPlanWidgetProps { 
  meals: PlannedMeal[];
  today: Date;
}

const mealTypesOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

// Reintroducir el mapeo de iconos
const mealTypeIcons: Record<MealType, React.ElementType> = {
  'Desayuno': Sunrise,
  'Almuerzo': Sun,
  'Merienda': Sun, // Podríamos buscar otro icono si hay Merienda
  'Cena': Moon,
};

const mealVisuals: { [key in MealType]: { emoji: string } } = {
  'Desayuno': { emoji: '🍳' },
  'Almuerzo': { emoji: '🥗' },
  'Merienda': { emoji: '🫖' },
  'Cena': { emoji: '🌙' },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

export function TodayPlanWidget({ meals = [], today }: TodayPlanWidgetProps) { 
  // Asegurar que meals sea un array
  const validMeals = Array.isArray(meals) ? meals : [];
  
  // Ordenar las comidas solo si hay alguna
  const sortedMeals = validMeals.length > 0 
    ? [...validMeals].sort((a, b) => 
        mealTypesOrder.indexOf(a?.meal_type || '') - mealTypesOrder.indexOf(b?.meal_type || '')
      )
    : [];

  const formattedToday = format(today, 'EEEE d', { locale: es });

  return (
    <Card className="h-full flex flex-col bg-card rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center text-foreground">
            <CalendarCheck className="h-5 w-5 mr-2 text-primary" /> 
            Plan de Hoy
          </CardTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {formattedToday}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-sm" asChild>
          <Link to="/app/planning">
            Ver Semana <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0 flex-grow min-h-0"> 
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="h-full" 
        >
          {sortedMeals.length > 0 ? (
            <ul className="space-y-2 overflow-y-auto h-full pr-1">
              {sortedMeals.map((meal) => {
                const MealIcon = mealTypeIcons[meal?.meal_type] || UtensilsCrossed; // Icono por defecto
                const mealName = meal?.recipe_id 
                  ? meal?.recipes?.title || 'Receta sin nombre' 
                  : meal?.custom_meal_name || 'Comida personalizada';
                const isLink = !!meal?.recipe_id;

                return (
                  <li key={meal?.id || Math.random()} className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{mealVisuals[meal?.meal_type]?.emoji || '🍽️'}</span> 
                      <span className="font-medium text-slate-700">{meal?.meal_type || 'Comida'}</span>
                    </div>
                    <span className="text-slate-900 truncate max-w-[120px] sm:max-w-[150px] text-right">
                      {isLink ? (
                        <Link to={`/app/recipes/${meal.recipe_id}`} className="hover:underline hover:text-emerald-600">
                          {mealName}
                        </Link>
                      ) : (
                        mealName
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            // Usar EmptyState
            <EmptyState
              icon={<NewUtensilsCrossed />}
              title="Nada planeado para hoy"
              description="Puedes añadir comidas desde la sección de Planificación."
              className="h-full justify-center py-6" // Ajustar padding y centrado
            />
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}