import React from 'react';
import { PantryItem } from '../types';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteTagsProps {
  favoriteItems: PantryItem[];
  onTagClick: (itemName: string) => void;
  activeTag?: string;
}

export function FavoriteTags({ favoriteItems, onTagClick, activeTag }: FavoriteTagsProps) {
  if (!favoriteItems?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Título de la sección */}
      <div className="flex items-center gap-1 w-full mb-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
        <span className="text-sm font-medium text-muted-foreground">
          Favoritos sugeridos:
        </span>
      </div>
      
      {/* Tags de items favoritos */}
      <div className="flex flex-wrap gap-2">
        {favoriteItems.map((item) => {
          const itemName = item.ingredient?.name;
          if (!itemName) return null;

          const isActive = activeTag === itemName;

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "h-7 px-2 text-xs font-medium rounded-full",
                "hover:bg-secondary/80",
                "transition-colors duration-200",
                isActive && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => onTagClick(itemName)}
            >
              <Star 
                className={cn(
                  "h-3 w-3 mr-1",
                  isActive ? "fill-current" : "fill-yellow-400"
                )}
              />
              {itemName}
            </Button>
          );
        })}
      </div>
    </div>
  );
}