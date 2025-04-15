import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Utensils, X } from 'lucide-react';
import type { Recipe } from '@/types/recipeTypes';
import { cn } from '@/lib/utils';

interface RecipePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipe?: Pick<Recipe, 'id' | 'title' | 'description' | 'image_url'>;
}

export function RecipePreviewDialog({
  isOpen,
  onClose,
  recipeId,
  recipe,
}: RecipePreviewDialogProps) {
  // Evita el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-[340px] min-w-[300px] max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto",
          "border-none shadow-2xl bg-background rounded-2xl",
          "flex flex-col items-center relative p-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted/80 transition"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="w-full text-center px-6 pt-7 pb-2">
          <div className="flex flex-col items-center justify-center w-full mb-4">
            {recipe?.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title || ''}
                className="w-24 h-24 object-cover rounded-full border-4 border-background/80 shadow-md bg-muted"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 border-4 border-background/80 shadow-md">
                <Utensils className="w-10 h-10 text-primary/60" aria-hidden="true" />
              </div>
            )}
          </div>

          <h2 className="text-lg font-semibold leading-tight mb-1 truncate">
            {recipe?.title || 'Cargando receta...'}
          </h2>

          {recipe?.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-2 px-6 pb-5 pt-2 border-t border-border/20 mt-auto">
          <Button asChild className="w-full text-base font-medium rounded-lg shadow-sm">
            <Link to={`/app/recipes/${recipeId}`} onClick={onClose}>Ver receta completa</Link>
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground hover:text-primary text-sm rounded-lg">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
