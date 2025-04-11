#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[UPDATE]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar si estamos en mantenimiento
check_maintenance() {
  if [ -f ".maintenance" ]; then
    error "Sistema en mantenimiento. Espere a que finalice."
    exit 1
  fi
}

# Crear punto de retorno seguro
create_safe_point() {
  log "Creando punto de retorno seguro..."
  
  # Timestamp para identificar el backup
  TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
  
  # Backup de tablas
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << EOF
    CREATE TABLE recipes_backup_${TIMESTAMP} AS SELECT * FROM recipes;
    CREATE TABLE recipe_ingredients_backup_${TIMESTAMP} AS SELECT * FROM recipe_ingredients;
    
    INSERT INTO migration_history (
      version,
      description,
      created_at,
      restored
    ) VALUES (
      '${TIMESTAMP}',
      'Safe update backup',
      CURRENT_TIMESTAMP,
      false
    );
EOF
  
  if [ $? -eq 0 ]; then
    success "Punto de retorno creado: ${TIMESTAMP}"
    echo "${TIMESTAMP}" > .last_backup
  else
    error "Error creando punto de retorno"
    exit 1
  fi
}

# Verificar estado del sistema
verify_system_state() {
  log "Verificando estado del sistema..."
  
  ./verify_installation.sh --quick
  return $?
}

# Aplicar actualizaciones
apply_updates() {
  log "Aplicando actualizaciones..."
  
  # Crear archivo de mantenimiento
  echo "Actualización en progreso - $(date)" > .maintenance
  
  # Lista de actualizaciones pendientes
  PENDING_UPDATES=($(ls -1 updates/*.sql 2>/dev/null))
  
  if [ ${#PENDING_UPDATES[@]} -eq 0 ]; then
    success "No hay actualizaciones pendientes"
    rm .maintenance
    return 0
  fi
  
  # Aplicar cada actualización
  for update in "${PENDING_UPDATES[@]}"; do
    log "Aplicando: $update"
    
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$update"
    
    if [ $? -eq 0 ]; then
      success "✓ $update aplicado"
      mv "$update" "updates/applied/"
    else
      error "✗ Error aplicando $update"
      return 1
    fi
  done
  
  # Eliminar archivo de mantenimiento
  rm .maintenance
}

# Verificar post-actualización
verify_update() {
  log "Verificando actualización..."
  
  # Verificar estructura
  ./verify_checklist.sh --quick
  if [ $? -ne 0 ]; then
    error "Verificación de estructura falló"
    return 1
  fi
  
  # Verificar datos
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM verify_recipe_system_state();"
  if [ $? -ne 0 ]; then
    error "Verificación de datos falló"
    return 1
  fi
  
  return 0
}

# Rollback en caso de error
perform_rollback() {
  error "Iniciando rollback..."
  
  # Obtener último backup
  LAST_BACKUP=$(cat .last_backup)
  
  if [ -z "$LAST_BACKUP" ]; then
    error "No se encontró punto de retorno"
    exit 1
  fi
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << EOF
    -- Restaurar datos
    TRUNCATE TABLE recipes;
    TRUNCATE TABLE recipe_ingredients;
    
    INSERT INTO recipes SELECT * FROM recipes_backup_${LAST_BACKUP};
    INSERT INTO recipe_ingredients SELECT * FROM recipe_ingredients_backup_${LAST_BACKUP};
    
    -- Registrar restauración
    UPDATE migration_history 
    SET restored = true, 
        restored_at = CURRENT_TIMESTAMP 
    WHERE version = '${LAST_BACKUP}';
EOF
  
  if [ $? -eq 0 ]; then
    success "Sistema restaurado al punto: ${LAST_BACKUP}"
  else
    error "Error en rollback. REQUIERE INTERVENCIÓN MANUAL."
    exit 1
  fi
}

# Función principal
main() {
  log "Iniciando actualización segura del sistema..."
  echo "----------------------------------------"
  
  # 1. Verificar mantenimiento
  check_maintenance
  
  # 2. Verificar estado actual
  if ! verify_system_state; then
    error "Sistema en estado inválido. Corrija antes de actualizar."
    exit 1
  fi
  
  # 3. Crear punto de retorno
  create_safe_point
  echo "----------------------------------------"
  
  # 4. Aplicar actualizaciones
  if ! apply_updates; then
    error "Error aplicando actualizaciones"
    perform_rollback
    exit 1
  fi
  echo "----------------------------------------"
  
  # 5. Verificar actualización
  if ! verify_update; then
    warn "Verificación post-actualización falló"
    echo -e "${YELLOW}¿Desea realizar rollback? (s/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
      perform_rollback
      exit 1
    fi
  fi
  echo "----------------------------------------"
  
  success "¡Actualización completada exitosamente!"
  
  # Limpiar backups antiguos (más de 7 días)
  find updates/applied/ -name "*.sql" -mtime +7 -delete
  
  # Resumen
  cat << EOF

${BLUE}Resumen de actualización:${NC}
- Punto de retorno: $(cat .last_backup)
- Actualizaciones aplicadas: ${#PENDING_UPDATES[@]}
- Estado: OK

${BLUE}Próximos pasos:${NC}
1. Verifica el sistema: ./verify_installation.sh
2. Ejecuta pruebas: ./test_functionality.sh
3. Revisa los logs: ./monitoring_logs/

${YELLOW}Para rollback manual:${NC}
./safe_update.sh --rollback $(cat .last_backup)
EOF
}

# Procesar argumentos
if [ "$1" == "--rollback" ] && [ ! -z "$2" ]; then
  LAST_BACKUP="$2"
  perform_rollback
  exit $?
fi

# Crear directorios necesarios
mkdir -p updates/applied
mkdir -p safe_update_logs

# Log de actualización
LOG_FILE="safe_update_logs/update_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar actualización
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}