#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[CHECK]${NC} $1"; }
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

# Verificar requisitos del sistema
check_system_requirements() {
  log "Verificando requisitos del sistema..."
  local failed=0
  
  # PostgreSQL
  if command -v psql >/dev/null 2>&1; then
    pass "PostgreSQL Client instalado"
  else
    fail "PostgreSQL Client no encontrado"
    failed=1
  fi
  
  # curl
  if command -v curl >/dev/null 2>&1; then
    pass "curl instalado"
  else
    fail "curl no encontrado"
    failed=1
  fi
  
  # jq
  if command -v jq >/dev/null 2>&1; then
    pass "jq instalado"
  else
    fail "jq no encontrado"
    failed=1
  fi
  
  # Espacio en disco
  local free_space=$(df -m . | awk 'NR==2 {print $4}')
  if [ "$free_space" -gt 500 ]; then
    pass "Espacio en disco suficiente ($free_space MB)"
  else
    fail "Espacio en disco insuficiente ($free_space MB)"
    failed=1
  fi
  
  return $failed
}

# Verificar variables de entorno
check_environment_variables() {
  log "Verificando variables de entorno..."
  local failed=0
  
  local required_vars=(
    "SUPABASE_URL"
    "SUPABASE_KEY"
    "DB_HOST"
    "DB_USER"
    "DB_NAME"
  )
  
  for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
      pass "$var configurada"
    else
      fail "$var no configurada"
      failed=1
    fi
  done
  
  return $failed
}

# Verificar archivos necesarios
check_required_files() {
  log "Verificando archivos necesarios..."
  local failed=0
  
  local sql_files=(
    "052_combine_recipe_fixes.sql"
    "053_fix_existing_recipe_data.sql"
    "054_recipes_rollback.sql"
    "055_verify_recipe_system.sql"
    "056_recipes_revert_point.sql"
    "057_verify_final_state.sql"
    "058_emergency_rollback.sql"
  )
  
  local script_files=(
    "setup_recipes.sh"
    "verify_installation.sh"
    "test_functionality.sh"
    "benchmark_performance.sh"
    "setup_permissions.sh"
  )
  
  local doc_files=(
    "README.md"
    "INSTRUCCIONES.md"
    "PLAN_DE_EJECUCION.md"
    "CHECKLIST.md"
  )
  
  # Verificar SQL files
  for file in "${sql_files[@]}"; do
    if [ -f "$file" ]; then
      if [ -r "$file" ]; then
        pass "SQL: $file (legible)"
      else
        warn "SQL: $file (sin permiso de lectura)"
        failed=1
      fi
    else
      fail "SQL: $file no encontrado"
      failed=1
    fi
  done
  
  # Verificar scripts
  for file in "${script_files[@]}"; do
    if [ -f "$file" ]; then
      if [ -x "$file" ]; then
        pass "Script: $file (ejecutable)"
      else
        warn "Script: $file (sin permiso de ejecución)"
        failed=1
      fi
    else
      fail "Script: $file no encontrado"
      failed=1
    fi
  done
  
  # Verificar documentación
  for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
      if [ -r "$file" ]; then
        pass "Doc: $file (legible)"
      else
        warn "Doc: $file (sin permiso de lectura)"
        failed=1
      fi
    else
      fail "Doc: $file no encontrado"
      failed=1
    fi
  done
  
  return $failed
}

# Verificar conexión a la base de datos
check_database_connection() {
  log "Verificando conexión a la base de datos..."
  
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    pass "Conexión a la base de datos exitosa"
    return 0
  else
    fail "No se pudo conectar a la base de datos"
    return 1
  fi
}

# Verificar tablas y estructura
check_database_structure() {
  log "Verificando estructura de la base de datos..."
  local failed=0
  
  # Verificar tablas
  local tables=(
    "recipes"
    "recipe_ingredients"
  )
  
  for table in "${tables[@]}"; do
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\d $table" >/dev/null 2>&1; then
      pass "Tabla $table existe"
    else
      fail "Tabla $table no existe"
      failed=1
    fi
  done
  
  # Verificar políticas RLS
  local policies=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'recipes';")
  if [ "$policies" -gt 0 ]; then
    pass "Políticas RLS configuradas ($policies políticas)"
  else
    fail "No hay políticas RLS configuradas"
    failed=1
  fi
  
  return $failed
}

# Función principal
main() {
  log "Iniciando verificación de checklist..."
  echo "----------------------------------------"
  
  local total_checks=0
  local passed_checks=0
  
  # 1. Requisitos del sistema
  check_system_requirements
  if [ $? -eq 0 ]; then
    ((passed_checks++))
  fi
  ((total_checks++))
  echo "----------------------------------------"
  
  # 2. Variables de entorno
  check_environment_variables
  if [ $? -eq 0 ]; then
    ((passed_checks++))
  fi
  ((total_checks++))
  echo "----------------------------------------"
  
  # 3. Archivos necesarios
  check_required_files
  if [ $? -eq 0 ]; then
    ((passed_checks++))
  fi
  ((total_checks++))
  echo "----------------------------------------"
  
  # 4. Conexión a la base de datos
  check_database_connection
  if [ $? -eq 0 ]; then
    ((passed_checks++))
  fi
  ((total_checks++))
  echo "----------------------------------------"
  
  # 5. Estructura de la base de datos
  check_database_structure
  if [ $? -eq 0 ]; then
    ((passed_checks++))
  fi
  ((total_checks++))
  
  # Resumen final
  echo -e "\n${BLUE}=== Resumen de Verificación ===${NC}"
  echo "Verificaciones totales: $total_checks"
  echo "Verificaciones exitosas: $passed_checks"
  echo "Porcentaje de éxito: $((passed_checks * 100 / total_checks))%"
  
  if [ $passed_checks -eq $total_checks ]; then
    pass "Todas las verificaciones pasaron"
    return 0
  else
    warn "Algunas verificaciones fallaron"
    return 1
  fi
}

# Crear directorio para logs
LOGS_DIR="./checklist_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/checklist_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar verificaciones y guardar log
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}