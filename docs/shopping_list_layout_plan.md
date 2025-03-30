# Plan de Reorganización del Layout de Lista de Compras

## 1. Objetivos

- Integrar todas las funcionalidades en una interfaz coherente
- Optimizar para diferentes tamaños de pantalla
- Mantener la usabilidad y accesibilidad
- Mejorar la experiencia de búsqueda de precios

## 2. Componentes Principales

### 2.1 Panel de Búsqueda
- Input de búsqueda con autocompletado
- Resultados en tiempo real
- Vista previa de precios rápida
- Integración con el mapa (resaltado de tiendas)

### 2.2 Lista de Compras
- Formulario de añadir item (manual)
- Quick Add (items frecuentes)
- Lista de items pendientes
- Lista de items comprados
- Acciones rápidas por item

### 2.3 Mapa Interactivo
- Visualización de tiendas
- Filtros de tiendas
- Info window mejorada
- Controles de zoom/pan
- Ubicación del usuario

## 3. Diseño Responsivo

### 3.1 Desktop (>1200px)
```
Layout de 3 columnas
- Col 1: Panel de Búsqueda (25%)
- Col 2: Lista de Compras (40%)
- Col 3: Mapa (35%)
```

### 3.2 Tablet (768px - 1199px)
```
Layout de 2 columnas
- Col 1: Lista + Búsqueda (60%)
- Col 2: Mapa (40%)
```

### 3.3 Móvil (<768px)
```
Layout Single Column + Bottom Sheet
- Principal: Lista + Búsqueda
- Bottom Sheet: Mapa expandible
```

## 4. Interacciones Principales

### 4.1 Búsqueda de Precios
1. Usuario ingresa término de búsqueda
2. Resultados aparecen en panel lateral
3. Tiendas relevantes se resaltan en el mapa
4. Click en resultado muestra detalles y centra mapa

### 4.2 Gestión de Lista
1. Añadir items (manual o quick add)
2. Items se muestran en lista scrolleable
3. Acciones por item (marcar, eliminar, buscar)
4. Vista colapsable de comprados

### 4.3 Interacción con Mapa
1. Ver todas las tiendas disponibles
2. Filtrar por tipo/cadena
3. Ver precios al hacer click
4. Marcar como favoritas
5. Ver ruta desde ubicación

## 5. Componentes React Necesarios

```typescript
// Estructura de componentes
src/features/shopping-list/
  ├── components/
  │   ├── SearchPanel/
  │   │   ├── SearchInput.tsx
  │   │   ├── SearchResults.tsx
  │   │   └── QuickView.tsx
  │   ├── ShoppingList/
  │   │   ├── AddItemForm.tsx
  │   │   ├── QuickAddSection.tsx
  │   │   └── ItemsList.tsx
  │   ├── Map/
  │   │   ├── ShoppingMap.tsx
  │   │   ├── StoreMarker.tsx
  │   │   └── MapControls.tsx
  │   └── Layout/
  │       ├── DesktopLayout.tsx
  │       ├── TabletLayout.tsx
  │       └── MobileLayout.tsx
```

## 6. Implementación por Fases

### Fase 1: Estructura Base
- Crear componentes base
- Implementar grid layout responsivo
- Migrar funcionalidad existente

### Fase 2: Mejoras de UX
- Añadir transiciones suaves
- Implementar bottom sheet para móvil
- Mejorar interactividad del mapa

### Fase 3: Integración
- Conectar búsqueda con mapa
- Implementar filtros de tiendas
- Añadir ubicación del usuario

### Fase 4: Optimización
- Lazy loading de componentes
- Caché de resultados
- Mejoras de performance

## 7. Consideraciones Técnicas

### CSS
```css
/* Grid Layout Base */
.shopping-page {
  display: grid;
  gap: 1rem;
  height: 100vh;
  
  @media (min-width: 1200px) {
    grid-template-columns: 25% 40% 35%;
  }
  
  @media (min-width: 768px) and (max-width: 1199px) {
    grid-template-columns: 60% 40%;
  }
  
  @media (max-width: 767px) {
    grid-template-columns: 100%;
  }
}
```

### Breakpoints
```typescript
const breakpoints = {
  mobile: 767,
  tablet: 1199,
  desktop: 1200
};
```

## 8. Testing y Validación

### 8.1 Tests de UI
- Responsive behavior
- Touch interactions
- Keyboard navigation
- Screen reader compatibility

### 8.2 Tests de Performance
- Time to interactive
- Layout shifts
- Map rendering
- Memory usage

## 9. Métricas de Éxito

- Time to complete common tasks
- User engagement with map
- Search result clicks
- Mobile vs desktop usage
- Error rates in different layouts