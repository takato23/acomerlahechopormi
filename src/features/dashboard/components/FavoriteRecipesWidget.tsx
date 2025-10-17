import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight, ImageOff, HeartCrack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/common/EmptyState';
import { FavoriteRecipesWidgetSkeleton } from './FavoriteRecipesWidgetSkeleton';
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
    <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 shadow-card-pastel">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-white/40 to-primary/10 dark:from-primary/15 dark:via-background/40 dark:to-background/20" aria-hidden="true" />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between gap-3 px-6 pt-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl tint-primary shadow-pill">
            <Star className="h-5 w-5" />
          </span>
          Recetas favoritas
        </CardTitle>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
            <Link to="/app/recipes?view=favorites">
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="relative z-10 flex-grow px-6 pb-6 pt-0">
        {isLoading ? (
          <FavoriteRecipesWidgetSkeleton />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            className="h-full"
          >
            {error ? (
              <p className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-center text-sm text-destructive shadow-custom-sm">{error}</p>
            ) : favoriteRecipes.length > 0 ? (
              <ul className="h-full space-y-1.5 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {favoriteRecipes.slice(0, 5).map((recipe) => (
                    <motion.li
                      key={recipe.id}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="rounded-xl border border-white/50 dark:border-white/10 bg-white/75 dark:bg-background/60 transition hover:border-primary/30 hover:bg-primary/10"
                    >
                      <Link
                        to={`/app/recipes/${recipe.id}`}
                        className="flex items-center gap-3 p-2 text-sm text-foreground transition-colors hover:text-primary"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ImageOff className="h-4 w-4" />
                        </div>
                        <span className="flex-grow truncate">{recipe.name || 'Receta sin nombre'}</span>
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {favoriteRecipes.length > 5 && (
                  <li className="text-xs text-muted-foreground/70 text-center pt-1">
                    …y {favoriteRecipes.length - 5} más
                  </li>
                )}
              </ul>
            ) : (
              <EmptyState
                icon={<HeartCrack className="text-muted-foreground/60" />}
                title="Sin favoritas aún"
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
