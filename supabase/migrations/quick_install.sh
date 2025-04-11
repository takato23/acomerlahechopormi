#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[QUICK]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mensaje de ayuda
show_help() {
  cat << EOF
Instalador Rápido del Sistema de Recetas

Uso: ./quick_install.sh [opciones]

Opciones:
  -h, --help              Mostrar esta ayuda
  -f, --force            Forzar instalación sin confirmaciones
  -s, --skip-checks      Saltar verificaciones previas
  -b, --backup           Crear backup antes de instalar
  -m, --minimal          Instalación mínima sin extras
  --no-monitor           No instalar sistema de monitoreo
  --dev                  Modo desarrollo (más logs)

Ejemplos:
  ./quick_install.sh              # Instalación normal
  ./quick_install.sh -f -b        # Instalación forzada con backup
  ./quick_install.sh --minimal    # Instalación mínima
  ./quick_install.sh --dev        # Instalación para desarrollo

Para más información, consulta INSTRUCCIONES.md
EOF
}

# Procesar argumentos
FORCE=0
SKIP_CHECKS=0
BACKUP=0
MINIMAL=0
NO_MONITOR=0
DEV_MODE=0

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -h|--help) show_help; exit 0 ;;
    -f|--force) FORCE=1 ;;
    -s|--skip-checks) SKIP_CHECKS=1 ;;
    -b|--backup) BACKUP=1 ;;
    -m|--minimal) MINIMAL=1 ;;
    --no-monitor) NO_MONITOR=1 ;;
    --dev) DEV_MODE=1 ;;
    *) error "Opción desconocida: $1"; show_help; exit 1 ;;
  esac
  shift
done

# Configurar modo desarrollo
if [ $DEV_MODE -eq 1 ]; then
  set -x
  export PS4='+(${BASH_SOURCE}:${LINENO}): ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
fi

# Verificar variables de entorno
check_env() {
  local missing=0
  
  if [ -z "$SUPABASE_URL" ]; then missing=1; error "Falta SUPABASE_URL"; fi
  if [ -z "$SUPABASE_KEY" ]; then missing=1; error "Falta SUPABASE_KEY"; fi
  if [ -z "$DB_HOST" ]; then missing=1; error "Falta DB_HOST"; fi
  if [ -z "$DB_USER" ]; then missing=1; error "Falta DB_USER"; fi
  if [ -z "$DB_NAME" ]; then missing=1; error "Falta DB_NAME"; fi
  
  if [ $missing -eq 1 ]; then
    error "Variables de entorno faltantes. Revisa INSTRUCCIONES.md"
    exit 1
  fi
}

# Crear backup rápido
create_quick_backup() {
  log "Creando backup rápido..."
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << EOF
    CREATE TABLE IF NOT EXISTS recipes_backup_quick AS SELECT * FROM recipes;
    CREATE TABLE IF NOT EXISTS recipe_ingredients_backup_quick AS SELECT * FROM recipe_ingredients;
EOF
  
  if [ $? -eq 0 ]; then
    success "Backup creado: recipes_backup_quick, recipe_ingredients_backup_quick"
  else
    error "Error creando backup"
    exit 1
  fi
}

# Instalación rápida
quick_install() {
  log "Iniciando instalación rápida..."
  
  # 1. Verificar requisitos mínimos
  if [ $SKIP_CHECKS -eq 0 ]; then
    ./verify_checklist.sh --quick
    if [ $? -ne 0 ] && [ $FORCE -eq 0 ]; then
      error "Verificación falló. Usa -f para forzar instalación"
      exit 1
    fi
  fi
  
  # 2. Backup si se solicitó
  if [ $BACKUP -eq 1 ]; then
    create_quick_backup
  fi
  
  # 3. Instalación básica
  local install_options="--quick"
  [ $MINIMAL -eq 1 ] && install_options="$install_options --minimal"
  [ $DEV_MODE -eq 1 ] && install_options="$install_options --dev"
  
  ./setup_recipes.sh $install_options
  if [ $? -ne 0 ]; then
    error "Error en instalación básica"
    exit 1
  fi
  
  # 4. Configurar monitoreo
  if [ $NO_MONITOR -eq 0 ]; then
    ./monitor_system.sh --setup
    if [ $? -ne 0 ]; then
      warn "Advertencia configurando monitoreo"
    fi
  fi
  
  # 5. Verificación rápida
  ./verify_installation.sh --quick
  if [ $? -ne 0 ]; then
    warn "Algunas verificaciones fallaron"
  fi
}

# Función principal
main() {
  log "🚀 Iniciando instalación rápida del sistema de recetas"
  echo "----------------------------------------"
  
  # Verificar entorno
  check_env
  
  # Tiempo inicio
  start_time=$(date +%s)
  
  # Ejecutar instalación
  quick_install
  
  # Tiempo fin
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  # Resumen
  echo "----------------------------------------"
  success "✨ Instalación completada en $duration segundos"
  
  cat << EOF

${BLUE}Resumen de instalación:${NC}
- Modo: $([[ $MINIMAL -eq 1 ]] && echo "Mínimo" || echo "Completo")
- Backup: $([[ $BACKUP -eq 1 ]] && echo "Sí" || echo "No")
- Monitoreo: $([[ $NO_MONITOR -eq 0 ]] && echo "Instalado" || echo "No instalado")
- Verificación: $([[ $SKIP_CHECKS -eq 0 ]] && echo "Completa" || echo "Saltada")

${BLUE}Próximos pasos:${NC}
1. Revisa los logs en ./quick_logs/
2. Ejecuta algunas pruebas básicas
3. Configura el monitoreo si es necesario

${BLUE}Para más información:${NC}
- Lee INSTRUCCIONES.md
- Ejecuta ./monitor_system.sh
- Revisa RESUMEN_SISTEMA.md
EOF
}

# Crear directorio para logs
LOGS_DIR="./quick_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/quick_install_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar instalación
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}