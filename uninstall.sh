#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[UNINSTALL]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar sudo
check_sudo() {
  if [ "$(id -u)" != "0" ]; then
    error "Este script debe ejecutarse con sudo"
    exit 1
  fi
}

# Confirmar desinstalación
confirm_uninstall() {
  echo -e "${RED}¡ADVERTENCIA! Esta acción:${NC}"
  echo "1. Eliminará todos los archivos del sistema"
  echo "2. Removerá las tareas programadas"
  echo "3. Eliminará los accesos directos"
  echo "4. Limpiará las variables de entorno"
  echo -e "5. ${RED}¡NO eliminará los datos de la base de datos!${NC}\n"
  
  read -p "¿Estás seguro de querer desinstalar? (escribir 'DESINSTALAR' para confirmar): " confirm
  if [ "$confirm" != "DESINSTALAR" ]; then
    error "Desinstalación cancelada"
    exit 1
  fi
}

# Crear backup final
create_final_backup() {
  log "Creando backup final..."
  
  BACKUP_DIR="recipe_system_backup_$(date '+%Y%m%d_%H%M%S')"
  mkdir -p "$BACKUP_DIR"
  
  # Backup de archivos
  cp -r * "$BACKUP_DIR/" 2>/dev/null || true
  
  # Backup de configuración
  if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/"
  fi
  
  # Backup de logs
  if [ -d "logs" ]; then
    cp -r logs "$BACKUP_DIR/"
  fi
  
  # Comprimir backup
  tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
  rm -rf "$BACKUP_DIR"
  
  success "Backup creado: ${BACKUP_DIR}.tar.gz"
}

# Limpiar crontab
clean_crontab() {
  log "Limpiando tareas programadas..."
  
  # Eliminar entradas relacionadas con recipe-system
  crontab -l | grep -v "recipe-system" | crontab -
  
  success "Tareas programadas eliminadas"
}

# Eliminar accesos directos
remove_shortcuts() {
  log "Eliminando accesos directos..."
  
  # Eliminar comando global
  rm -f /usr/local/bin/recipe-system
  
  # Eliminar desktop entry
  rm -f /usr/share/applications/recipe-system.desktop
  
  success "Accesos directos eliminados"
}

# Limpiar variables de entorno
clean_environment() {
  log "Limpiando variables de entorno..."
  
  # Eliminar línea de .bashrc
  sed -i '/recipe-system/d' ~/.bashrc
  
  # Eliminar archivo .env
  rm -f .env
  
  success "Variables de entorno limpiadas"
}

# Eliminar archivos
remove_files() {
  log "Eliminando archivos del sistema..."
  
  # Lista de directorios a eliminar
  local directories=(
    "supabase/migrations"
    "logs"
    "backups"
    "validation_logs"
    "monitoring_logs"
    "quick_logs"
    "safe_update_logs"
  )
  
  # Lista de archivos a eliminar
  local files=(
    "setup_environment.sh"
    "install_full_system.sh"
    "quick_install.sh"
    "safe_update.sh"
    "monitor_system.sh"
    "recipe_system.sh"
    "verify_installation_complete.sh"
    "validate_project.sh"
    "SISTEMA_COMPLETO.md"
    "INSTRUCCIONES.md"
    "PLAN_DE_EJECUCION.md"
    "CHECKLIST.md"
    "RESUMEN_SISTEMA.md"
    "IMPLEMENTACION.md"
  )
  
  # Eliminar directorios
  for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
      rm -rf "$dir"
      success "Eliminado directorio: $dir"
    fi
  done
  
  # Eliminar archivos
  for file in "${files[@]}"; do
    if [ -f "$file" ]; then
      rm -f "$file"
      success "Eliminado archivo: $file"
    fi
  done
}

# Función principal
main() {
  log "Iniciando proceso de desinstalación..."
  echo "----------------------------------------"
  
  # 1. Verificar sudo
  check_sudo
  echo "----------------------------------------"
  
  # 2. Confirmar desinstalación
  confirm_uninstall
  echo "----------------------------------------"
  
  # 3. Crear backup final
  create_final_backup
  echo "----------------------------------------"
  
  # 4. Limpiar crontab
  clean_crontab
  echo "----------------------------------------"
  
  # 5. Eliminar accesos directos
  remove_shortcuts
  echo "----------------------------------------"
  
  # 6. Limpiar ambiente
  clean_environment
  echo "----------------------------------------"
  
  # 7. Eliminar archivos
  remove_files
  echo "----------------------------------------"
  
  success "¡Sistema desinstalado correctamente!"
  
  cat << EOF

${GREEN}Desinstalación completada:${NC}
✓ Backup creado en ${BACKUP_DIR}.tar.gz
✓ Tareas programadas eliminadas
✓ Accesos directos removidos
✓ Variables de entorno limpiadas
✓ Archivos eliminados

${YELLOW}Notas importantes:${NC}
1. Los datos en la base de datos NO han sido eliminados
2. El backup contiene todos los archivos del sistema
3. Las configuraciones personalizadas se han respaldado

${BLUE}Para eliminar los datos de la base de datos:${NC}
1. Conéctate a Supabase
2. Ejecuta las consultas de eliminación manualmente
3. Verifica la eliminación completa

${BLUE}Para restaurar el sistema:${NC}
1. Descomprime el backup: tar -xzf ${BACKUP_DIR}.tar.gz
2. Ejecuta: ./install.sh

EOF
}

# Crear log
mkdir -p uninstall_logs
LOG_FILE="uninstall_logs/uninstall_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar desinstalación
{
  main
} 2>&1 | tee "$LOG_FILE"

# Eliminar script de desinstalación y logs al final
rm -rf uninstall_logs
rm -f "$0"

exit 0