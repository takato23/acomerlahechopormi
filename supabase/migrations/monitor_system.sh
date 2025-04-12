#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[MONITOR]${NC} $1"; }
success() { echo -e "${GREEN}[GOOD]${NC} $1"; }
warn() { echo -e "${YELLOW}[ALERT]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar variables de entorno
check_env() {
  if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    error "Configurar variables de entorno DB_HOST, DB_USER, DB_NAME"
    exit 1
  fi
}

# Verificar estado del sistema
check_system_status() {
  log "Verificando estado del sistema..."
  
  local query="
    SELECT 
      (SELECT COUNT(*) FROM recipes) as total_recipes,
      (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
      (SELECT COUNT(*) FROM recipes WHERE updated_at > NOW() - INTERVAL '24 hours') as recent_updates,
      (SELECT pg_size_pretty(pg_total_relation_size('recipes'))) as recipes_size,
      (SELECT COUNT(*) FROM recipes WHERE is_favorite = true) as favorite_count
  "
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Verificar rendimiento
check_performance() {
  log "Verificando rendimiento..."
  
  local query="
    SELECT 
      relname as table_name,
      n_live_tup as rows,
      n_dead_tup as dead_rows,
      last_vacuum,
      last_analyze
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
    AND relname IN ('recipes', 'recipe_ingredients');
  "
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Verificar errores recientes
check_recent_errors() {
  log "Verificando logs de errores recientes..."
  
  if [ -d "./logs" ]; then
    find ./logs -type f -mtime -1 -exec grep -l "ERROR" {} \;
  else
    warn "Directorio de logs no encontrado"
  fi
}

# Verificar backups
check_backups() {
  log "Verificando estado de backups..."
  
  local query="
    SELECT 
      version,
      description,
      created_at,
      restored,
      restored_at
    FROM migration_history 
    ORDER BY created_at DESC 
    LIMIT 5;
  "
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Verificar integridad de datos
check_data_integrity() {
  log "Verificando integridad de datos..."
  
  local query="
    WITH integrity_check AS (
      SELECT 
        COUNT(*) FILTER (WHERE title IS NULL) as null_titles,
        COUNT(*) FILTER (WHERE user_id IS NULL) as null_users,
        COUNT(*) FILTER (WHERE instructions IS NULL) as null_instructions,
        COUNT(*) FILTER (WHERE created_at IS NULL) as null_dates
      FROM recipes
    )
    SELECT 
      CASE 
        WHEN (null_titles + null_users + null_instructions + null_dates) = 0
        THEN 'Datos válidos'
        ELSE 'Se encontraron problemas de integridad'
      END as status,
      null_titles,
      null_users,
      null_instructions,
      null_dates
    FROM integrity_check;
  "
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Verificar políticas de seguridad
check_security() {
  log "Verificando políticas de seguridad..."
  
  local query="
    SELECT 
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual
    FROM pg_policies 
    WHERE tablename IN ('recipes', 'recipe_ingredients')
    ORDER BY tablename, policyname;
  "
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Generar reporte
generate_report() {
  local report_file="./monitoring_reports/system_status_$(date '+%Y%m%d').md"
  mkdir -p ./monitoring_reports
  
  {
    echo "# Reporte de Estado del Sistema - $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Estado General"
    check_system_status
    echo
    echo "## Rendimiento"
    check_performance
    echo
    echo "## Integridad de Datos"
    check_data_integrity
    echo
    echo "## Políticas de Seguridad"
    check_security
    echo
    echo "## Backups Recientes"
    check_backups
    echo
    echo "## Errores Detectados"
    check_recent_errors
  } > "$report_file"
  
  success "Reporte generado en: $report_file"
}

# Función principal
main() {
  log "Iniciando monitoreo del sistema..."
  echo "----------------------------------------"
  
  check_env
  
  # Crear directorio para logs
  mkdir -p ./monitoring_logs
  
  # Ejecutar verificaciones
  check_system_status
  echo "----------------------------------------"
  
  check_performance
  echo "----------------------------------------"
  
  check_data_integrity
  echo "----------------------------------------"
  
  check_security
  echo "----------------------------------------"
  
  check_backups
  echo "----------------------------------------"
  
  check_recent_errors
  echo "----------------------------------------"
  
  # Generar reporte
  generate_report
  
  success "Monitoreo completado"
}

# Ejecutar monitoreo y guardar log
LOG_DIR="./monitoring_logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/monitoring_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Verificar si hay errores críticos
if grep -q "\[ERROR\]" "$LOG_FILE"; then
  error "Se encontraron errores críticos. Revisar $LOG_FILE"
  exit 1
fi

exit 0