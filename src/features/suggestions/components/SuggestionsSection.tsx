import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import { useSuggestionStore } from '../stores/suggestionStore';
import { usePantryStore } from '@/stores/pantryStore'; // Ajustar ruta si es necesario
import type { PantryItem } from '@/features/pantry/types'; // Ajustar ruta si es necesario
import { SuggestionCard } from './SuggestionCard';
import type { SuggestionRequest } from '../types';

export const SuggestionsSection: React.FC = () => {
  const { suggestions, isLoading, error, getSuggestions, clearSuggestions, clearError } = useSuggestionStore();
  const { items: pantryItems } = usePantryStore(); // Correctamente usa 'items' y lo renombra

  const [hasFetched, setHasFetched] = useState(false);

  // Limpiar sugerencias y errores al desmontar
  useEffect(() => {
    return () => {
      clearSuggestions();
      clearError();
    };
  }, [clearSuggestions, clearError]);

  const handleGetSuggestions = () => {
    clearError(); // Limpiar errores previos
    setHasFetched(true); // Marcar que se intentó buscar

    // Construir la solicitud
    const request: SuggestionRequest = {
      // Filtrar items sin nombre o cantidad antes de mapear
      pantryItems: pantryItems
        .filter((item): item is PantryItem & { ingredient: { name: string }, quantity: number } =>
          Boolean(item.ingredient?.name && typeof item.quantity === 'number')
        )
        .map((item) => ({
          name: item.ingredient.name, // Acceder correctamente al nombre
          quantity: item.quantity, // Ahora sabemos que quantity es number
          unit: item.unit,
        })),
      // Aquí podrías añadir preferencias del usuario si estuvieran disponibles
      // dietary: { vegetarian: true },
      // maxTime: 30,
    };

    getSuggestions(request);
  };

  const handleSaveRecipe = (suggestionIndex: number) => {
    // TODO: Implementar lógica para guardar la receta sugerida
    // Podría abrir un modal pre-llenado de AddEditRecipePage
    // o llamar a un servicio para crearla directamente
    console.log('Guardar receta:', suggestions[suggestionIndex]);
    // toast.info(`Funcionalidad "Guardar Receta" pendiente para "${suggestions[suggestionIndex].name}"`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>¿Qué Cocino Hoy?</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleGetSuggestions}
            disabled={isLoading || pantryItems.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando ideas...
              </>
            ) : (
              'Sugerir Recetas con mi Despensa'
            )}
          </Button>

          {pantryItems.length === 0 && !isLoading && (
             <p className="text-sm text-muted-foreground text-center">
               Añade items a tu despensa para obtener sugerencias.
             </p>
           )}

          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onSaveRecipe={() => handleSaveRecipe(index)}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && hasFetched && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              No se encontraron sugerencias con los ingredientes actuales. ¡Intenta añadir más items a tu despensa!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};