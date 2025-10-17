# Quick Wins - Checklist de Acción Inmediata

**Objetivo:** Mejoras rápidas con alto impacto en las próximas 2 semanas  
**Esfuerzo total:** ~34 horas  
**Impacto:** 🚀 Alto - Mejora masiva en UX percibido

---

## Semana 1: Foundation & Stability

### 🔴 Día 1-2: Error Handling Global (8h)

**Problema:** Errores causan pantallas blancas, usuario perdido

#### Tareas
- [ ] Crear `src/components/ErrorBoundary.tsx`
  ```tsx
  export class ErrorBoundary extends Component<Props, State> {
    // Captura errores de React
    // Muestra UI de fallback amigable
    // Log a Sentry
  }
  ```

- [ ] Crear `src/lib/errorHandler.ts`
  ```ts
  export const handleError = (error: unknown) => {
    logger.error(error);
    toast.error(getUserFriendlyMessage(error));
    errorTracking.capture(error);
  };
  ```

- [ ] Envolver `<App />` con `<ErrorBoundary>`

- [ ] Reemplazar `catch (error) { console.error(error) }` por `handleError(error)` en:
  - [ ] `src/features/pantry/pantryService.ts`
  - [ ] `src/features/recipes/services/recipeService.ts`
  - [ ] `src/features/planning/planningService.ts`
  - [ ] `src/features/shopping-list/shoppingListService.ts`

**Verificación:**
- Tirar error intencional → Ver UI de fallback
- Error en service → Ver toast descriptivo
- Revisar Sentry dashboard

---

### 🟡 Día 2-3: Loading Skeletons (6h)

**Problema:** Usuario no sabe si app está cargando o trabada

#### Tareas
- [ ] Crear `src/components/common/Skeleton.tsx`
  ```tsx
  export const Skeleton = ({ variant, width, height }) => (
    <div className="animate-pulse bg-gray-200 rounded" />
  );
  ```

- [ ] Crear skeletons específicos:
  - [ ] `PantrySkeleton.tsx` - Grid de cards
  - [ ] `RecipeListSkeleton.tsx` - Lista de cards
  - [ ] `PlanningCalendarSkeleton.tsx` - Grid semanal
  - [ ] `ShoppingListSkeleton.tsx` - Lista de items

- [ ] Implementar en páginas:
  ```tsx
  if (isLoading) return <PantrySkeleton />;
  if (error) return <ErrorState error={error} />;
  return <ActualContent />;
  ```

**Páginas a actualizar:**
- [ ] `src/features/pantry/PantryPage.tsx`
- [ ] `src/features/recipes/pages/RecipeListPage.tsx`
- [ ] `src/features/planning/PlanningPage.tsx`
- [ ] `src/features/shopping-list/ShoppingListPage.tsx`

**Verificación:**
- Throttle network a "Slow 3G"
- Navegar entre páginas
- Debe verse skeleton suave, no pantalla blanca

---

### 🟢 Día 3: Toast Notifications (4h)

**Problema:** Usuario no sabe si acción tuvo éxito

#### Tareas
- [ ] Configurar Sonner en `src/lib/toast.ts`
  ```ts
  import { toast as sonnerToast } from 'sonner';
  
  export const toast = {
    success: (msg: string) => sonnerToast.success(msg, { 
      duration: 3000,
      icon: '✅' 
    }),
    error: (msg: string) => sonnerToast.error(msg, { 
      duration: 5000,
      icon: '❌' 
    }),
    loading: (msg: string) => sonnerToast.loading(msg),
  };
  ```

- [ ] Añadir `<Toaster />` en `App.tsx`

- [ ] Implementar toasts en acciones CRUD:
  
  **Pantry:**
  - [ ] Añadir ítem → "✅ Añadido a la despensa"
  - [ ] Editar ítem → "✅ Actualizado"
  - [ ] Eliminar ítem → "✅ Eliminado"
  - [ ] Error → "❌ No se pudo añadir. Intenta nuevamente"

  **Recipes:**
  - [ ] Crear receta → "✅ Receta guardada"
  - [ ] Eliminar receta → "✅ Receta eliminada"
  - [ ] Generar con IA → Loading toast → Success

  **Planning:**
  - [ ] Añadir comida → "✅ Añadido al plan"
  - [ ] Generar plan → "✨ Plan generado exitosamente"

  **Shopping List:**
  - [ ] Marcar comprado → "✅ Marcado como comprado"
  - [ ] Generar lista → "✅ Lista generada"

