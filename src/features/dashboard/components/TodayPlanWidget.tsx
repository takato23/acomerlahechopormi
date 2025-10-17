import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/common/EmptyState';
type PlannedMeal = any;
type MealType = any;
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, CalendarClock, UtensilsCrossed } from 'lucide-react'; // Añadir UtensilsCrossed

interface TodayPlanWidgetProps { 
  meals: PlannedMeal[];
  today: Date;
}

const mealTypesOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

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

export function TodayPlanWidget({ meals, today }: TodayPlanWidgetProps) {
  const sortedMeals = [...meals].sort((a, b) => 
    mealTypesOrder.indexOf(a.meal_type) - mealTypesOrder.indexOf(b.meal_type)
  );

  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 shadow-card-pastel">
      <div className="absolute inset-0 bg-gradient-primary opacity-35" aria-hidden="true" />

      <CardHeader className="relative z-10 flex flex-row items-center justify-between gap-3 px-6 pt-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl tint-primary shadow-pill">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Hoy</span>
            <span className="text-lg text-foreground">{format(today, 'EEEE d', { locale: es })}</span>
          </div>
        </CardTitle>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
            <Link to="/app/planning">
              Ver semana <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="relative z-10 flex-grow px-6 pb-6 pt-0">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="h-full"
        >
          {sortedMeals.length > 0 ? (
            <ul className="h-full space-y-3 overflow-y-auto pr-1">
              {sortedMeals.map((meal, index) => (
                <motion.li
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex items-center justify-between rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-background/60 p-4 shadow-custom-sm transition duration-200 hover:border-primary/40 hover:bg-primary/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{mealVisuals[meal.meal_type]?.emoji || '🍽️'}</span>
                    <span className="font-medium text-foreground transition-colors group-hover:text-primary">{meal.meal_type}</span>
                  </div>
                  <span className="text-foreground/80 truncate max-w-[120px] sm:max-w-[150px] text-right font-medium">
                    {meal.recipe_id && meal.recipes ? (
                      <Link to={`/app/recipes/${meal.recipe_id}`} className="underline decoration-transparent transition-colors hover:text-primary hover:decoration-primary">
                        {meal.recipes.name}
                      </Link>
                    ) : (
                      meal.custom_title || 'Comida personalizada'
                    )}
                  </span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<UtensilsCrossed className="text-muted-foreground/60" />}
              title="Nada planificado para hoy"
              description="Añadí comidas desde la sección de Planificación para verlas aquí."
              className="h-full justify-center py-8"
            />
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
