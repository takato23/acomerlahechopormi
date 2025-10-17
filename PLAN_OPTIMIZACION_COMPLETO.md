# Plan Completo de Optimización y Adecuación - "A comerla"

**Versión:** 1.0  
**Fecha:** Octubre 2025  
**Objetivo:** Transformar el MVP avanzado en una aplicación production-ready, optimizada y pulida

---

## Índice

1. [Fase 0: Auditoría y Preparación](#fase-0-auditoría-y-preparación)
2. [Fase 1: Estabilización Critical (Backend)](#fase-1-estabilización-crítica-backend)
3. [Fase 2: Optimización UX/UI](#fase-2-optimización-uxui)
4. [Fase 3: Performance y Escalabilidad](#fase-3-performance-y-escalabilidad)
5. [Fase 4: Testing y Quality Assurance](#fase-4-testing-y-quality-assurance)
6. [Fase 5: Features Faltantes Core](#fase-5-features-faltantes-core)
7. [Fase 6: Polish y Detalles](#fase-6-polish-y-detalles)
8. [Fase 7: Preparación Beta](#fase-7-preparación-beta)

---

## Fase 0: Auditoría y Preparación
**Duración:** 3-5 días  
**Prioridad:** 🔴 Crítica

### Objetivos
- Identificar y documentar todos los bugs existentes
- Establecer baseline de performance
- Configurar herramientas de monitoreo

### Tareas

#### ~~0.1 Auditoría de Bugs~~ _(Cerrado 15/10/2025 — auditoría completa se reprograma; health check no detectó bugs críticos nuevos)_
- [ ] ~~Revisar y categorizar `failures.md`~~
- [ ] ~~Revisar `consola errores planificador.md`~~
- [ ] ~~Ejecutar la app y documentar errores de consola~~
- [ ] ~~Probar todos los flujos principales (User Journey)~~
- [ ] ~~Crear matriz de bugs: Crítico/Alto/Medio/Bajo~~

> Observación: se consolida el health check en `NEXT_ACTIONS.md`; pendientes de auditoría detallada vuelven a la Fase 1.

#### ~~0.2 Análisis de TODOs/FIXMEs~~ _(Cerrado 15/10/2025 — seguimiento detallado movido a Fase 1)_
- [ ] ~~Revisar 33 TODOs identificados en el código~~
- [ ] ~~Clasificar por prioridad~~
- [ ] ~~Asignar a fases del plan~~

> Observación: `docs/TODO_INVENTORY.md` queda como referencia; revisitar durante planificación de Fase 1.

#### ~~0.3 Performance Baseline~~ _(Cerrado 15/10/2025 — baseline parcial documentada; mediciones profundas pasan a Fases 2-3)_
- [ ] ~~Medir tiempo de carga inicial (Lighthouse)~~
- [ ] ~~Medir tiempo de navegación entre rutas~~
- [ ] ~~Identificar componentes lentos (React DevTools Profiler)~~
- [ ] ~~Medir tamaño del bundle (`npm run build`)~~

> Observaciones: se registran tamaños de bundle (principal ~1.55 MB sin comprimir, ShoppingList ~0.74 MB) y warnings de `eval`. Lighthouse/Profiler se agenda para fases de optimización.

#### ~~0.4 Configurar Herramientas~~ _(Cerrado 15/10/2025 — configuraciones avanzadas movidas a Fase 1 para priorizar feature freeze)_
- [ ] ~~Error tracking: Sentry o similar~~
- [ ] ~~Analytics: Verificar PostHog~~
- [ ] ~~Logging estructurado: Winston o Pino~~
- [ ] ~~Monitoreo: Supabase Dashboard~~

> Nota: no se realizaron cambios esta semana; se documenta cerrada la Fase 0 y se reprograma la implementación en Fase 1.

---

## Fase 1: Estabilización Crítica (Backend)
**Duración:** 1-2 semanas  
**Prioridad:** 🔴 Crítica

### Objetivos
- Resolver todos los bugs críticos
- Implementar error handling robusto
- Asegurar integridad de datos

### Tareas

#### 1.1 Error Handling Global _(actualizado 15/10/2025)_

**Problema:** No hay manejo estandarizado de errores

**Solución:**
- [x] Crear `ErrorBoundary` global (`src/components/ErrorBoundary.tsx`) integrado con Sentry.
- [x] Implementar sistema de toasts consistente (`src/lib/notifications.ts` aplicado en planning/pantry/sugerencias).
- [x] Crear utilidad de error handling (`src/lib/errorHandler.ts`) con logging estructurado y puente a Sentry.

**Archivos:**
```
src/components/ErrorBoundary.tsx (crear)
src/lib/errorHandler.ts (crear)
src/lib/apiClient.ts (crear wrapper Supabase)
```

**Implementación:**
```typescript
// src/lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleError = (error: unknown) => {
  // Logging
  logger.error(error);
  
  // User feedback
  if (error instanceof AppError) {
    toast.error(error.message);
  } else {
    toast.error('Algo salió mal. Por favor, intenta nuevamente.');
  }
  
  // Track
  errorTracking.capture(error);
};
```

#### 1.2 Validación de Datos

**Problema:** Validación inconsistente en formularios

**Solución:**
- [ ] Crear schemas Zod para todas las entidades
- [ ] Implementar validación client + server
- [ ] Mensajes de error descriptivos en español

**Archivos:**
```
src/lib/schemas/
  ├── pantrySchemas.ts (crear)
  ├── recipeSchemas.ts (crear)
  ├── planningSchemas.ts (crear)
  └── userSchemas.ts (crear)
```

**Ejemplo:**
```typescript
// src/lib/schemas/pantrySchemas.ts
import { z } from 'zod';

export const pantryItemSchema = z.object({
  ingredient_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  quantity: z.number()
    .positive('La cantidad debe ser positiva')
    .max(10000, 'Cantidad demasiado grande'),
  unit: z.string().min(1, 'Selecciona una unidad'),
  category: z.string().optional(),
});
```

#### 1.3 Sincronización Despensa-Planificador

**Problema:** Verificación manual de ingredientes disponibles

**Solución:**
- [ ] Crear hook `usePantrySync` con subscripción real-time
- [ ] Auto-actualizar disponibilidad al cambiar despensa
- [ ] Marcar ingredientes faltantes en rojo

**Archivos:**
```
src/hooks/usePantrySync.ts (crear)
src/features/planning/hooks/usePlanningPantrySync.ts (mejorar)
```

**Implementación:**
```typescript
// src/hooks/usePantrySync.ts
export const usePantrySync = (recipeIds: string[]) => {
  const [availability, setAvailability] = useState({});
  
  useEffect(() => {
    const channel = supabase
      .channel('pantry_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pantry_items' },
        () => checkAvailability(recipeIds)
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [recipeIds]);
  
  return availability;
};
```

#### 1.4 Optimización de Queries Supabase

**Problema:** Queries ineficientes, múltiples llamadas

**Solución:**
- [ ] Implementar joins en lugar de múltiples queries
- [ ] Usar select() específico (no `*`)
- [ ] Implementar pagination en listas largas
- [ ] Caché con React Query

**Archivos a revisar:**
```
src/features/*/services/*.ts (todos los servicios)
```

**Ejemplo:**
```typescript
// Antes
const recipes = await supabase.from('recipes').select('*');
const ingredients = await supabase.from('recipe_ingredients')
  .in('recipe_id', recipes.map(r => r.id));

// Después
const recipes = await supabase
  .from('recipes')
  .select('id, name, description, recipe_ingredients(*))')
  .range(0, 49); // Pagination
```

#### 1.5 Resolver Errores 500

**Problema:** Errores del servidor documentados en `failures.md`

**Solución:**
- [ ] Reproducir cada error 500
- [ ] Fix en orden de prioridad
- [ ] Añadir tests de regresión

**Checklist:**
- [ ] Vite server errors (revisar imports circulares)
- [ ] Supabase RLS policies (verificar permisos)
- [ ] TypeScript errors en build
- [ ] Missing environment variables

---

## Fase 2: Optimización UX/UI
**Duración:** 2-3 semanas  
**Prioridad:** 🟡 Alta

### Objetivos
- Mejorar flujos de usuario
- Consistencia visual
- Responsive design completo
- Accesibilidad básica

### Tareas

#### 2.1 Sistema de Diseño Consistente

**Problema:** Espaciados y colores inconsistentes

**Solución:**
- [ ] Documentar tokens de diseño
- [ ] Crear componentes base reutilizables
- [ ] Estandarizar espaciados (usar múltiplos de 4)

**Archivos:**
```
docs/DESIGN_SYSTEM.md (crear)
src/styles/tokens.css (crear)
src/components/ui/* (revisar todos)
```

**Tokens a definir:**
```css
/* src/styles/tokens.css */
:root {
  /* Spacing */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  
  /* Colors */
  --color-primary: ...;
  --color-secondary: ...;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  /* ... */
}
```

#### 2.2 Responsive Design Completo

**Problema:** Algunas vistas no optimizadas para móvil

**Solución:**
- [ ] Auditar todas las páginas en móvil (320px, 375px, 768px)
- [ ] Implementar mobile-first donde falta
- [ ] Touch targets mínimo 44px
- [ ] Bottom navigation para móvil

**Páginas a revisar:**
- [ ] PantryPage (grid responsive)
- [ ] RecipeListPage (cards)
- [ ] PlanningPage (calendario móvil)
- [ ] ShoppingListPage (mapa + lista)
- [ ] UserProfilePage (formulario)

**Componentes a crear:**
```
src/components/layout/MobileNav.tsx (crear)
src/components/layout/ResponsiveContainer.tsx (crear)
```

#### 2.3 Estados de Carga y Vacío

**Problema:** Estados de loading genéricos, empty states pobres

**Solución:**
- [x] Crear componente `<Skeleton />` reutilizable (`src/components/ui/skeleton.tsx`).
- [ ] Mejorar todos los `<EmptyState />`
- [ ] Loading con animaciones suaves

**Archivos:**
```
src/components/ui/skeleton.tsx (creado 15/10/2025)
src/components/common/EmptyState.tsx (mejorar)
src/components/common/LoadingSpinner.tsx (mejorar)
```

**Implementación:**
```typescript
// src/components/common/Skeleton.tsx
export const Skeleton = ({ 
  variant = 'text',
  width,
  height,
  className 
}: SkeletonProps) => {
  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        variant === 'text' && 'h-4',
        variant === 'circular' && 'rounded-full',
        className
      )}
      style={{ width, height }}
    />
  );
};
```

**Empty States a mejorar:**
- [ ] Sin recetas → ilustración + CTA
- [ ] Sin ingredientes en despensa → onboarding
- [ ] Sin plan → botón generar con IA
- [ ] Sin lista de compras → instrucciones claras

#### 2.4 Feedback Visual

**Problema:** Falta feedback en acciones

**Solución:**
- [ ] Confirmación visual en todas las acciones CRUD
- [ ] Toasts con iconos y colores semánticos
- [ ] Optimistic updates donde sea posible
- [ ] Animaciones de entrada/salida

**Componentes:**
```typescript
// src/lib/toast.ts (configurar Sonner)
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => 
    sonnerToast.success(message, { duration: 3000 }),
  error: (message: string) => 
    sonnerToast.error(message, { duration: 5000 }),
  loading: (message: string) => 
    sonnerToast.loading(message),
  promise: async (promise, messages) => 
    sonnerToast.promise(promise, messages),
};
```

**Implementar en:**
- [ ] Pantry: añadir/editar/eliminar
- [ ] Recipes: crear/editar/eliminar/favorito
- [ ] Planning: asignar/mover/eliminar comida
- [ ] Shopping List: marcar comprado

#### 2.5 Navegación y Flujos

**Problema:** Algunos flujos confusos

**Solución:**
- [ ] Breadcrumbs en páginas de detalle
- [ ] Back buttons consistentes
- [ ] Confirmación antes de acciones destructivas
- [ ] Shortcuts de teclado (opcional)

**Mejoras específicas:**

**Dashboard:**
- [ ] Añadir cards de "Acciones Rápidas"
- [ ] Stats visuales (gráficos simples)

**Planificador:**
- [ ] Tutorial first-time
- [ ] Drag preview más claro
- [ ] Multi-select para acciones en lote

**Recetas:**
- [ ] Filtros avanzados en sidebar
- [ ] Vista grid/list toggle
- [ ] Quick actions en hover

**Lista de Compras:**
- [ ] Categorías colapsables
- [ ] Modo "super" (ocultar comprados)
- [ ] Export a PDF/WhatsApp

#### 2.6 Accesibilidad (WCAG AA)

**Problema:** Accesibilidad no validada

**Solución:**
- [ ] Contraste de colores mínimo 4.5:1
- [ ] Focus visible en todos los interactivos
- [ ] Labels en todos los inputs
- [ ] ARIA labels donde necesario
- [ ] Navegación por teclado completa

**Herramientas:**
```bash
npm install -D axe-core @axe-core/react
```

**Checklist:**
- [ ] Ejecutar axe DevTools en todas las páginas
- [ ] Fix todos los issues críticos
- [ ] Añadir skip links
- [ ] Landmarks ARIA correctos

#### 2.7 Animaciones y Transiciones

**Problema:** Transiciones bruscas

**Solución:**
- [ ] Usar Framer Motion consistentemente
- [ ] Transiciones de ruta
- [ ] Micro-interacciones (hover, click)
- [ ] Reducir motion para usuarios con preferencia

**Implementación:**
```typescript
// src/components/AnimatedPage.tsx
export const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

#### 2.8 Optimización Bundles (>50 KB) _(15/10/2025)_

- [ ] **`lottie-web` + `Main Scene.json` (~0.78 MB)** — Lazy-load del hero en Landing y exportar preview estático (captura PNG + CTA). _Responsable sugerido:_ UI (S. Balosky).
- [ ] **`@zxing/library` (~1.2 MB)** — Separar el lector de códigos en chunk dinámico y evaluar `@zxing/browser` con tree-shaking, dejando sólo QR en bundle inicial. _Responsable:_ Feature Shopping (P. Giménez).
- [ ] **`framer-motion` (~0.36 MB)** — Inventariar animaciones; migrar secciones estáticas a CSS/`transition` y usar `LazyMotion` para rutas protegidas. _Responsable:_ UI Guild.
- [ ] **`date-fns` locales (~0.10 MB)** — Cambiar a imports individualizados (`date-fns/format`, `date-fns/addWeeks`) y cachear formateos en planning/dashboard. _Responsable:_ Planning (Nico DF).
- [ ] **`@floating-ui` (~0.08 MB)** — Auditar solapamiento con Radix Popover/Tooltip; evaluar migración a `@floating-ui/react-dom` ligera. _Responsable:_ Plataforma (por asignar).

> Acción inmediata: crear issues backlog `perf-001`…`perf-005` con mediciones previas/post (`npm run build --report`) y objetivo de reducción ≥30 % por módulo.

---

## Fase 3: Performance y Escalabilidad
**Duración:** 1-2 semanas  
**Prioridad:** 🟡 Alta

### Objetivos
- Reducir tiempo de carga
- Optimizar re-renders
- Implementar lazy loading
- Mejorar gestión de memoria

### Tareas

#### 3.1 Code Splitting y Lazy Loading

**Problema:** Bundle monolítico grande

**Solución:**
- [ ] Route-based code splitting
- [ ] Component-based lazy loading
- [ ] Prefetch de rutas críticas

**Implementación:**
```typescript
// src/routes/routes.tsx
const PantryPage = lazy(() => import('@/features/pantry/PantryPage'));
const RecipesPage = lazy(() => import('@/features/recipes/pages/RecipeListPage'));
const PlanningPage = lazy(() => import('@/features/planning/PlanningPage'));

// Con suspense
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/pantry" element={<PantryPage />} />
    {/* ... */}
  </Routes>
</Suspense>
```

#### 3.2 Virtualización de Listas

**Problema:** Listas largas causan lag

**Solución:**
- [ ] Implementar `@tanstack/react-virtual` en todas las listas
- [ ] Windowing en pantry grid
- [ ] Infinite scroll en recetas

**Archivos a modificar:**
```
src/features/pantry/components/PantryItemsView.tsx
src/features/recipes/components/RecipeList.tsx
src/features/shopping-list/components/ShoppingListContent.tsx (ya tiene)
```

**Ejemplo:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const PantryVirtualList = ({ items }) => {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index}>
            <PantryItem item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 3.3 Optimización de Re-renders

**Problema:** Componentes re-renderizan innecesariamente

**Solución:**
- [ ] Usar `React.memo` en componentes pesados
- [ ] `useMemo` para cálculos costosos
- [ ] `useCallback` para funciones pasadas como props
- [ ] Zustand selectors específicos

**Componentes a optimizar:**
```
src/features/pantry/components/PantryItemCard.tsx
src/features/recipes/components/RecipeCard.tsx
src/features/planning/components/MealCard.tsx
```

**Ejemplo:**
```typescript
// Antes
const PantryPage = () => {
  const { items } = usePantryStore();
  // Todos los cambios en store causan re-render
};

// Después
const PantryPage = () => {
  const items = usePantryStore(state => state.items); // Selector específico
  const filteredItems = useMemo(
    () => items.filter(item => item.category === selectedCategory),
    [items, selectedCategory]
  );
};
```

#### 3.4 Caché y Data Fetching

**Problema:** Múltiples fetches de los mismos datos

**Solución:**
- [ ] Implementar React Query
- [ ] Caché de queries frecuentes
- [ ] Stale-while-revalidate strategy
- [ ] Prefetch de datos relacionados

**Instalación:**
```bash
npm install @tanstack/react-query
```

**Implementación:**
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});

// src/features/pantry/hooks/usePantryItems.ts
export const usePantryItems = () => {
  return useQuery({
    queryKey: ['pantry', 'items'],
    queryFn: pantryService.getPantryItems,
  });
};
```

#### 3.5 Optimización de Imágenes

**Problema:** Imágenes sin optimizar

**Solución:**
- [ ] Lazy loading de imágenes
- [ ] Responsive images (srcset)
- [ ] WebP con fallback
- [ ] Placeholders (blur-up)

**Componente:**
```typescript
// src/components/common/OptimizedImage.tsx
export const OptimizedImage = ({ 
  src, 
  alt, 
  placeholder 
}: ImageProps) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!loaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          'transition-opacity',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};
```

#### 3.6 Bundle Analysis y Tree Shaking

**Problema:** Dependencias no utilizadas

**Solución:**
- [ ] Analizar bundle con `rollup-plugin-visualizer`
- [ ] Remover dependencias no usadas
- [ ] Usar imports específicos (no `import *`)

**Comando:**
```bash
npm run build
# Revisa bundle-stats.html (ya existe)
```

**Optimizaciones:**
```typescript
// Antes
import * as Icons from 'lucide-react';

// Después
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
```

---

## Fase 4: Testing y Quality Assurance
**Duración:** 2-3 semanas  
**Prioridad:** 🟡 Alta

### Objetivos
- Cobertura de tests > 80%
- Tests E2E de flujos críticos
- CI/CD pipeline
- Quality gates

### Tareas

#### 4.1 Tests Unitarios

**Meta:** 80% cobertura en servicios y utils

**Tareas:**
- [ ] Tests para todos los servicios sin coverage
- [ ] Tests para stores de Zustand
- [ ] Tests para hooks personalizados
- [ ] Tests para utilidades

**Archivos a crear:**
```
src/features/ingredients/ingredientService.test.ts
src/features/dashboard/DashboardPage.test.tsx
src/stores/recipeStore.test.ts
src/stores/shoppingListStore.test.ts
src/hooks/usePantrySync.test.ts
```

**Ejemplo:**
```typescript
// src/features/pantry/pantryService.test.ts
describe('pantryService', () => {
  describe('getPantryItems', () => {
    it('should fetch pantry items for user', async () => {
      const items = await pantryService.getPantryItems();
      expect(items).toBeInstanceOf(Array);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error
      await expect(pantryService.getPantryItems())
        .rejects.toThrow();
    });
  });
});
```

#### 4.2 Tests de Integración

**Meta:** Flujos completos de features

**Tareas:**
- [ ] Test: Añadir ítem a despensa → verificar en lista
- [ ] Test: Crear receta → aparece en planning
- [ ] Test: Generar plan → crea lista de compras
- [ ] Test: Marcar comprado → persiste estado

**Archivos:**
```
src/features/__integration__/pantry-planning.test.tsx (crear)
src/features/__integration__/planning-shopping.test.tsx (crear)
```

#### 4.3 Tests E2E (Playwright)

**Meta:** Flujos críticos de usuario cubiertos

**Tareas:**
- [ ] Test: Onboarding completo
- [ ] Test: Crear receta y añadir al plan
- [ ] Test: Generar plan semanal con IA
- [ ] Test: Crear lista de compras desde plan
- [ ] Test: Actualizar perfil de usuario
- [ ] Test: Mobile responsive flows

**Archivos:**
```
tests/e2e/
  ├── onboarding.spec.ts
  ├── recipe-creation.spec.ts
  ├── weekly-planning.spec.ts
  ├── shopping-list.spec.ts
  └── user-profile.spec.ts
```

**Ejemplo:**
```typescript
// tests/e2e/recipe-creation.spec.ts
test('crear receta y añadirla al plan', async ({ page }) => {
  await page.goto('/app/recipes');
  await page.click('text=Añadir Receta');
  
  await page.fill('[name="name"]', 'Pasta Carbonara');
  await page.fill('[name="description"]', 'Pasta cremosa');
  // ...
  await page.click('text=Guardar');
  
  await expect(page.locator('text=Pasta Carbonara')).toBeVisible();
  
  // Añadir al plan
  await page.goto('/app/planning');
  await page.click('[data-meal-slot="monday-lunch"]');
  await page.click('text=Pasta Carbonara');
  
  await expect(page.locator('[data-meal="monday-lunch"] text=Pasta Carbonara'))
    .toBeVisible();
});
```

#### 4.4 CI/CD Pipeline

**Problema:** No hay integración continua

**Solución:**
- [ ] GitHub Actions workflow
- [ ] Run tests on PR
- [ ] Run linter on PR
- [ ] Type checking
- [ ] Build verification

**Archivo:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

#### 4.5 Quality Gates

**Implementar:**
- [ ] Pre-commit hooks (ya existen, verificar)
- [ ] Pre-push hooks (tests)
- [ ] Coverage thresholds en Jest

**Archivo:**
```javascript
// jest.config.js
module.exports = {
  // ...
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

---

## Fase 5: Features Faltantes Core
**Duración:** 2-3 semanas  
**Prioridad:** 🟢 Media

### Objetivos
- Completar widgets del dashboard
- Implementar notificaciones básicas
- Mejorar generación IA

### Tareas

#### 5.1 Completar Dashboard Widgets

**LowStockWidget:**
- [ ] Implementar lógica de "bajo stock"
- [ ] Definir threshold (ej: < 20% de cantidad normal)
- [ ] CTA: "Añadir a lista de compras"

**Archivo:**
```typescript
// src/features/dashboard/components/LowStockWidget.tsx
export const LowStockWidget = () => {
  const lowStockItems = usePantryStore(state => 
    state.items.filter(item => 
      item.quantity < (item.threshold || 1)
    )
  );
  
  if (lowStockItems.length === 0) {
    return <EmptyState icon={Package} title="Todo bien abastecido" />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items con bajo stock</CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockItems.map(item => (
          <LowStockItem key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
};
```

**FavoriteRecipesWidget:**
- [ ] Conectar con recipeStore real
- [ ] Mostrar top 5 favoritas
- [ ] Link a receta completa

#### 5.2 Sistema de Notificaciones In-App

**Problema:** No hay notificaciones

**Solución:**
- [ ] Crear sistema de notificaciones in-app
- [ ] Bell icon con contador
- [ ] Panel de notificaciones
- [ ] Marcar como leído

**Archivos:**
```
src/features/notifications/
  ├── NotificationCenter.tsx
  ├── NotificationBell.tsx
  ├── notificationService.ts
  └── types.ts
```

**Tipos de notificaciones:**
1. Ítem cerca de caducar (si hay fecha)
2. Plan semanal incompleto
3. Lista de compras pendiente
4. Receta sugerida disponible

**Implementación:**
```typescript
// src/features/notifications/types.ts
export type Notification = {
  id: string;
  type: 'expiry' | 'plan_incomplete' | 'suggestion';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
};
```

#### 5.3 Mejoras en Generación IA

**Tareas:**
- [ ] Agregar parámetros de control (creatividad, complejidad)
- [ ] Mejorar prompts con ejemplos few-shot
- [ ] Manejo de errores más robusto
- [ ] Retry automático con exponential backoff
- [ ] Streaming de respuestas (opcional)

**Archivo:**
```typescript
// src/features/recipes/generationService.ts
export const generateRecipe = async (
  description: string,
  options: GenerationOptions = {}
) => {
  const {
    creativity = 0.7,
    maxComplexity = 'medium',
    maxTime = 60,
  } = options;
  
  const prompt = buildPrompt(description, options);
  
  try {
    const response = await gemini.generateContent({
      prompt,
      temperature: creativity,
      maxTokens: 2000,
    });
    
    return parseResponse(response);
  } catch (error) {
    if (isRateLimitError(error)) {
      await wait(5000);
      return generateRecipe(description, options); // Retry
    }
    throw error;
  }
};
```

#### 5.4 Importación de Recetas desde URL

**Feature completa:**
- [ ] Input de URL
- [ ] Parser de HTML (usando Cheerio o similar)
- [ ] Extracción inteligente con IA
- [ ] Preview antes de guardar
- [ ] Detección de formato (JSON-LD, Microdata)

**Archivos:**
```
src/features/recipes/services/
  ├── recipeImporter.ts
  ├── htmlParser.ts
  └── schemaExtractor.ts
```

**Implementación:**
```typescript
// src/features/recipes/services/recipeImporter.ts
export const importRecipeFromUrl = async (url: string) => {
  // 1. Fetch HTML
  const html = await fetch(url).then(r => r.text());
  
  // 2. Try schema.org extraction
  const schemaRecipe = extractSchemaRecipe(html);
  if (schemaRecipe) return schemaRecipe;
  
  // 3. Try AI extraction
  const aiRecipe = await gemini.extractRecipe(html);
  return aiRecipe;
};
```

#### 5.5 Plantillas de Planificación

**Mejorar sistema existente:**
- [ ] Categorías de plantillas (vegetariano, bajo presupuesto, etc.)
- [ ] Plantillas públicas vs privadas
- [ ] Ratings de plantillas
- [ ] Clonar plantilla de otro usuario (futuro)

**Archivo:**
```
src/features/planning/services/templateService.ts (mejorar)
```

---

## Fase 6: Polish y Detalles
**Duración:** 1-2 semanas  
**Prioridad:** 🟢 Media-Baja

### Objetivos
- Pulir detalles visuales
- Mejorar copywriting
- Tooltips y ayudas contextuales
- Easter eggs opcionales

### Tareas

#### 6.1 Copywriting y Mensajes

**Revisar y mejorar:**
- [ ] Mensajes de error (empáticos, accionables)
- [ ] Empty states (inspiradores, claros)
- [ ] Botones CTA (verbos de acción)
- [ ] Onboarding copy (motivador)
- [ ] Placeholders en inputs (ejemplos útiles)

**Ejemplos:**

```typescript
// Antes
<EmptyState title="No hay recetas" />

// Después
<EmptyState 
  title="Tu libro de recetas está vacío"
  description="Empieza añadiendo tus recetas favoritas o genera nuevas con IA"
  action={
    <Button>
      <Sparkles className="mr-2" />
      Generar con IA
    </Button>
  }
/>
```

#### 6.2 Tooltips y Ayuda Contextual

**Implementar:**
- [ ] Tooltips en iconos y acciones
- [ ] Help icons con popover
- [ ] Tour guiado first-time (opcional)
- [ ] Keyboard shortcuts hints

**Componente:**
```typescript
// src/components/common/HelpTooltip.tsx
export const HelpTooltip = ({ content, children }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Uso
<HelpTooltip content="Marca esta receta como favorita para acceso rápido">
  <Button variant="ghost" size="icon">
    <Heart />
  </Button>
</HelpTooltip>
```

#### 6.3 Animaciones y Micro-interacciones

**Detalles:**
- [ ] Hover effects en cards
- [ ] Button press feedback
- [ ] Success animations (confetti?)
- [ ] Drag animations suaves
- [ ] Page transitions

**Biblioteca:**
```bash
npm install canvas-confetti
```

```typescript
// src/lib/celebrations.ts
import confetti from 'canvas-confetti';

export const celebrate = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

// Uso: Al completar onboarding, crear primera receta, etc.
```

#### 6.4 Temas y Personalización

**Opcional:**
- [ ] Dark mode (ya preparado con Tailwind?)
- [ ] Selector de color accent
- [ ] Tamaño de fuente (ya existe contexto, implementar)

**Implementación tamaño fuente:**
```typescript
// src/context/SettingsContext.tsx (mejorar)
const applyFontSize = (size: FontSize) => {
  const root = document.documentElement;
  const sizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  root.style.fontSize = sizeMap[size];
};
```

#### 6.5 Keyboard Shortcuts

**Implementar:**
- [ ] `/` - Focus search
- [ ] `n` - New item (context-aware)
- [ ] `Cmd/Ctrl + K` - Command palette (opcional)
- [ ] `Esc` - Close modals
- [ ] Arrow keys - Navigate lists

**Biblioteca:**
```bash
npm install react-hotkeys-hook
```

```typescript
import { useHotkeys } from 'react-hotkeys-hook';

const PantryPage = () => {
  useHotkeys('n', () => openAddItemModal());
  useHotkeys('/', () => focusSearch());
  // ...
};
```

---

## Fase 7: Preparación Beta
**Duración:** 1 semana  
**Prioridad:** 🔴 Crítica antes de lanzar

### Objetivos
- App production-ready
- Documentación completa
- Monitoring configurado
- Backup y recovery

### Tareas

#### 7.1 Documentación Usuario

**Crear:**
- [ ] FAQ page
- [ ] Tutoriales en video (opcional)
- [ ] Help center básico
- [ ] Privacy policy
- [ ] Terms of service

**Archivos:**
```
docs/user/
  ├── faq.md
  ├── getting-started.md
  ├── recipes-guide.md
  ├── planning-guide.md
  └── shopping-guide.md
```

#### 7.2 Documentación Técnica

**Actualizar:**
- [ ] README con setup actualizado
- [ ] API documentation
- [ ] Architecture decisions (ADR)
- [ ] Deployment guide
- [ ] Troubleshooting guide

#### 7.3 Monitoring y Alertas

**Configurar:**
- [ ] Sentry para errores frontend
- [ ] Supabase logs monitoring
- [ ] Performance monitoring (Core Web Vitals)
- [ ] Uptime monitoring (UptimeRobot o similar)
- [ ] Alertas en Slack/Email

**Dashboard:**
- [ ] Crear dashboard de métricas clave
- [ ] Users activos (PostHog)
- [ ] Errores (Sentry)
- [ ] Performance (Lighthouse CI)

#### 7.4 Security Audit

**Checklist:**
- [ ] Todas las RLS policies verificadas
- [ ] No hay API keys en el código
- [ ] CORS configurado correctamente
- [ ] Rate limiting en Edge Functions
- [ ] XSS protection
- [ ] CSRF tokens (si aplica)
- [ ] Dependencias sin vulnerabilidades (`npm audit`)

**Comandos:**
```bash
npm audit fix
npm outdated
```

#### 7.5 Backup y Recovery

**Implementar:**
- [ ] Backups automáticos de Supabase (verificar config)
- [ ] Export de datos de usuario
- [ ] Restore procedure documentado
- [ ] Disaster recovery plan

#### 7.6 Performance Final

**Validar métricas objetivo:**
- [ ] Lighthouse score > 90
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] TTI < 3.5s
- [ ] Bundle < 500KB gzipped
- [ ] 0 console errors
- [ ] 0 console warnings

#### 7.7 Beta Testing

**Preparar:**
- [ ] Feedback form in-app
- [ ] Bug report template
- [ ] Beta tester onboarding email
- [ ] Analytics events configurados
- [ ] Feature flags para rollout gradual

**LaunchDarkly flags:**
```typescript
{
  "ai-recipe-generation": { enabled: true, rollout: 100% },
  "vision-upload": { enabled: true, rollout: 50% }, // Gradual
  "social-sharing": { enabled: false }, // Not ready
}
```

---

## Cronograma General

### Mes 1
- Semana 1: Fase 0 (Auditoría)
- Semana 2-3: Fase 1 (Estabilización Backend)
- Semana 4: Fase 2 inicio (UX/UI)

### Mes 2
- Semana 1-2: Fase 2 continuación (UX/UI)
- Semana 3: Fase 3 (Performance)
- Semana 4: Fase 4 inicio (Testing)

### Mes 3
- Semana 1-2: Fase 4 continuación (Testing)
- Semana 3: Fase 5 (Features) + Fase 6 (Polish)
- Semana 4: Fase 7 (Preparación Beta)

**Total: ~3 meses para production-ready beta**

---

## Métricas de Éxito

### Técnicas
- [ ] 0 errores críticos en producción
- [ ] Cobertura de tests > 80%
- [ ] Lighthouse score > 90
- [ ] Tiempo de carga < 3s
- [ ] Bundle size < 500KB

### UX
- [ ] Tasa de completación onboarding > 80%
- [ ] Usuarios que crean >= 1 plan: > 70%
- [ ] NPS > 40
- [ ] < 5% bounce rate en dashboard

### Negocio
- [ ] 50+ beta testers
- [ ] 20+ reviews/feedback detallados
- [ ] 3+ planes semanales por usuario activo
- [ ] < 3% churn rate mensual

---

## Recursos Necesarios

### Humanos
- 1-2 desarrolladores full-time
- 1 diseñador (part-time para review)
- Beta testers (usuarios reales)

### Herramientas
- Sentry (error tracking) - $26/mes
- LaunchDarkly (feature flags) - gratis para dev
- PostHog (analytics) - gratis hasta cierto volumen
- Supabase Pro - $25/mes por proyecto
- Vercel Pro (hosting) - $20/mes

**Total: ~$100-150/mes durante desarrollo**

---

## Notas Finales

### Priorización
Si hay limitaciones de tiempo, el orden de prioridad es:

1. **Fase 1 (Backend)** - Crítico para estabilidad
2. **Fase 2 (UX)** - Crítico para retención
3. **Fase 4 (Testing)** - Crítico para confianza
4. **Fase 3 (Performance)** - Importante
5. **Fase 5 (Features)** - Deseable
6. **Fase 6 (Polish)** - Nice to have

### Iteración
Este plan es un MVP del plan. Después de cada fase:
- Revisar y ajustar prioridades
- Documentar aprendizajes
- Actualizar roadmap

### Comunicación
- Daily standups (async en Slack)
- Weekly review de métricas
- Bi-weekly demo de features
- Monthly retrospective

---

**Documento vivo - Actualizar conforme avanza el desarrollo**
