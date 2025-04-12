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

# Verificar todas las variables de entorno necesarias
check_environment() {
  local missing=0
  
  # Variables para Supabase
  if [ -z "$SUPABASE_URL" ]; then missing=1; error "Falta SUPABASE_URL"; fi
  if [ -z "$SUPABASE_KEY" ]; then missing=1; error "Falta SUPABASE_KEY"; fi
  
  # Variables para PostgreSQL
  if [ -z "$DB_HOST" ]; then missing=1; error "Falta DB_HOST"; fi
  if [ -z "$DB_USER" ]; then missing=1; error "Falta DB_USER"; fi
  if [ -z "$DB_NAME" ]; then missing=1; error "Falta DB_NAME"; fi
  
  if [ $missing -eq 1 ]; then
    error "Por favor configura todas las variables de entorno necesarias"
    cat << EOF
Exporta las siguientes variables:

# Supabase
export SUPABASE_URL=tu_url
export SUPABASE_KEY=tu_key

# PostgreSQL
export DB_HOST=tu_host
export DB_USER=tu_usuario
export DB_NAME=tu_base_de_datos
EOF
    exit 1
  fi
}

# Verificar dependencias
check_dependencies() {
  local missing=0
  
  command -v psql >/dev/null 2>&1 || { missing=1; error "Falta psql"; }
  command -v curl >/dev/null 2>&1 || { missing=1; error "Falta curl"; }
  command -v jq >/dev/null 2>&1 || { missing=1; error "Falta jq"; }
  
  if [ $missing -eq 1 ]; then
    error "Por favor instala las dependencias faltantes"
    exit 1
  fi
}

# Crear directorio para logs
setup_logs() {
  LOGS_DIR="./recipe_system_logs"
  mkdir -p "$LOGS_DIR"
  LOG_FILE="$LOGS_DIR/setup_$(date '+%Y%m%d_%H%M%S').log"
  success "Los logs se guardarán en: $LOG_FILE"
}

# Ejecutar migración con verificación
run_migration() {
  local file=$1
  local description=$2
  
  log "Ejecutando $description..."
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file" >> "$LOG_FILE" 2>&1; then
    success "✓ $description completada"
    return 0
  else
    error "✗ Error en $description"
    error "Ver detalles en $LOG_FILE"
    return 1
  fi
}

# Función principal
main() {
  log "Iniciando configuración del sistema de recetas..."
  echo "----------------------------------------"
  
  # 1. Verificaciones previas
  check_environment
  check_dependencies
  setup_logs
  
  # 2. Ejecutar migraciones en orden
  local migrations=(
    "052_combine_recipe_fixes.sql:Estructura base"
    "053_fix_existing_recipe_data.sql:Limpieza de datos"
    "054_recipes_rollback.sql:Sistema de rollback"
    "055_verify_recipe_system.sql:Verificación del sistema"
    "056_recipes_revert_point.sql:Punto de retorno"
    "057_verify_final_state.sql:Verificación final"
    "058_emergency_rollback.sql:Rollback de emergencia"
  )
  
  for migration in "${migrations[@]}"; do
    IFS=':' read -r file description <<< "$migration"
    if ! run_migration "$file" "$description"; then
      error "Abortando instalación debido a errores"
      exit 1
    fi
    echo "----------------------------------------"
  done
  
  # 3. Ejecutar verificaciones
  log "Ejecutando verificaciones del sistema..."
  ./verify_installation.sh >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    warn "Algunas verificaciones fallaron, ver $LOG_FILE"
  else
    success "✓ Verificaciones completadas"
  fi
  echo "----------------------------------------"
  
  # 4. Ejecutar pruebas funcionales
  log "Ejecutando pruebas funcionales..."
  ./test_functionality.sh >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    warn "Algunas pruebas fallaron, ver $LOG_FILE"
  else
    success "✓ Pruebas funcionales completadas"
  fi
  echo "----------------------------------------"
  
  # 5. Ejecutar benchmarks
  log "Ejecutando pruebas de rendimiento..."
  ./benchmark_performance.sh >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    warn "Algunos benchmarks fallaron, ver $LOG_FILE"
  else
    success "✓ Pruebas de rendimiento completadas"
  fi
  echo "----------------------------------------"
  
  # 6. Resumen final
  echo -e "\n${GREEN}=== Resumen de Instalación ===${NC}"
  echo "Log completo: $LOG_FILE"
  
  # Mostrar estadísticas
  echo -e "\n${BLUE}Estadísticas:${NC}"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << EOF
    SELECT 
      (SELECT COUNT(*) FROM recipes) as total_recipes,
      (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
      (SELECT COUNT(DISTINCT recipe_id) FROM recipe_ingredients) as recipes_with_ingredients;
EOF
  
  # Verificar estado del sistema
  echo -e "\n${BLUE}Estado del Sistema:${NC}"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM verify_recipe_system_state();"
  
  success "¡Instalación completada!"
  
  # Instrucciones finales
  cat << EOF

${BLUE}Próximos pasos:${NC}
1. Revisa el log completo en $LOG_FILE
2. Verifica las políticas RLS en Supabase
3. Prueba el sistema desde la aplicación
4. Configura monitoreo si es necesario

${BLUE}Para verificar el sistema:${NC}
./verify_installation.sh

${BLUE}Para pruebas funcionales:${NC}
./test_functionality.sh

${BLUE}Para pruebas de rendimiento:${NC}
./benchmark_performance.sh

${BLUE}Para rollback de emergencia:${NC}
psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c "SELECT restore_recipes_state();"
EOF
}

# Ejecutar instalación
{
  main
} 2>&1 | tee -a "$LOG_FILE"

exit ${PIPESTATUS[0]}