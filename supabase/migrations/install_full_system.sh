#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[SYSTEM]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Función para pausar y confirmar
confirm() {
  echo -e "\n${YELLOW}¿Deseas continuar? (s/n)${NC}"
  read -r response
  if [[ ! "$response" =~ ^[Ss]$ ]]; then
    error "Instalación abortada por el usuario"
    exit 1
  fi
}

# Función para esperar y mostrar progreso
wait_with_progress() {
  local seconds=$1
  local message=$2
  echo -n "$message "
  for ((i=0; i<seconds; i++)); do
    echo -n "."
    sleep 1
  done
  echo " ¡Listo!"
}

# Verificar si estamos en el directorio correcto
check_directory() {
  if [ ! -f "setup_permissions.sh" ]; then
    error "Este script debe ejecutarse desde el directorio de migraciones"
    exit 1
  fi
}

# Función principal
main() {
  log "Iniciando instalación completa del sistema de recetas"
  echo "=================================================="
  
  # 1. Verificar permisos
  log "Fase 1: Configuración de permisos"
  ./setup_permissions.sh
  if [ $? -ne 0 ]; then
    error "Error configurando permisos"
    exit 1
  fi
  success "Permisos configurados correctamente"
  echo "------------------------------------------------"
  
  # 2. Verificar checklist pre-instalación
  log "Fase 2: Verificación de pre-requisitos"
  ./verify_checklist.sh
  if [ $? -ne 0 ]; then
    error "No se cumplieron todos los pre-requisitos"
    confirm
  fi
  success "Pre-requisitos verificados"
  echo "------------------------------------------------"
  
  # 3. Crear backup de seguridad
  log "Fase 3: Creando backup de seguridad"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << EOF
    CREATE TABLE IF NOT EXISTS recipes_backup_full AS SELECT * FROM recipes;
    CREATE TABLE IF NOT EXISTS recipe_ingredients_backup_full AS SELECT * FROM recipe_ingredients;
EOF
  if [ $? -ne 0 ]; then
    error "Error creando backup"
    exit 1
  fi
  success "Backup creado correctamente"
  echo "------------------------------------------------"
  
  # 4. Ejecutar instalación principal
  log "Fase 4: Instalación principal"
  ./setup_recipes.sh
  if [ $? -ne 0 ]; then
    error "Error en la instalación principal"
    echo -e "${RED}Iniciando rollback automático...${NC}"
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT restore_recipes_state();"
    exit 1
  fi
  success "Instalación principal completada"
  echo "------------------------------------------------"
  
  # 5. Verificar instalación
  log "Fase 5: Verificación de instalación"
  ./verify_installation.sh
  if [ $? -ne 0 ]; then
    warn "Se encontraron advertencias en la verificación"
    confirm
  fi
  success "Verificación completada"
  echo "------------------------------------------------"
  
  # 6. Ejecutar pruebas funcionales
  log "Fase 6: Pruebas funcionales"
  ./test_functionality.sh
  if [ $? -ne 0 ]; then
    warn "Algunas pruebas funcionales fallaron"
    confirm
  fi
  success "Pruebas funcionales completadas"
  echo "------------------------------------------------"
  
  # 7. Ejecutar pruebas de rendimiento
  log "Fase 7: Pruebas de rendimiento"
  ./benchmark_performance.sh
  if [ $? -ne 0 ]; then
    warn "Se detectaron problemas de rendimiento"
    confirm
  fi
  success "Pruebas de rendimiento completadas"
  echo "------------------------------------------------"
  
  # 8. Verificación final
  log "Fase 8: Verificación final del sistema"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM verify_recipe_system_state();"
  if [ $? -ne 0 ]; then
    error "Error en la verificación final"
    confirm
  }
  success "Verificación final completada"
  echo "=================================================="
  
  # Resumen final
  log "Generando resumen de instalación..."
  
  # Estadísticas
  echo -e "\n${BLUE}=== Estadísticas ===${NC}"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << EOF
    SELECT 
      (SELECT COUNT(*) FROM recipes) as total_recipes,
      (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
      (SELECT COUNT(DISTINCT recipe_id) FROM recipe_ingredients) as recipes_with_ingredients;
EOF
  
  # Estado del sistema
  echo -e "\n${BLUE}=== Estado del Sistema ===${NC}"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\df verify_recipe_system_state"
  
  # Instrucciones finales
  cat << EOF

${GREEN}¡Instalación completada exitosamente!${NC}

${BLUE}Próximos pasos:${NC}
1. Revisa los logs en ./logs/
2. Ejecuta algunas pruebas manuales
3. Verifica la documentación en INSTRUCCIONES.md
4. Configura el monitoreo según PLAN_DE_EJECUCION.md

${BLUE}Para mantenimiento:${NC}
- Verificación diaria: ./verify_installation.sh
- Pruebas semanales: ./test_functionality.sh
- Benchmarks mensuales: ./benchmark_performance.sh

${BLUE}En caso de problemas:${NC}
1. Consulta INSTRUCCIONES.md
2. Revisa los logs
3. Ejecuta: psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c "SELECT restore_recipes_state();"

${YELLOW}Backup creado en:${NC}
- recipes_backup_full
- recipe_ingredients_backup_full

EOF
}

# Crear directorio para logs
LOGS_DIR="./system_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/installation_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar instalación completa
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}