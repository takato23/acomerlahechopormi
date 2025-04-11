# Plan de Ejecución - Sistema de Recetas

## Resumen de Cambios

### 1. Estructura del Sistema
- Tablas principales: `recipes` y `recipe_ingredients`
- Sistema de etiquetas y categorías
- Integración con sistema de ingredientes
- Políticas RLS para seguridad

### 2. Migraciones Incluidas
1. `052_combine_recipe_fixes.sql`: Estructura base
2. `053_fix_existing_recipe_data.sql`: Limpieza de datos
3. `054_recipes_rollback.sql`: Sistema de rollback
4. `055_verify_recipe_system.sql`: Verificaciones
5. `056_recipes_revert_point.sql`: Punto de retorno
6. `057_verify_final_state.sql`: Verificación final
7. `058_emergency_rollback.sql`: Rollback de emergencia

### 3. Scripts de Utilidad
- `setup_recipes.sh`: Instalación completa
- `verify_installation.sh`: Verificación del sistema
- `test_functionality.sh`: Pruebas funcionales
- `benchmark_performance.sh`: Pruebas de rendimiento
- `setup_permissions.sh`: Configuración de permisos

## Plan de Ejecución

### Fase 1: Preparación (15 minutos)
1. Configurar variables de entorno:
```bash
# Supabase
export SUPABASE_URL=tu_url
export SUPABASE_KEY=tu_key

# PostgreSQL
export DB_HOST=tu_host
export DB_USER=tu_usuario
export DB_NAME=tu_base_de_datos
```

2. Verificar dependencias:
```bash
# Verificar PostgreSQL
psql --version

# Verificar curl
curl --version

# Verificar jq
jq --version
```

3. Configurar permisos:
```bash
chmod +x setup_permissions.sh
./setup_permissions.sh
```

### Fase 2: Backup (10 minutos)
1. Respaldar datos existentes:
```sql
CREATE TABLE IF NOT EXISTS recipes_backup_pre_migration AS 
SELECT * FROM recipes;

CREATE TABLE IF NOT EXISTS recipe_ingredients_backup_pre_migration AS 
SELECT * FROM recipe_ingredients;
```

2. Verificar backup:
```sql
SELECT COUNT(*) FROM recipes_backup_pre_migration;
SELECT COUNT(*) FROM recipe_ingredients_backup_pre_migration;
```

### Fase 3: Instalación (30 minutos)
1. Ejecutar instalación:
```bash
./setup_recipes.sh
```

2. Verificar logs:
```bash
tail -f ./recipe_system_logs/setup_*.log
```

3. Confirmar migración:
```sql
SELECT * FROM verify_recipe_system_state();
```

### Fase 4: Verificación (20 minutos)
1. Ejecutar verificaciones:
```bash
./verify_installation.sh
```

2. Ejecutar pruebas:
```bash
./test_functionality.sh
```

3. Ejecutar benchmarks:
```bash
./benchmark_performance.sh
```

### Fase 5: Validación (15 minutos)
1. Verificar datos:
```sql
-- Contar recetas
SELECT COUNT(*) FROM recipes;

-- Verificar ingredientes
SELECT COUNT(*) FROM recipe_ingredients;

-- Verificar integridad
SELECT * FROM verify_recipe_system_state();
```

2. Probar funcionalidades:
- Crear receta nueva
- Editar receta existente
- Marcar/desmarcar favoritos
- Eliminar receta

3. Verificar permisos:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('recipes', 'recipe_ingredients');
```

### Fase 6: Monitoreo (En curso)
1. Configurar alertas:
```sql
-- Crear vista de monitoreo
CREATE VIEW recipe_system_status AS
SELECT 
  (SELECT COUNT(*) FROM recipes) as total_recipes,
  (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
  (SELECT COUNT(*) FROM recipes WHERE updated_at > now() - interval '24 hours') as recent_updates;
```

2. Establecer monitoreo periódico:
```bash
# Agregar a crontab
0 * * * * psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM verify_recipe_system_state();" >> /var/log/recipe_system.log
```

## Plan de Rollback

### En caso de problemas:
1. Detener instalación:
```bash
CTRL+C
```

2. Ejecutar rollback:
```sql
BEGIN;
SELECT restore_recipes_state();
-- Verificar
COMMIT;  -- o ROLLBACK
```

3. Restaurar backup original:
```sql
TRUNCATE TABLE recipes;
TRUNCATE TABLE recipe_ingredients;

INSERT INTO recipes SELECT * FROM recipes_backup_pre_migration;
INSERT INTO recipe_ingredients SELECT * FROM recipe_ingredients_backup_pre_migration;
```

## Tiempos Estimados
- Preparación: 15 minutos
- Backup: 10 minutos
- Instalación: 30 minutos
- Verificación: 20 minutos
- Validación: 15 minutos
- **Total: 90 minutos**

## Recursos Necesarios
- Acceso a Supabase
- Acceso a base de datos
- 500MB espacio en disco
- Permisos de administrador

## Contactos
- **Emergencias**: Ejecutar `./setup_permissions.sh --emergency`
- **Problemas**: Revisar `INSTRUCCIONES.md`
- **Soporte**: Abrir issue en el repositorio

## Verificación Post-Instalación
```bash
# 1. Verificar sistema
./verify_installation.sh

# 2. Verificar rendimiento
./benchmark_performance.sh

# 3. Verificar logs
grep ERROR ./recipe_system_logs/setup_*.log

# 4. Confirmar funcionamiento
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM verify_recipe_system_state();"