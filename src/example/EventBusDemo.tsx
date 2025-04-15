// Ejemplo mínimo de integración entre módulos usando el store/event bus centralizado
// Archivo: src/example/EventBusDemo.tsx

import React, { useEffect } from 'react';
import { useAppStore, AppEvent } from '../stores/appStore';

// Simula un módulo que genera una receta
export const RecipeGeneratorDemo: React.FC = () => {
  const addEvent = useAppStore((state) => state.addEvent);

  const handleGenerateRecipe = () => {
    const newRecipe = {
      id: Math.random().toString(36).slice(2),
      title: 'Ensalada demo',
      ingredients: ['lechuga', 'tomate', 'aceite'],
    };
    const event: AppEvent = {
      type: 'recipeGenerated',
      payload: newRecipe,
      timestamp: Date.now(),
    };
    addEvent(event);
    // alert('Receta generada y evento emitido');
    if (typeof window !== 'undefined') {
      console.log('[Demo] Evento recipeGenerated emitido:', newRecipe);
    }
  };

  return (
    <button onClick={handleGenerateRecipe} style={{padding: 8, background: '#cfc', borderRadius: 4}}>
      Generar receta demo
    </button>
  );
};

// Simula un módulo que escucha recetas generadas y actualiza la lista de compras
export const ShoppingListListenerDemo: React.FC = () => {
  useEffect(() => {
    const unsubscribe = useAppStore.getState().subscribeToEvent('recipeGenerated', (recipe) => {
      // Aquí se podría actualizar la lista de compras real
      alert(`¡Nueva receta recibida en compras! Ingredientes: ${recipe.ingredients.join(', ')}`);
    });
    return () => {
      // No hay mecanismo de desuscripción en este ejemplo mínimo
    };
  }, []);

  return <div style={{marginTop: 16, color: '#555'}}>Listener de lista de compras activo</div>;
};

// Componente demo que muestra ambos juntos
export const EventBusDemo: React.FC = () => (
  <div style={{padding: 24, border: '1px solid #ddd', borderRadius: 8, maxWidth: 400, margin: '40px auto'}}>
    <h3>Demo: Event Bus Centralizado</h3>
    <RecipeGeneratorDemo />
    <ShoppingListListenerDemo />
    <div style={{marginTop: 24, fontSize: 12, color: '#888'}}>
      Generá una receta demo y mirá cómo la "lista de compras" reacciona automáticamente.<br/>
      (Esto es solo un ejemplo mínimo, no afecta datos reales)
    </div>
  </div>
);
