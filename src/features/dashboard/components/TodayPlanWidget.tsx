import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion'; 
import { EmptyState } from '@/components/common/EmptyState'; // Importar EmptyState
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
    <Card className="h-full flex flex-col"> 
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2"> 
           <CalendarClock className="h-4 w-4 text-muted-foreground" /> 
           Plan de Hoy 
           <span className="text-muted-foreground font-normal text-sm">
             ({format(today, 'EEEE d', { locale: es })})
           </span>
        </CardTitle>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" className="h-7 -my-1 -mr-2 text-xs" asChild> 
            <Link to="/app/planning">
              Ver Semana <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow min-h-0"> 
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="h-full" 
        >
          {sortedMeals.length > 0 ? (
            <ul className="space-y-1.5 overflow-y-auto h-full pr-1"> 
              {sortedMeals.map((meal) => (
                <li key={meal.id} className="flex items-center justify-between p-1.5 rounded-md bg-muted/40 hover:bg-muted/70 text-xs"> 
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{mealVisuals[meal.meal_type]?.emoji || '🍽️'}</span> 
                    <span className="font-medium text-foreground/80">{meal.meal_type}</span>
                  </div>
                  <span className="text-foreground/90 truncate max-w-[120px] sm:max-w-[150px] text-right"> 
                    {meal.recipe_id && meal.recipes ? (
                      <Link to={`/app/recipes/${meal.recipe_id}`} className="hover:underline hover:text-primary">
                        {meal.recipes.name} 
                      </Link>
                    ) : (
                      meal.custom_meal_name || 'Comida personalizada'
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            // Usar EmptyState
            <EmptyState
              icon={<UtensilsCrossed />}
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