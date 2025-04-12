#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[CLEAN]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar banner
show_banner() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
   _____ _                     ___           _        _ _ 
  / ____| |                   |_ _|_ __  ___| |_ __ _| | |
 | |    | | ___  __ _ _ __    | || '_ \/ __| __/ _` | | |
 | |    | |/ _ \/ _` | '_ \   | || | | \__ \ || (_| | | |
 | |____| |  __/ (_| | | | | |___|_| |_|___/\__\__,_|_|_|
  \_____|_|\___|\__,_|_| |_|                              
EOF
  echo -e "${NC}"
  echo "Limpieza e Instalación del Sistema"
  echo "=================================="
}

# Verificar procesos
check_processes() {
  log "Verificando procesos..."
  
  # Verificar procesos del sistema
  local processes=(
    "node"
    "npm"
    "vite"
  )
  
  local found=0
  for proc in "${processes[@]}"; do
    if pgrep -x "$proc" >/dev/null; then
      warn "Proceso activo: $proc"
      ((found++))
    fi
  done
  
  if [ $found -gt 0 ]; then
    read -p "¿Desea terminar estos procesos? (s/n): " confirm
    if [[ "$confirm" =~ ^[Ss]$ ]]; then
      for proc in "${processes[@]}"; do
        pkill -9 -x "$proc" 2>/dev/null
      done
      success "Procesos terminados"
    fi
  else
    success "No hay procesos que limpiar"
  fi
}

# Limpiar caché
clean_cache() {
  log "Limpiando caché..."
  
  # Limpiar caché de npm
  npm cache clean --force
  
  # Limpiar caché de node_modules
  rm -rf node_modules/.cache
  rm -rf node_modules/.vite
  
  # Limpiar caché de TypeScript
  find . -name "*.tsbuildinfo" -delete
  
  success "Caché limpiado"
}

# Limpiar archivos temporales
clean_temp_files() {
  log "Limpiando archivos temporales..."
  
  # Archivos temporales
  local temp_patterns=(
    "*.log"
    "*.tmp"
    "*~"
    ".DS_Store"
  )
  
  for pattern in "${temp_patterns[@]}"; do
    find . -type f -name "$pattern" -delete
  done
  
  success "Archivos temporales eliminados"
}

# Limpiar backups antiguos
clean_old_backups() {
  log "Limpiando backups antiguos..."
  
  # Eliminar backups más antiguos que 30 días
  find backups -type f -mtime +30 -delete
  
  # Eliminar logs más antiguos que 7 días
  find logs -type f -mtime +7 -delete
  
  success "Backups antiguos eliminados"
}

# Verificar espacio
check_space() {
  log "Verificando espacio..."
  
  # Verificar espacio disponible
  local free_space=$(df -h . | awk 'NR==2 {print $4}')
  local used_percent=$(df -h . | awk 'NR==2 {print $5}' | tr -d '%')
  
  if [ "$used_percent" -gt 90 ]; then
    error "Espacio crítico: $free_space libre ($used_percent% usado)"
    return 1
  elif [ "$used_percent" -gt 80 ]; then
    warn "Espacio limitado: $free_space libre ($used_percent% usado)"
  else
    success "Espacio suficiente: $free_space libre ($used_percent% usado)"
  fi
  
  return 0
}

# Reiniciar servicios
reset_services() {
  log "Reiniciando servicios..."
  
  # Detener servicios
  if [ -f "package.json" ]; then
    npm run build --if-present
    npm run clean --if-present
  fi
  
  # Limpiar logs
  truncate -s 0 logs/*.log 2>/dev/null
  
  success "Servicios reiniciados"
}

# Crear backup de seguridad
create_safety_backup() {
  log "Creando backup de seguridad..."
  
  local backup_dir="backups/pre_clean_$(date '+%Y%m%d_%H%M%S')"
  mkdir -p "$backup_dir"
  
  # Backup de archivos importantes
  cp -r src "$backup_dir/" 2>/dev/null
  cp -r public "$backup_dir/" 2>/dev/null
  cp package.json "$backup_dir/" 2>/dev/null
  cp .env "$backup_dir/" 2>/dev/null
  
  success "Backup creado en $backup_dir"
}

# Verificar sistema
verify_system() {
  log "Verificando sistema..."
  
  local problems=0
  
  # Verificar Node.js
  if ! command -v node >/dev/null; then
    error "Node.js no encontrado"
    ((problems++))
  fi
  
  # Verificar npm
  if ! command -v npm >/dev/null; then
    error "npm no encontrado"
    ((problems++))
  fi
  
  # Verificar git
  if ! command -v git >/dev/null; then
    error "git no encontrado"
    ((problems++))
  fi
  
  return $problems
}

# Función principal
main() {
  show_banner
  
  echo -e "\n${YELLOW}Este script:${NC}"
  echo "1. Verificará procesos activos"
  echo "2. Limpiará caché y archivos temporales"
  echo "3. Eliminará backups antiguos"
  echo "4. Verificará espacio disponible"
  echo "5. Reiniciará servicios"
  echo -e "6. Creará backup de seguridad\n"
  
  read -p "¿Continuar? (s/n): " confirm
  if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    error "Limpieza cancelada"
    exit 1
  fi
  
  echo "----------------------------------------"
  
  # 1. Verificar sistema
  verify_system
  echo "----------------------------------------"
  
  # 2. Verificar procesos
  check_processes
  echo "----------------------------------------"
  
  # 3. Crear backup
  create_safety_backup
  echo "----------------------------------------"
  
  # 4. Limpiar caché
  clean_cache
  echo "----------------------------------------"
  
  # 5. Limpiar temporales
  clean_temp_files
  echo "----------------------------------------"
  
  # 6. Limpiar backups
  clean_old_backups
  echo "----------------------------------------"
  
  # 7. Verificar espacio
  check_space
  echo "----------------------------------------"
  
  # 8. Reiniciar servicios
  reset_services
  
  success "¡Sistema limpio y listo para instalar!"
  
  cat << EOF

${BLUE}Sistema preparado:${NC}
✓ Procesos verificados
✓ Caché limpio
✓ Archivos temporales eliminados
✓ Backups antiguos eliminados
✓ Servicios reiniciados

${BLUE}Próximos pasos:${NC}
1. Ejecutar: ./autoconfigure.sh
2. Verificar: ./verify_installation_complete.sh
3. Monitorear: ./monitor_system.sh

${YELLOW}Backup de seguridad:${NC}
Los archivos importantes se han respaldado en:
backups/pre_clean_*
EOF
}

# Crear directorio para logs
mkdir -p logs/clean

# Ejecutar limpieza
LOG_FILE="logs/clean/cleanup_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}