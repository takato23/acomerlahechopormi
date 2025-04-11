#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[SETUP]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar banner
show_banner() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
   _____           _                     _____ ______ _______ _    _ ____  
  |  __ \         (_)                   / ____|  ____|__   __| |  | |  _ \ 
  | |__) |___  ___ _ _ __   ___  ___  | (___ | |__     | |  | |  | | |_) |
  |  _  // _ \/ __| | '_ \ / _ \/ __|  \___ \|  __|    | |  | |  | |  _ < 
  | | \ \  __/ (__| | |_) |  __/\__ \  ____) | |____   | |  | |__| | |_) |
  |_|  \_\___|\___|_| .__/ \___||___/ |_____/|______|  |_|   \____/|____/ 
                    | |                                                     
                    |_|                                                     
EOF
  echo -e "${NC}"
  echo "Sistema de Configuración y Corrección"
  echo "======================================"
}

# Verificar sudo
check_sudo() {
  if [ "$(id -u)" != "0" ]; then
    error "Este script debe ejecutarse con sudo"
    exit 1
  fi
}

# Configurar variables de entorno
setup_env() {
  log "Configurando variables de entorno..."
  
  # Solicitar datos
  echo -e "\n${BLUE}Configura las credenciales:${NC}"
  read -p "Supabase URL: " supabase_url
  read -p "Supabase Key: " supabase_key
  read -p "DB Host: " db_host
  read -p "DB User: " db_user
  read -p "DB Name: " db_name
  
  # Crear archivo .env
  cat > .env << EOF
SUPABASE_URL=$supabase_url
SUPABASE_KEY=$supabase_key
DB_HOST=$db_host
DB_USER=$db_user
DB_NAME=$db_name
EOF
  
  # Cargar variables
  source .env
  
  success "Variables de entorno configuradas"
}

# Configurar ambiente
setup_environment() {
  log "Configurando ambiente..."
  
  # Dar permisos a scripts
  chmod +x *.sh
  
  # Ejecutar configuración de ambiente
  ./setup_environment.sh
  
  success "Ambiente configurado"
}

# Ejecutar correcciones
run_fixes() {
  log "Ejecutando correcciones..."
  
  # Verificar imports
  ./verify_imports.sh
  
  # Corregir sistema
  ./fix_system.sh
  
  success "Correcciones aplicadas"
}

# Configurar monitoreo
setup_monitoring() {
  log "Configurando monitoreo..."
  
  # Configurar monitoreo
  ./setup_monitoring.sh
  
  # Verificar estado
  ./health_check.sh
  
  success "Monitoreo configurado"
}

# Generar reporte de instalación
generate_install_report() {
  local report_file="setup_reports/installation_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p setup_reports
  
  {
    echo "# Reporte de Instalación"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Componentes Instalados"
    echo "- ✓ Variables de entorno"
    echo "- ✓ Scripts del sistema"
    echo "- ✓ Sistema de monitoreo"
    echo "- ✓ Correcciones automáticas"
    echo
    echo "## Estado del Sistema"
    echo "\`\`\`"
    ./health_check.sh --quick
    echo "\`\`\`"
    echo
    echo "## Próximos Pasos"
    echo "1. Verificar la aplicación en el navegador"
    echo "2. Revisar los logs en /logs"
    echo "3. Configurar respaldos automáticos"
    echo
    echo "## Notas Importantes"
    echo "- Backups diarios configurados"
    echo "- Monitoreo cada 15 minutos"
    echo "- Alertas por email activadas"
  } > "$report_file"
  
  success "Reporte generado: $report_file"
}

# Función principal
main() {
  show_banner
  
  echo -e "\n${YELLOW}Este script configurará todo el sistema:${NC}"
  echo "1. Variables de entorno"
  echo "2. Ambiente de desarrollo"
  echo "3. Correcciones automáticas"
  echo "4. Sistema de monitoreo"
  echo -e "5. Reportes y logs\n"
  
  read -p "¿Continuar? (s/n): " confirm
  if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    error "Instalación cancelada"
    exit 1
  fi
  
  echo "----------------------------------------"
  
  # 1. Verificar sudo
  check_sudo
  echo "----------------------------------------"
  
  # 2. Configurar variables
  setup_env
  echo "----------------------------------------"
  
  # 3. Configurar ambiente
  setup_environment
  echo "----------------------------------------"
  
  # 4. Ejecutar correcciones
  run_fixes
  echo "----------------------------------------"
  
  # 5. Configurar monitoreo
  setup_monitoring
  echo "----------------------------------------"
  
  # 6. Generar reporte
  generate_install_report
  
  success "¡Instalación completada!"
  
  cat << EOF

${BLUE}Sistema instalado y configurado:${NC}
✓ Variables de entorno
✓ Scripts del sistema
✓ Correcciones aplicadas
✓ Monitoreo activo

${BLUE}Para comenzar:${NC}
1. npm run dev
2. Abre http://localhost:5173
3. Revisa setup_reports/latest.md

${YELLOW}Comandos útiles:${NC}
- ./health_check.sh     # Verificar estado
- ./fix_system.sh      # Corregir problemas
- ./monitor_system.sh  # Ver monitoreo

${BLUE}Documentación:${NC}
- SISTEMA_COMPLETO.md  # Documentación completa
- COMANDOS.md         # Lista de comandos
- IMPLEMENTACION.md   # Detalles técnicos
EOF
}

# Crear directorio para logs
mkdir -p logs

# Ejecutar instalación
LOG_FILE="logs/setup_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Crear enlace al último reporte
ln -sf "$(ls -t setup_reports/installation_*.md | head -1)" setup_reports/latest.md

exit ${PIPESTATUS[0]}