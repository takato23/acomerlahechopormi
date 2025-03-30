# Plan de Implementación: Sistema de Categorías

## 1. Estructura de Datos

### 1.1 Modelo de Categoría
```typescript
interface Category {
  id: string;
  name: string;
  icon?: string;     // Nombre del icono (ej: "vegetable", "dairy", "cleaning")
  color?: string;    // Color para visual feedback
  order: number;     // Para ordenamiento manual
  user_id?: string;  // Para categorías personalizadas
}
```

### 1.2 Extensión del Modelo de Item
```typescript
interface ShoppingListItem {
  // ... campos existentes ...
  category_id: string | null;  // Referencia a la categoría
  category_order?: number;     // Orden dentro de su categoría
}
```

## 2. Categorías Predefinidas

```typescript
const DEFAULT_CATEGORIES = [
  { id: 'vegetables', name: 'Verduras y Frutas', icon: 'carrot', color: '#4ade80' },
  { id: 'dairy', name: 'Lácteos', icon: 'milk', color: '#93c5fd' },
  { id: 'meat', name: 'Carnes', icon: 'beef', color: '#fca5a5' },
  { id: 'pantry', name: 'Almacén', icon: 'package', color: '#fcd34d' },
  { id: 'cleaning', name: 'Limpieza', icon: 'spray', color: '#a5b4fc' },
  { id: 'beverages', name: 'Bebidas', icon: 'bottle', color: '#f9a8d4' },
  { id: 'frozen', name: 'Congelados', icon: 'snowflake', color: '#93c5fd' },
  { id: 'other', name: 'Otros', icon: 'more', color: '#d4d4d4' },
];
```

## 3. Cambios en la Base de Datos

### 3.1 Nueva Tabla `categories`
```sql
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  color text,
  order integer not null default 0,
  user_id uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  is_default boolean default false
);

-- Índices
create index categories_user_id_idx on categories(user_id);
create index categories_order_idx on categories(order);
```

### 3.2 Modificar Tabla `shopping_list_items`
```sql
-- Añadir columna category_id
alter table shopping_list_items 
add column category_id uuid references categories(id),
add column category_order integer default 0;

-- Índice
create index items_category_id_idx on shopping_list_items(category_id);
```

## 4. Componentes UI

### 4.1 Selector de Categoría
- Componente modal/popover para seleccionar categoría
- Vista de grid con iconos y colores
- Opción para crear categoría personalizada

### 4.2 Vista Agrupada
- Items agrupados por categoría
- Header colapsable por grupo
- Indicador visual de categoría (color/icono)

### 4.3 Gestión de Categorías
- Modal para administrar categorías
- Opción para reordenar (drag-and-drop)
- CRUD de categorías personalizadas

## 5. Fases de Implementación

### Fase 1: Estructura Base (2 horas)
- [ ] Crear tabla `categories`
- [ ] Modificar tabla `shopping_list_items`
- [ ] Implementar tipos y servicios base
- [ ] Migrar datos existentes

### Fase 2: UI Básica (3 horas)
- [ ] Implementar selector de categoría
- [ ] Mostrar items agrupados
- [ ] Añadir iconos y colores
- [ ] Actualizar formularios

### Fase 3: Funcionalidad Avanzada (3 horas)
- [ ] Drag-and-drop entre categorías
- [ ] Gestión de categorías personalizadas
- [ ] Ordenamiento personalizado
- [ ] Persistencia de preferencias

## 6. Posibles Mejoras Futuras

1. **Análisis de Texto**
   - Auto-categorización basada en nombre del item
   - Sugerencias de categoría al añadir

2. **Personalización**
   - Colores personalizados
   - Iconos personalizados
   - Subcategorías

3. **Integración**
   - Categorías compartidas con recetas
   - Categorías compartidas con despensa
   - Estadísticas por categoría

## 7. Consideraciones Técnicas

### Performance
- Lazy loading de items por categoría
- Memoización de componentes pesados
- Optimización de re-renders

### UX
- Animaciones suaves entre estados
- Feedback táctil en móvil
- Accesibilidad (ARIA labels, keyboard nav)

### Offline
- Caché de categorías predefinidas
- Queue de cambios pendientes
- Resolución de conflictos

## 8. Métricas de Éxito

1. **Usabilidad**
   - Tiempo para categorizar un item
   - Uso de categorías personalizadas
   - Tasa de items categorizados

2. **Performance**
   - Tiempo de carga inicial
   - Tiempo de cambio de categoría
   - Memoria utilizada

3. **Adopción**
   - % de usuarios usando categorías
   - # de categorías personalizadas
   - Retención de uso