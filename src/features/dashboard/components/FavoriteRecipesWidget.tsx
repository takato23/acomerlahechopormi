import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight, ImageOff, HeartCrack } from 'lucide-react'; // Añadir HeartCrack
import { Spinner } from '@/components/ui/Spinner'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { EmptyState } from '@/components/common/EmptyState'; // Importar EmptyState
type Recipe = any;

interface FavoriteRecipesWidgetProps { 
  favoriteRecipes: Recipe[];
  isLoading: boolean;
  error: string | null;
}

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const listItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 } 
};

export function FavoriteRecipesWidget({ favoriteRecipes, isLoading, error }: FavoriteRecipesWidgetProps) { 
  return (
    <Card className="h-full flex flex-col"> 
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2"> 
          <Star className="h-4 w-4 text-muted-foreground" /> 
          Recetas Favoritas
        </CardTitle>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" className="h-7 -my-1 -mr-2 text-xs" asChild> 
            <Link to="/app/recipes?view=favorites"> 
              Ver Todas <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow min-h-0"> 
        {isLoading ? (
           <div className="flex items-center justify-center h-full"> 
             <Spinner size="sm" /> 
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            className="h-full" 
          >
            {error ? (
               <p className="text-sm text-destructive text-center py-4">{error}</p>
            ) : favoriteRecipes.length > 0 ? (
              <ul className="space-y-1.5 overflow-y-auto h-full pr-1"> 
                <AnimatePresence initial={false}>
                  {favoriteRecipes.slice(0, 5).map((recipe) => ( 
                    <motion.li 
                      key={recipe.id} 
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="hover:bg-muted/50 rounded"
                    > 
                      <Link 
                        to={`/app/recipes/${recipe.id}`} 
                        className="flex items-center gap-2 p-1.5 text-xs text-foreground/90 hover:text-primary" 
                      >
                         <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <ImageOff className="h-4 w-4 text-muted-foreground/60" />
                         </div>
                         <span className="truncate flex-grow"> 
                           {recipe.name || 'Receta sin nombre'}
                         </span>
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {favoriteRecipes.length > 5 && (
                  <li className="text-xs text-muted-foreground text-center pt-1">
                    ...y {favoriteRecipes.length - 5} más
                  </li>
                )}
              </ul>
            ) : (
               // Usar EmptyState
               <EmptyState
                 icon={<HeartCrack />}
                 title="Sin favoritas"
                 description="Marca tus recetas preferidas con una estrella para verlas aquí."
                 className="h-full justify-center py-6" 
               />
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}