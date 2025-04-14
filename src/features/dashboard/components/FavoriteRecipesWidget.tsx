import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Star, BookOpen } from 'lucide-react';
import { useRecipeStore } from '../../../stores/recipeStore'; // Ajustar ruta si es necesario
import type { Recipe } from '@/types/recipeTypes';
import { cn } from '@/lib/utils';

// Propiedades del componente (opcional, podríamos obtener todo del store)
interface FavoriteRecipesWidgetProps {
  maxItems?: number;
}

export function FavoriteRecipesWidget({ maxItems = 4 }: FavoriteRecipesWidgetProps) {
  // Obtener datos del store
  const allRecipes = useRecipeStore(state => state.recipes || []);
  const isLoading = useRecipeStore(state => state.isLoading);
  // Asumimos que un error en la carga general de recetas es relevante aquí
  const error = useRecipeStore(state => state.error);

  // Filtrar y limitar favoritos
  const favoriteRecipes = useMemo(() => 
    allRecipes.filter(r => r.is_favorite).slice(0, maxItems), 
    [allRecipes, maxItems]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Star className="h-5 w-5 mr-2 text-primary" />
          Recetas Favoritas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Esqueleto: simular una cuadrícula de mini-cards
          <div className="grid grid-cols-2 gap-3">
            {[...Array(maxItems)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Error desconocido')}
            </AlertDescription>
          </Alert>
        ) : favoriteRecipes.length > 0 ? (
          // Cuadrícula de recetas favoritas (mantener 2 columnas)
          <div className="grid grid-cols-2 gap-3"> {/* Siempre 2 columnas */}
            {favoriteRecipes.map((recipe) => (
              <Link 
                key={recipe.id} 
                to={`/app/recipes/${recipe.id}`} // Enlace a la vista de detalle
                className="group flex flex-col items-center space-y-1 p-2 rounded-md hover:bg-muted transition-colors"
              >
                {/* Imagen (si existe) o Placeholder */}
                <div className="w-full h-16 bg-muted rounded-md overflow-hidden mb-1">
                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                      {/* Placeholder si no hay imagen */}
                      <BookOpen className="h-6 w-6" />
                    </div>
                  )}
                </div>
                {/* Título */}
                <p className="text-xs font-medium text-center text-foreground truncate w-full">
                  {recipe.title}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          // Mensaje si no hay favoritos
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no has marcado recetas como favoritas.
          </p>
        )}
        
        {/* Enlace a "Ver más" si hay más favoritos que los mostrados */}
        {/* TODO: Añadir lógica para contar todos los favoritos y mostrar este enlace */}
        {/* {allRecipes.filter(r => r.is_favorite).length > maxItems && (
          <div className="mt-4 text-center">
            <Link to="/app/recipes?filter=favorites" className="text-sm text-primary hover:underline">
              Ver todas las favoritas
            </Link>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}