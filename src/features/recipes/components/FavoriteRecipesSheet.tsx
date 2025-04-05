import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useRecipeStore } from '@/stores/recipeStore';
import { Link } from 'react-router-dom';
import { StarOff } from 'lucide-react'; // O un icono similar para quitar favorito
import { toast } from 'sonner';

interface FavoriteRecipesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FavoriteRecipesSheet: React.FC<FavoriteRecipesSheetProps> = ({ open, onOpenChange }) => {
  const recipes = useRecipeStore((state) => state.recipes);
  const toggleFavorite = useRecipeStore((state) => state.toggleFavorite);
  const isLoading = useRecipeStore((state) => state.isLoading); // Para mostrar feedback

  // Filtrar recetas favoritas localmente
  const favoriteRecipes = recipes.filter(recipe => recipe.is_favorite);

  const handleToggleFavorite = async (recipeId: string) => {
    try {
      await toggleFavorite(recipeId);
      // El store ya muestra toast de éxito/error
    } catch (error) {
      // El store maneja el error y el toast
      console.error("Error al quitar de favoritos desde el sheet:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Recetas Favoritas ⭐</SheetTitle>
          <SheetDescription>
            Aquí puedes ver y gestionar tus recetas favoritas.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow my-4">
          {isLoading && favoriteRecipes.length === 0 ? (
            <p className="text-center text-muted-foreground">Cargando favoritos...</p>
          ) : favoriteRecipes.length === 0 ? (
            <p className="text-center text-muted-foreground">Aún no tienes recetas favoritas.</p>
          ) : (
            <ul className="space-y-3 pr-4">
              {favoriteRecipes.map((recipe) => (
                <li key={recipe.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                  <Link to={`/app/recipes/${recipe.id}`} className="flex-grow mr-2" onClick={() => onOpenChange(false)}>
                    <span className="font-medium truncate">{recipe.title}</span>
                    {/* Podríamos añadir una imagen pequeña si está disponible */}
                    {/* recipe.image_url && <img src={recipe.image_url} alt={recipe.title} className="w-8 h-8 rounded-sm ml-2" /> */}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFavorite(recipe.id)}
                    aria-label="Quitar de favoritos"
                    className="text-destructive hover:text-destructive/80"
                  >
                    <StarOff className="h-4 w-4" aria-hidden="true" /> {/* Ocultar icono decorativo */}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Cerrar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};