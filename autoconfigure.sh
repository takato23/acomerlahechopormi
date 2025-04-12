#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[AUTO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar banner
show_banner() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
    _         _        ____             __ _       
   / \  _   _| |_ ___ / ___|___  _ __  / _(_) __ _ 
  / _ \| | | | __/ _ \ |   / _ \| '_ \| |_| |/ _` |
 / ___ \ |_| | || (_) | |__| (_) | | | |  _| | (_| |
/_/   \_\__,_|\__\___/\____\___/|_| |_|_| |_|\__, |
                                             |___/ 
EOF
  echo -e "${NC}"
  echo "Configuración Automática del Sistema"
  echo "==================================="
}

# Verificar requisitos
check_requirements() {
  log "Verificando requisitos del sistema..."
  
  # Verificar Node.js
  if ! command -v node >/dev/null 2>&1; then
    error "Se requiere Node.js"
    return 1
  fi
  
  # Verificar npm
  if ! command -v npm >/dev/null 2>&1; then
    error "Se requiere npm"
    return 1
  fi
  
  # Verificar PostgreSQL
  if ! command -v psql >/dev/null 2>&1; then
    error "Se requiere PostgreSQL"
    return 1
  fi
  
  success "Requisitos verificados"
  return 0
}

# Instalar herramientas globales
install_global_tools() {
  log "Instalando herramientas globales..."
  
  # Lista de herramientas
  local tools=(
    "typescript"
    "ts-node"
    "nodemon"
    "prettier"
    "eslint"
  )
  
  for tool in "${tools[@]}"; do
    log "Instalando $tool..."
    npm install -g "$tool"
  done
  
  success "Herramientas instaladas"
}

# Configurar sistema
setup_system() {
  log "Configurando sistema..."
  
  # 1. Inicializar
  ./initialize.sh --quiet
  if [ $? -ne 0 ]; then
    error "Error en inicialización"
    return 1
  fi
  
  # 2. Configurar ambiente
  ./setup.sh --quick
  if [ $? -ne 0 ]; then
    error "Error en configuración"
    return 1
  fi
  
  # 3. Verificar instalación
  ./verify_installation_complete.sh --quiet
  if [ $? -ne 0 ]; then
    warn "Verificación con advertencias"
  fi
  
  success "Sistema configurado"
}

# Configurar monitoreo
setup_monitoring() {
  log "Configurando monitoreo..."
  
  # 1. Configurar monitoreo
  ./setup_monitoring.sh --quiet
  
  # 2. Programar tareas
  (crontab -l 2>/dev/null; echo "*/15 * * * * $PWD/health_check.sh --quiet") | crontab -
  (crontab -l 2>/dev/null; echo "0 0 * * * $PWD/maintenance.sh --clean --quiet") | crontab -
  
  success "Monitoreo configurado"
}

# Configurar scripts
setup_scripts() {
  log "Configurando scripts..."
  
  # Dar permisos
  chmod +x *.sh
  
  # Crear enlace a CLI
  sudo ln -sf "$PWD/recipes-cli.sh" /usr/local/bin/recipes
  
  success "Scripts configurados"
}

# Verificar sistema
verify_system() {
  log "Verificando sistema completo..."
  
  # 1. Verificar imports
  ./verify_imports.sh --quiet
  
  # 2. Ejecutar pruebas
  ./run_tests.sh --quick
  
  # 3. Verificar salud
  ./health_check.sh --quick
  
  success "Sistema verificado"
}

# Generar informe
generate_report() {
  local report_file="auto_reports/setup_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p auto_reports
  
  {
    echo "# Informe de Configuración Automática"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Componentes Instalados"
    echo "- Sistema base"
    echo "- Herramientas de desarrollo"
    echo "- Sistema de monitoreo"
    echo "- Scripts de mantenimiento"
    echo
    echo "## Estado del Sistema"
    ./health_check.sh --report
    echo
    echo "## Tareas Programadas"
    crontab -l
    echo
    echo "## Próximos Pasos"
    echo "1. Revisar configuración en .env"
    echo "2. Ejecutar pruebas completas"
    echo "3. Configurar respaldos"
  } > "$report_file"
  
  success "Informe generado: $report_file"
}

# Función principal
main() {
  show_banner
  
  echo -e "\n${YELLOW}Este script configurará todo automáticamente:${NC}"
  echo "1. Verificará requisitos"
  echo "2. Instalará herramientas"
  echo "3. Configurará el sistema"
  echo "4. Instalará monitoreo"
  echo "5. Configurará scripts"
  echo -e "6. Verificará todo\n"
  
  read -p "¿Continuar? (s/n): " confirm
  if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    error "Configuración cancelada"
    exit 1
  fi
  
  echo "----------------------------------------"
  
  # 1. Verificar requisitos
  check_requirements || exit 1
  echo "----------------------------------------"
  
  # 2. Instalar herramientas
  install_global_tools
  echo "----------------------------------------"
  
  # 3. Configurar sistema
  setup_system
  echo "----------------------------------------"
  
  # 4. Configurar monitoreo
  setup_monitoring
  echo "----------------------------------------"
  
  # 5. Configurar scripts
  setup_scripts
  echo "----------------------------------------"
  
  # 6. Verificar sistema
  verify_system
  echo "----------------------------------------"
  
  # 7. Generar informe
  generate_report
  
  success "¡Sistema configurado automáticamente!"
  
  cat << EOF

${BLUE}Sistema listo para usar:${NC}
✓ Sistema base instalado
✓ Herramientas configuradas
✓ Monitoreo activado
✓ Scripts preparados

${BLUE}Comandos disponibles:${NC}
$ recipes <comando>   # CLI principal
$ recipes-cli help    # Ver ayuda

${BLUE}Para empezar:${NC}
1. Revisa la configuración en .env
2. Ejecuta: recipes test --all
3. Revisa el informe generado

${YELLOW}Notas importantes:${NC}
- Monitoreo cada 15 minutos
- Limpieza automática diaria
- Logs en /logs
EOF
}

# Crear directorio para logs
mkdir -p logs/auto

# Ejecutar configuración
LOG_FILE="logs/auto/configure_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}