**Archivos a modificar:**
- [ ] `src/stores/pantryStore.ts` - En cada acción
- [ ] `src/stores/recipeStore.ts` - En cada acción
- [ ] `src/stores/planningStore.ts` - En cada acción
- [ ] `src/stores/shoppingListStore.ts` - En cada acción

**Verificación:**
- Hacer cada acción CRUD
- Verificar toast aparece y desaparece
- Verificar mensajes en español

---

### 🔴 Día 4-5: Mobile Responsive Fixes (8h)

**Problema:** Algunas vistas rompen en móvil

#### Tareas

**Pantry:**
- [ ] Grid responsive: 1 col en móvil, 2 en tablet, 3+ en desktop
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  ```

- [ ] Filtros: Colapsables en móvil
- [ ] Input: Full width en móvil

**Planning:**
- [ ] Calendario: Usar `MobileWeekCarousel` en móvil (ya existe)
- [ ] Asegurar breakpoint correcto:
  ```tsx
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <MobileView /> : <DesktopView />;
  ```

**Recipes:**
- [ ] Cards: 1 col móvil, 2 tablet, 3 desktop
- [ ] Formulario: Inputs apilados en móvil

**Shopping List:**
- [ ] Mapa: Colapsable en móvil
- [ ] Lista: Full width cuando mapa cerrado
- [ ] Touch targets: Min 44px

**General:**
- [ ] Navbar: Sticky top en móvil
- [ ] Sidebar: Drawer en móvil (ya implementado?)
- [ ] Botones: Touch-friendly (min-height: 44px)

**Archivos a revisar:**
- [ ] `src/features/pantry/components/PantryGrid.tsx`
- [ ] `src/features/planning/PlanningPage.tsx`
- [ ] `src/features/recipes/pages/RecipeListPage.tsx`
- [ ] `src/features/shopping-list/ShoppingListPage.tsx`

**Testing:**
- [ ] Chrome DevTools: 375px (iPhone SE)
- [ ] Chrome DevTools: 768px (iPad)
- [ ] Dispositivo real si es posible

**Verificación:**
- Todas las páginas navegables en 375px
- No hay scroll horizontal
- Botones presionables fácilmente

---

## Semana 2: Validation & Data Integrity

### 🔴 Día 6-7: Zod Validation - Pantry (6h)

**Problema:** Datos inválidos pueden guardarse

#### Tareas
- [ ] Crear `src/lib/schemas/pantrySchemas.ts`
  ```ts
  import { z } from 'zod';
  
  export const pantryItemSchema = z.object({
    ingredient_name: z.string()
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim(),
    quantity: z.coerce.number()
      .positive('Debe ser positivo')
      .max(10000, 'Cantidad muy grande'),
    unit: z.string()
      .min(1, 'Selecciona una unidad'),
    category: z.string().optional(),
    notes: z.string().max(500).optional(),
  });
  
  export type PantryItemInput = z.infer<typeof pantryItemSchema>;
  ```

- [ ] Integrar en `UnifiedPantryInput.tsx`
  ```tsx
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  
  const form = useForm({
    resolver: zodResolver(pantryItemSchema),
  });
  ```

- [ ] Mostrar errores de validación en el form
  ```tsx
  {form.formState.errors.ingredient_name && (
    <p className="text-red-500 text-sm">
      {form.formState.errors.ingredient_name.message}
    </p>
  )}
  ```

- [ ] Validar server-side en `pantryService.ts`
  ```ts
  export const addPantryItem = async (data: unknown) => {
    const validated = pantryItemSchema.parse(data); // Throws si inválido
    // ... guardar en DB
  };
  ```

**Verificación:**
- Intentar añadir con campos vacíos → Ver errores
- Intentar cantidad negativa → Ver error
- Datos válidos → Guardar exitosamente

---

### 🟡 Día 7-8: Zod Validation - Recipes (6h)

**Problema:** Recetas sin ingredientes, instrucciones vacías

#### Tareas
- [ ] Crear `src/lib/schemas/recipeSchemas.ts`
  ```ts
  export const recipeIngredientSchema = z.object({
    ingredient_name: z.string().min(1),
    quantity: z.coerce.number().positive().optional(),
    unit: z.string().optional(),
  });
  
  export const recipeSchema = z.object({
    name: z.string()
      .min(3, 'Nombre muy corto')
      .max(200, 'Nombre muy largo'),
    description: z.string()
      .max(1000, 'Descripción muy larga')
      .optional(),
    instructions: z.string()
      .min(10, 'Instrucciones muy cortas'),
    prep_time: z.coerce.number()
      .positive()
      .max(1440, 'Máximo 24 horas')
      .optional(),
    ingredients: z.array(recipeIngredientSchema)
      .min(1, 'Añade al menos un ingrediente'),
    tags: z.array(z.string()).optional(),
  });
  ```

- [ ] Integrar en `AddEditRecipePage.tsx`

- [ ] Validar en `recipeService.ts`

**Verificación:**
- Intentar guardar receta sin nombre → Error
- Intentar guardar sin ingredientes → Error
- Instrucciones < 10 chars → Error

---

## Bonus: Si Sobra Tiempo

### 🟢 Performance Quick Wins (4h)

- [ ] Lazy load rutas:
  ```tsx
  const PantryPage = lazy(() => import('./features/pantry/PantryPage'));
  ```

- [ ] Añadir `React.memo` a componentes pesados:
  ```tsx
  export const RecipeCard = React.memo(({ recipe }) => {
    // ...
  });
  ```

- [ ] Usar Zustand selectors específicos:
  ```tsx
  // Malo
  const store = usePantryStore();
  
  // Bueno
  const items = usePantryStore(state => state.items);
  ```

---

## Checklist de Verificación Final

### Funcional
- [ ] Todas las acciones CRUD muestran feedback (toast)
- [ ] Errores muestran UI amigable, no pantalla blanca
- [ ] Loading states en todas las páginas
- [ ] Validación funciona en todos los formularios

### Mobile
- [ ] App navegable en 375px sin scroll horizontal
- [ ] Botones touch-friendly (min 44px)
- [ ] Planning calendar funciona en móvil
- [ ] Pantry grid responsive

### Testing Manual
- [ ] Crear ítem en despensa → Éxito
- [ ] Crear receta → Éxito
- [ ] Generar plan semanal → Éxito
- [ ] Generar lista de compras → Éxito
- [ ] Todo lo anterior en móvil → Éxito

### Metrics
- [ ] `npm run build` → Sin warnings críticos
- [ ] Bundle size → Documentar actual
- [ ] Lighthouse → Ejecutar y documentar score

---

## Comandos Útiles

```bash
# Verificar build
npm run build

# Tests
npm run test

# Lighthouse
npx lighthouse http://localhost:5173 --view

# Bundle analysis
npm run build
# Abrir bundle-stats.html

# Audit security
npm audit

# Find TODO/FIXME
grep -r "TODO\|FIXME" src/ --line-number
```

---

## Tracking Progress

Marca cada tarea completada con `[x]`.

**Progreso Semana 1:** 0/5 tareas  
**Progreso Semana 2:** 0/2 tareas  
**Progreso Total:** 0% (0/26 horas completadas)

---

## Próximos Pasos Después de Quick Wins

Una vez completado este checklist, continuar con:

1. **Optimización Queries Supabase** (del plan completo)
2. **Sincronización Despensa-Planificador** (feature crítica)
3. **Tests E2E básicos** (onboarding, recipe creation)

Ver `PLAN_OPTIMIZACION_COMPLETO.md` para el roadmap completo.

---

**Última actualización:** Octubre 2025  
**Dueño:** Equipo Dev  
**Review:** Al completar cada sección

