# Sistema de Recetas - Plan de Migración y Pruebas

## Migraciones

### 1. Estructura Base (052_combine_recipe_fixes.sql)
- Tablas principales: recipes y recipe_ingredients
- Políticas RLS
- Índices para optimización
- Triggers de integridad

### 2. Limpieza de Datos (053_fix_existing_recipe_data.sql)
- Inicialización de campos nulos
- Corrección de datos inconsistentes
- Limpieza de registros huérfanos

### 3. Sistema de Rollback (054_recipes_rollback.sql)
- Backup automático
- Triggers de verificación
- Función de rollback automático

### 4. Verificación del Sistema (055_verify_recipe_system.sql)
- Comprobación de estructura
- Validación de políticas
- Verificación de índices
- Test de integridad

### 5. Punto de Retorno (056_recipes_revert_point.sql)
- Backup completo del sistema
- Historial de migraciones
- Punto de restauración seguro

### 6. Verificación Final (057_verify_final_state.sql)
- Diagnóstico completo
- Reporte de estado
- Validación de funcionamiento

### 7. Rollback de Emergencia (058_emergency_rollback.sql)
- Procedimiento de emergencia
- Restauración garantizada
- Verificación post-rollback

## Plan de Pruebas

1. **Preparación**
```bash
supabase db reset
supabase migration up
```

2. **Verificación de Estructura**
```sql
SELECT * FROM verify_recipe_system_state();
```

3. **Pruebas Funcionales**
- Crear receta nueva:
```typescript
const newRecipe = {
  title: "Test Recipe",
  description: "Test Description",
  instructions: ["Step 1", "Step 2"],
  ingredients: [
    { name: "Ingredient 1", quantity: 100, unit: "g" }
  ]
};
await recipeStore.createRecipe(newRecipe);
```

- Editar receta:
```typescript
const updates = {
  title: "Updated Recipe",
  description: "Updated Description"
};
await recipeStore.updateRecipe(recipeId, updates);
```

- Marcar favorito:
```typescript
await recipeStore.toggleFavorite(recipeId, true);
```

4. **Pruebas de Políticas RLS**
```sql
-- Como usuario no autenticado
SELECT * FROM recipes;  -- Debe fallar

-- Como usuario autenticado
SELECT * FROM recipes WHERE user_id = auth.uid();  -- Debe funcionar
```

5. **Pruebas de Rendimiento**
```sql
EXPLAIN ANALYZE 
SELECT * FROM recipes 
WHERE user_id = '[USER_ID]' 
AND is_favorite = true;
```

6. **Verificación de Backup**
```sql
SELECT * FROM migration_history 
WHERE version = '056';
```

7. **Prueba de Rollback**
```sql
BEGIN;
CALL emergency_rollback();
-- Verificar estado
COMMIT;  -- o ROLLBACK
```

## En Caso de Problemas

1. **Errores de Datos**
```sql
SELECT * FROM verify_recipe_system_state();
```

2. **Rollback de Emergencia**
```sql
BEGIN;
CALL emergency_rollback();
COMMIT;
```

3. **Verificación Post-Rollback**
```sql
SELECT 
  COUNT(*) as total_recipes,
  COUNT(*) FILTER (WHERE updated_at > CURRENT_TIMESTAMP - interval '5 minutes') as recently_updated
FROM recipes;
```

4. **Limpieza de Emergencia**
```sql
DROP TABLE IF EXISTS recipes_pre_rollback;
DROP TABLE IF EXISTS recipe_ingredients_pre_rollback;
```

## Monitoreo Continuo

1. **Query para Monitoreo**
```sql
SELECT 
  (SELECT COUNT(*) FROM recipes) as total_recipes,
  (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
  (SELECT COUNT(DISTINCT recipe_id) FROM recipe_ingredients) as recipes_with_ingredients,
  (SELECT COUNT(*) FROM recipes WHERE updated_at > CURRENT_TIMESTAMP - interval '24 hours') as updated_today;
```

2. **Alerta de Integridad**
```sql
SELECT verify_recipe_system_state()
WHERE status = 'ERROR';
```

## Mantenimiento

1. **Limpieza Periódica**
```sql
DELETE FROM recipe_ingredients
WHERE recipe_id NOT IN (SELECT id FROM recipes);
```

2. **Optimización de Índices**
```sql
VACUUM ANALYZE recipes;
VACUUM ANALYZE recipe_ingredients;
```

3. **Actualización de Estadísticas**
```sql
ANALYZE recipes;
ANALYZE recipe_ingredients;