#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
  echo -e "${YELLOW}[WARN] $1${NC}"
}

# Función para ejecutar migraciones con verificación
run_migration() {
  log "Ejecutando migración: $1"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$1"
  
  if [ $? -eq 0 ]; then
    log "✓ Migración completada: $1"
    return 0
  else
    error "✗ Error en migración: $1"
    return 1
  fi
}

# Verificar variables de entorno
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  error "Por favor configura las variables de entorno:"
  error "export DB_HOST=tu_host"
  error "export DB_USER=tu_usuario"
  error "export DB_NAME=tu_base_de_datos"
  exit 1
fi

# Crear directorio para logs
LOGS_DIR="./migration_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/migration_$(date '+%Y%m%d_%H%M%S').log"

# Iniciar proceso
{
  log "Iniciando instalación del sistema de recetas..."
  
  # 1. Estructura base
  if ! run_migration "052_combine_recipe_fixes.sql"; then
    error "Error en estructura base. Abortando."
    exit 1
  fi
  
  # 2. Limpieza de datos
  if ! run_migration "053_fix_existing_recipe_data.sql"; then
    warn "Advertencia en limpieza de datos. Continuando..."
  fi
  
  # 3. Sistema de rollback
  if ! run_migration "054_recipes_rollback.sql"; then
    error "Error en sistema de rollback. Abortando."
    exit 1
  fi
  
  # 4. Verificación del sistema
  if ! run_migration "055_verify_recipe_system.sql"; then
    warn "Advertencia en verificación. Continuando..."
  fi
  
  # 5. Punto de retorno
  if ! run_migration "056_recipes_revert_point.sql"; then
    error "Error creando punto de retorno. Abortando."
    exit 1
  fi
  
  # 6. Verificación final
  if ! run_migration "057_verify_final_state.sql"; then
    warn "Advertencia en verificación final. Verificar manualmente."
  fi
  
  # 7. Preparar rollback de emergencia
  if ! run_migration "058_emergency_rollback.sql"; then
    warn "Advertencia preparando rollback. Verificar manualmente."
  fi

  # Verificación final del sistema
  log "Ejecutando verificación final..."
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM verify_recipe_system_state();"
  
  if [ $? -eq 0 ]; then
    log "✓ Sistema instalado correctamente"
    log "Para más detalles, consulta README.md"
  else
    error "⚠ Sistema instalado con advertencias"
    error "Por favor revisa los logs y ejecuta las verificaciones manualmente"
  fi

} 2>&1 | tee "$LOG_FILE"

# Mostrar resumen
echo -e "\n${GREEN}=== Resumen de Instalación ===${NC}"
echo "Log completo guardado en: $LOG_FILE"
echo -e "Errores encontrados: $(grep -c "\[ERROR\]" "$LOG_FILE")"
echo -e "Advertencias: $(grep -c "\[WARN\]" "$LOG_FILE")"
echo -e "\nPara verificar el estado del sistema:"
echo "psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c 'SELECT * FROM verify_recipe_system_state();'"