#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[CLI]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar banner
show_banner() {
  echo -e "${BLUE}"
  cat << "EOF"
   ____           _                  ____ _     ___ 
  |  _ \ ___  ___(_)_ __   ___     / ___| |   |_ _|
  | |_) / _ \/ __| | '_ \ / _ \   | |   | |    | | 
  |  _ <  __/ (__| | |_) |  __/   | |___| |___ | | 
  |_| \_\___|\___|_| .__/ \___|    \____|_____|___|
                   |_|                              
EOF
  echo -e "${NC}"
}

# Mostrar ayuda
show_help() {
  cat << EOF
Uso: recipes-cli <comando> [opciones]

Comandos principales:
  init        Inicializar sistema
  setup       Configurar sistema
  fix         Corregir problemas
  monitor     Monitorear sistema
  test        Ejecutar pruebas

Comandos de mantenimiento:
  backup      Gestionar backups
  verify      Verificar sistema
  health      Verificar salud
  clean       Limpiar sistema

Opciones globales:
  --help      Mostrar esta ayuda
  --version   Mostrar versión
  --quiet     Modo silencioso
  --debug     Modo debug

Ejemplos:
  recipes-cli init           # Inicializar sistema
  recipes-cli fix --quick    # Corrección rápida
  recipes-cli test --all     # Ejecutar todas las pruebas

Para más información:
  recipes-cli <comando> --help
EOF
}

# Mostrar ayuda específica
show_command_help() {
  local command=$1
  case $command in
    init)
      cat << EOF
Uso: recipes-cli init [opciones]

Opciones:
  --force    Forzar inicialización
  --minimal  Instalación mínima
  --dev      Modo desarrollo

Ejemplos:
  recipes-cli init --minimal
  recipes-cli init --dev
EOF
      ;;
    setup)
      cat << EOF
Uso: recipes-cli setup [opciones]

Opciones:
  --quick    Configuración rápida
  --full     Configuración completa
  --monitor  Incluir monitoreo

Ejemplos:
  recipes-cli setup --quick
  recipes-cli setup --full --monitor
EOF
      ;;
    fix)
      cat << EOF
Uso: recipes-cli fix [opciones]

Opciones:
  --quick     Corrección rápida
  --deep      Corrección profunda
  --imports   Solo imports
  --types     Solo tipos

Ejemplos:
  recipes-cli fix --quick
  recipes-cli fix --imports
EOF
      ;;
    *)
      show_help
      ;;
  esac
}

# Ejecutar comando
run_command() {
  local command=$1
  shift
  local options=$@
  
  case $command in
    init)
      ./initialize.sh $options
      ;;
    setup)
      ./setup.sh $options
      ;;
    fix)
      ./fix_system.sh $options
      ;;
    monitor)
      ./monitor_system.sh $options
      ;;
    test)
      ./run_tests.sh $options
      ;;
    backup)
      if [ "$options" == "create" ]; then
        ./recipe_system.sh backup --create
      elif [ "$options" == "list" ]; then
        ./recipe_system.sh backup --list
      elif [ "$options" == "restore" ]; then
        ./recipe_system.sh backup --restore
      else
        show_command_help backup
      fi
      ;;
    verify)
      ./verify_installation_complete.sh $options
      ;;
    health)
      ./health_check.sh $options
      ;;
    clean)
      ./maintenance.sh --clean $options
      ;;
    *)
      error "Comando desconocido: $command"
      show_help
      exit 1
      ;;
  esac
}

# Función principal
main() {
  # Mostrar banner en modo interactivo
  if [ -t 1 ]; then
    show_banner
  fi
  
  # Verificar argumentos
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  # Procesar opciones globales
  while [[ "$1" =~ ^-- ]]; do
    case $1 in
      --help)
        show_help
        exit 0
        ;;
      --version)
        echo "Recipes CLI v1.0.0"
        exit 0
        ;;
      --quiet)
        exec 1>/dev/null
        shift
        ;;
      --debug)
        set -x
        shift
        ;;
      *)
        break
        ;;
    esac
  done
  
  # Obtener comando y opciones
  local command=$1
  shift
  local options=$@
  
  # Mostrar ayuda del comando
  if [ "$options" == "--help" ]; then
    show_command_help "$command"
    exit 0
  fi
  
  # Ejecutar comando
  run_command "$command" "$options"
}

# Crear directorio para logs
mkdir -p cli_logs

# Ejecutar CLI
{
  main "$@"
} 2>&1 | tee -a cli_logs/cli_$(date '+%Y%m%d').log

exit ${PIPESTATUS[0]}