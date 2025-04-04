import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import type { Recipe } from '@/types/recipeTypes';

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle>{recipe?.title || 'Cargando receta...'}</DialogTitle>
          {recipe?.description && (
            <DialogDescription className="text-sm leading-relaxed">
              {recipe.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {recipe ? (
          <div className="space-y-4 my-4">
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-muted/50">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                    <Utensils className="w-10 h-10" />
                    <span className="text-xs">Sin imagen disponible</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Cargando detalles...</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button asChild>
            <Link to={`/app/recipes/${recipeId}`}>
              Ver Receta Completa
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
