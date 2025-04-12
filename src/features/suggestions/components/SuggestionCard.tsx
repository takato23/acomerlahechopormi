import React from 'react';
import { Clock, ChefHat, List } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RecipeSuggestion } from '../types';

interface SuggestionCardProps {
  suggestion: RecipeSuggestion;
  onSaveRecipe?: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onSaveRecipe
}) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'fácil':
        return 'bg-green-500';
      case 'media':
        return 'bg-yellow-500';
      case 'difícil':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{suggestion.name}</CardTitle>
            {suggestion.difficulty && (
              <Badge className={`${getDifficultyColor(suggestion.difficulty)} mt-2`}>
                {suggestion.difficulty}
              </Badge>
            )}
          </div>
          {suggestion.estimatedTime && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{suggestion.estimatedTime}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tiempo estimado de preparación</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-sm mb-4">
          {suggestion.description}
        </CardDescription>
        
        {suggestion.ingredients && suggestion.ingredients.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <List className="w-4 h-4" />
              <span>Ingredientes necesarios:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {suggestion.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {onSaveRecipe && (
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onSaveRecipe}
          >
            <ChefHat className="w-4 h-4" />
            Guardar Receta
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};