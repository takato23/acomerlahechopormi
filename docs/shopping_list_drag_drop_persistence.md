# Plan de Implementación: Persistencia de Drag & Drop

## 1. Modelo de Datos

### 1.1 Modificaciones en la Base de Datos
```sql
-- Añadir columnas para orden y categoría en shopping_list_items
alter table shopping_list_items
add column category_order integer default 0,
add column category_id uuid references categories(id);

-- Índices para optimizar queries
create index items_category_order_idx on shopping_list_items(category_id, category_order);
```

## 2. Servicios

### 2.1 Funciones de Servicio
```typescript
interface ReorderItemsParams {
  itemId: string;
  newCategoryId?: string | null;
  targetIndex: number;
}

// En shoppingListService.ts
async function reorderItems(params: ReorderItemsParams): Promise<void> {
  const { itemId, newCategoryId, targetIndex } = params;
  
  // 1. Obtener ítem actual
  // 2. Si cambia de categoría:
  //    - Decrementar orders en categoría origen
  //    - Incrementar orders en categoría destino
  // 3. Si no cambia, solo reordenar dentro de la misma categoría
  // 4. Actualizar ítem con nuevo order y category_id
}
```

## 3. Implementación Frontend

### 3.1 Modificar `handleDragEnd`
```typescript
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (over && active.id !== over.id) {
    // 1. Determinar categoría origen y destino
    // 2. Calcular nuevo índice
    // 3. Llamar a reorderItems
    // 4. Actualizar estado local optimísticamente
    // 5. Rollback en caso de error
  }
}
```

### 3.2 Droppable Zones para Categorías
```typescript
// Modificar SortableContext para soportar múltiples contenedores
<DndContext>
  {categories.map(category => (
    <SortableContext id={category.id}>
      {itemsInCategory.map(item => (
        <SortableItem />
      ))}
    </SortableContext>
  ))}
</DndContext>
```

## 4. Fases de Implementación

### Fase 1: Persistencia Básica (2-3 horas)
- [ ] Modificar tabla en Supabase
- [ ] Implementar `reorderItems` básico (sin cambio de categoría)
- [ ] Integrar con `handleDragEnd`
- [ ] Añadir manejo de errores y rollback

### Fase 2: Cambio de Categorías (3-4 horas)
- [ ] Implementar droppable zones por categoría
- [ ] Expandir `reorderItems` para manejar cambios de categoría
- [ ] Actualizar UI para mostrar feedback visual al arrastrar entre categorías
- [ ] Optimizar queries de reordenamiento

### Fase 3: Optimizaciones (2-3 horas)
- [ ] Implementar batch updates para reordenamientos múltiples
- [ ] Añadir caché local para órdenes
- [ ] Implementar reordenamiento offline-first
- [ ] Añadir animaciones suaves

## 5. Consideraciones

### 5.1 Performance
- Usar RLS para queries eficientes
- Indexar columnas relevantes
- Implementar actualizaciones batch
- Considerar límites de rate-limiting

### 5.2 UX
- Feedback visual inmediato
- Animaciones suaves
- Indicadores de estado de guardado
- Fallback para errores de red

### 5.3 Testing
- Unit tests para lógica de reordenamiento
- Integration tests para persistencia
- E2E tests para drag & drop
- Tests de performance

## 6. Riesgos y Mitigación

### 6.1 Concurrencia
- Implementar locking optimista
- Versionar órdenes
- Resolver conflictos automáticamente

### 6.2 Performance
- Limitar frecuencia de actualizaciones
- Implementar debounce
- Usar batch updates

### 6.3 Offline
- Queue de cambios pendientes
- Sincronización al reconectar
- Resolución de conflictos

## 7. Métricas de Éxito

### 7.1 Performance
- Tiempo de respuesta < 100ms
- Animaciones 60fps
- Sin jank visual

### 7.2 Fiabilidad
- 99.9% éxito en operaciones
- < 1% conflictos de concurrencia
- 0 pérdidas de datos

## 8. Próximos Pasos
1. Implementar y probar Fase 1
2. Revisar performance
3. Implementar Fase 2 si los resultados son buenos
4. Evaluar necesidad de Fase 3