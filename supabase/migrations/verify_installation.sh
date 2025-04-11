#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar variables de entorno
check_env() {
  local missing=0
  if [ -z "$DB_HOST" ]; then
    error "Falta DB_HOST"
    missing=1
  fi
  if [ -z "$DB_USER" ]; then
    error "Falta DB_USER"
    missing=1
  fi
  if [ -z "$DB_NAME" ]; then
    error "Falta DB_NAME"
    missing=1
  fi
  
  if [ $missing -eq 1 ]; then
    error "Configura las variables de entorno necesarias:"
    echo "export DB_HOST=tu_host"
    echo "export DB_USER=tu_usuario"
    echo "export DB_NAME=tu_base_de_datos"
    exit 1
  fi
}

# Verificar estructura de la base de datos
check_database_structure() {
  log "Verificando estructura de la base de datos..."
  
  local tables=(recipes recipe_ingredients)
  local success=true
  
  for table in "${tables[@]}"; do
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');" | grep -q 't'; then
      success "Tabla $table existe"
    else
      error "Tabla $table no existe"
      success=false
    fi
  done
  
  if [ "$success" = true ]; then
    success "Estructura de base de datos correcta"
  else
    error "Problemas con la estructura de la base de datos"
    return 1
  fi
}

# Verificar políticas RLS
check_rls_policies() {
  log "Verificando políticas RLS..."
  
  local policies=(
    "Enable read access for authenticated users"
    "Enable insert access for authenticated users"
    "Enable update access for users based on user_id"
    "Enable delete access for users based on user_id"
  )
  
  local success=true
  
  for policy in "${policies[@]}"; do
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '${policy//' '/_}');" | grep -q 't'; then
      success "Política '$policy' existe"
    else
      error "Política '$policy' no existe"
      success=false
    fi
  done
  
  if [ "$success" = true ]; then
    success "Todas las políticas RLS están configuradas"
  else
    error "Faltan políticas RLS"
    return 1
  fi
}

# Verificar índices
check_indexes() {
  log "Verificando índices..."
  
  local indexes=(
    "idx_recipes_user_id"
    "idx_recipes_is_public"
    "idx_recipes_title"
    "idx_recipes_tags"
    "idx_recipe_ingredients_recipe_id"
    "idx_recipe_ingredients_ingredient_id"
  )
  
  local success=true
  
  for index in "${indexes[@]}"; do
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '$index');" | grep -q 't'; then
      success "Índice $index existe"
    else
      error "Índice $index no existe"
      success=false
    fi
  done
  
  if [ "$success" = true ]; then
    success "Todos los índices están creados"
  else
    error "Faltan índices"
    return 1
  fi
}

# Verificar triggers
check_triggers() {
  log "Verificando triggers..."
  
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'ensure_recipe_integrity');" | grep -q 't'; then
    success "Trigger ensure_recipe_integrity existe"
  else
    error "Trigger ensure_recipe_integrity no existe"
    return 1
  fi
}

# Verificar punto de retorno
check_backup() {
  log "Verificando punto de retorno..."
  
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM migration_history WHERE version = '056');" | grep -q 't'; then
    success "Punto de retorno existe"
    
    local backup_date=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT created_at FROM migration_history WHERE version = '056';")
    log "Backup creado en: $backup_date"
  else
    error "No se encontró punto de retorno"
    return 1
  fi
}

# Verificar integridad de datos
check_data_integrity() {
  log "Verificando integridad de datos..."
  
  local invalid_data=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT COUNT(*) 
    FROM recipes 
    WHERE title IS NULL 
       OR user_id IS NULL 
       OR tags IS NULL 
       OR main_ingredients IS NULL;")
  
  if [ "$invalid_data" -eq "0" ]; then
    success "No se encontraron datos inválidos"
  else
    error "Se encontraron $invalid_data registros con datos inválidos"
    return 1
  fi
}

# Ejecutar todas las verificaciones
main() {
  log "Iniciando verificación completa del sistema..."
  echo "----------------------------------------"
  
  local failed=0
  
  check_env || failed=1
  echo "----------------------------------------"
  
  check_database_structure || failed=1
  echo "----------------------------------------"
  
  check_rls_policies || failed=1
  echo "----------------------------------------"
  
  check_indexes || failed=1
  echo "----------------------------------------"
  
  check_triggers || failed=1
  echo "----------------------------------------"
  
  check_backup || failed=1
  echo "----------------------------------------"
  
  check_data_integrity || failed=1
  echo "----------------------------------------"
  
  if [ $failed -eq 0 ]; then
    success "Verificación completa exitosa"
    return 0
  else
    error "Se encontraron problemas durante la verificación"
    return 1
  fi
}

# Ejecutar verificación y guardar log
LOGS_DIR="./verification_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/verification_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}