# Sistema de Recetas - Guía de Instalación y Mantenimiento

## 1. Preparación del Entorno

### Variables de Entorno Necesarias
```bash
# Supabase
export SUPABASE_URL=tu_url
export SUPABASE_KEY=tu_key

# PostgreSQL
export DB_HOST=tu_host
export DB_USER=tu_usuario
export DB_NAME=tu_base_de_datos
```

### Dependencias Requeridas
- PostgreSQL Client (psql)
- curl
- jq
- bash 4.0+

## 2. Instalación

### Instalación Automática
```bash
# 1. Dar permisos de ejecución
chmod +x setup_recipes.sh
chmod +x verify_installation.sh
chmod +x test_functionality.sh
chmod +x benchmark_performance.sh

# 2. Ejecutar instalación
./setup_recipes.sh
```

### Instalación Manual
```bash
# 1. Estructura base
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 052_combine_recipe_fixes.sql

# 2. Limpieza de datos
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 053_fix_existing_recipe_data.sql

# 3. Sistema de rollback
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 054_recipes_rollback.sql

# 4. Verificación
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 055_verify_recipe_system.sql

# 5. Punto de retorno
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 056_recipes_revert_point.sql

# 6. Verificación final
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 057_verify_final_state.sql

# 7. Rollback de emergencia
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 058_emergency_rollback.sql
```

## 3. Verificación

### Verificar Instalación
```bash
./verify_installation.sh
```

### Pruebas Funcionales
```bash
./test_functionality.sh
```

### Pruebas de Rendimiento
```bash
./benchmark_performance.sh
```

## 4. Mantenimiento

### Monitoreo Regular
```sql
-- Verificar estado del sistema
SELECT * FROM verify_recipe_system_state();

-- Verificar estadísticas
SELECT 
  (SELECT COUNT(*) FROM recipes) as total_recipes,
  (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
  (SELECT COUNT(DISTINCT recipe_id) FROM recipe_ingredients) as recipes_with_ingredients;

-- Verificar rendimiento
SELECT * FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND relname IN ('recipes', 'recipe_ingredients');
```

### Optimización
```sql
-- Actualizar estadísticas
ANALYZE recipes;
ANALYZE recipe_ingredients;

-- Limpiar y optimizar
VACUUM ANALYZE recipes;
VACUUM ANALYZE recipe_ingredients;
```

## 5. Solución de Problemas

### Rollback de Emergencia
```sql
-- 1. Verificar punto de retorno
SELECT * FROM migration_history WHERE version = '056';

-- 2. Ejecutar rollback
BEGIN;
SELECT restore_recipes_state();
-- Verificar
COMMIT;  -- o ROLLBACK si hay problemas
```

### Problemas Comunes

1. **Error: column does not exist**
   ```sql
   -- Verificar estructura actual
   \d recipes
   \d recipe_ingredients
   
   -- Ejecutar migración de estructura
   \i 052_combine_recipe_fixes.sql
   ```

2. **Error: permission denied**
   ```sql
   -- Verificar políticas RLS
   SELECT * FROM pg_policies 
   WHERE tablename IN ('recipes', 'recipe_ingredients');
   
   -- Recargar políticas
   \i 050_fix_permissions_and_indices.sql
   ```

3. **Error: duplicate key value**
   ```sql
   -- Limpiar datos duplicados
   \i 053_fix_existing_recipe_data.sql
   ```

## 6. Respaldo y Recuperación

### Crear Respaldo Manual
```sql
-- 1. Crear punto de retorno
SELECT save_recipes_state();

-- 2. Verificar backup
SELECT * FROM migration_history 
ORDER BY created_at DESC 
LIMIT 5;
```

### Restaurar desde Respaldo
```sql
-- 1. Listar puntos de retorno disponibles
SELECT version, description, created_at 
FROM migration_history 
WHERE restored = false 
ORDER BY created_at DESC;

-- 2. Restaurar
SELECT restore_recipes_state();
```

## 7. Notas Importantes

### Mejores Prácticas
1. Siempre ejecutar verificaciones antes de cambios importantes
2. Mantener un punto de retorno actualizado
3. Monitorear el rendimiento regularmente
4. Mantener las estadísticas actualizadas
5. Documentar cualquier modificación

### Limitaciones Conocidas
1. Las políticas RLS requieren usuario autenticado
2. Los ingredientes huérfanos se eliminan automáticamente
3. Las imágenes se generan de forma asíncrona

### Contacto
Para reportar problemas o sugerir mejoras:
1. Abrir issue en el repositorio
2. Incluir logs relevantes
3. Describir pasos para reproducir el problema
4. Adjuntar resultado de verify_recipe_system_state()