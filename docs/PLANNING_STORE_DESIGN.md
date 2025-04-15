# Diseño de Store/Event Bus Centralizado para Integración Holística

## Objetivo
Unificar el estado y los eventos clave de la app para que todos los módulos (planificador, recetas, despensa, compras, perfil) estén sincronizados y puedan reaccionar automáticamente a cambios.

---

## Shape del Store Central

```ts
interface AppState {
  user: User | null;
  profile: UserProfile | null;
  recipes: Recipe[];
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  planning: PlannedMeal[];
  events: AppEvent[];
}

// Ejemplo de eventos
interface AppEvent {
  type: 'recipeGenerated' | 'mealPlanned' | 'ingredientDepleted' | 'profileUpdated' | 'shoppingListUpdated';
  payload: any;
  timestamp: number;
}
```

---

## Eventos soportados
- `recipeGenerated`: Se generó una receta (IA o manual).
- `mealPlanned`: Se planificó una comida.
- `ingredientDepleted`: Se agotó un ingrediente en despensa.
- `profileUpdated`: El usuario cambió su perfil.
- `shoppingListUpdated`: Se modificó la lista de compras.

Cada módulo puede emitir y escuchar estos eventos para reaccionar en tiempo real.

---

## Ejemplo de uso (pseudo-código)

```ts
// En el store central (Zustand)
addEvent(event: AppEvent) {
  set(state => ({ events: [...state.events, event] }))
  // Listeners pueden suscribirse y reaccionar
}

// En el módulo de recetas
onRecipeGenerated(newRecipe) {
  addEvent({ type: 'recipeGenerated', payload: newRecipe, timestamp: Date.now() })
}

// En el módulo de compras
subscribeToEvents('recipeGenerated', (recipe) => {
  // Agregar ingredientes faltantes a la lista
})
```

---

## Integración progresiva
- Primero, los módulos solo escuchan y reaccionan a eventos clave.
- Luego, se migran los estados locales al store central.
- Finalmente, toda la lógica de sincronización se apoya en el event bus.

---

## Ventajas
- Sincronización automática y escalable.
- Menos duplicidad y menos riesgo de errores.
- Base sólida para personalización, IA proactiva y comunidad.

---

**Próximo paso:** Implementar `/src/stores/appStore.ts` con esta estructura y un ejemplo mínimo de emisión y escucha de eventos.
