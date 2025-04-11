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

# Mostrar ayuda
show_help() {
  cat << EOF
Sistema de Recetas - Panel de Control

Uso: ./recipe_system.sh <comando> [opciones]

Comandos:
  install       Instalar sistema completo
    --quick      Instalación rápida
    --minimal    Instalación mínima
    --force      Forzar instalación
  
  update       Actualizar sistema
    --safe       Actualización segura (por defecto)
    --force      Forzar actualización
    --rollback   Revertir última actualización
  
  verify       Verificar sistema
    --full       Verificación completa
    --quick      Verificación rápida
    --structure  Solo estructura
  
  monitor      Monitorear sistema
    --live       Monitoreo en tiempo real
    --report     Generar reporte
    --daily      Estadísticas diarias
  
  backup       Gestionar backups
    --create     Crear nuevo backup
    --list       Listar backups
    --restore    Restaurar backup
  
  maintain     Mantenimiento
    --clean      Limpiar datos antiguos
    --optimize   Optimizar tablas
    --vacuum     Vacuum analyze
  
  test         Ejecutar pruebas
    --all        Todas las pruebas
    --functional Pruebas funcionales
    --perf       Pruebas de rendimiento

Ejemplos:
  ./recipe_system.sh install --quick
  ./recipe_system.sh update --safe
  ./recipe_system.sh monitor --live
  ./recipe_system.sh backup --create
EOF
}

# Verificar requisitos
check_requirements() {
  local cmd=$1
  case $cmd in
    install)
      if [ ! -f "setup_recipes.sh" ]; then
        error "Falta setup_recipes.sh"
        return 1
      fi
      ;;
    update)
      if [ ! -f "safe_update.sh" ]; then
        error "Falta safe_update.sh"
        return 1
      fi
      ;;
    verify)
      if [ ! -f "verify_installation.sh" ]; then
        error "Falta verify_installation.sh"
        return 1
      fi
      ;;
    monitor)
      if [ ! -f "monitor_system.sh" ]; then
        error "Falta monitor_system.sh"
        return 1
      fi
      ;;
    *)
      return 0
      ;;
  esac
}

# Ejecutar comando
run_command() {
  local cmd=$1
  shift
  local options=$@
  
  case $cmd in
    install)
      if [ "$options" == "--quick" ]; then
        ./quick_install.sh
      elif [ "$options" == "--minimal" ]; then
        ./quick_install.sh --minimal
      elif [ "$options" == "--force" ]; then
        ./quick_install.sh --force
      else
        ./install_full_system.sh
      fi
      ;;
      
    update)
      if [ "$options" == "--force" ]; then
        ./safe_update.sh --force
      elif [ "$options" == "--rollback" ]; then
        ./safe_update.sh --rollback $(cat .last_backup)
      else
        ./safe_update.sh
      fi
      ;;
      
    verify)
      if [ "$options" == "--quick" ]; then
        ./verify_checklist.sh --quick
      elif [ "$options" == "--structure" ]; then
        ./verify_checklist.sh --structure
      else
        ./verify_installation.sh
      fi
      ;;
      
    monitor)
      if [ "$options" == "--live" ]; then
        ./monitor_system.sh --live
      elif [ "$options" == "--report" ]; then
        ./monitor_system.sh --report
      else
        ./monitor_system.sh
      fi
      ;;
      
    backup)
      if [ "$options" == "--create" ]; then
        create_safe_point
      elif [ "$options" == "--list" ]; then
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM migration_history ORDER BY created_at DESC;"
      elif [ "$options" == "--restore" ]; then
        perform_rollback
      else
        error "Opción de backup no válida"
        return 1
      fi
      ;;
      
    maintain)
      if [ "$options" == "--clean" ]; then
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM recipes WHERE created_at < NOW() - INTERVAL '1 year';"
      elif [ "$options" == "--optimize" ]; then
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE recipes; ANALYZE recipe_ingredients;"
      elif [ "$options" == "--vacuum" ]; then
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM ANALYZE recipes; VACUUM ANALYZE recipe_ingredients;"
      else
        error "Opción de mantenimiento no válida"
        return 1
      fi
      ;;
      
    test)
      if [ "$options" == "--all" ]; then
        ./test_functionality.sh && ./benchmark_performance.sh
      elif [ "$options" == "--functional" ]; then
        ./test_functionality.sh
      elif [ "$options" == "--perf" ]; then
        ./benchmark_performance.sh
      else
        error "Opción de test no válida"
        return 1
      fi
      ;;
      
    *)
      error "Comando no válido: $cmd"
      show_help
      return 1
      ;;
  esac
}

# Función principal
main() {
  # Verificar argumentos
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  # Obtener comando y opciones
  local cmd=$1
  shift
  local options=$@
  
  # Verificar requisitos
  if ! check_requirements "$cmd"; then
    exit 1
  fi
  
  # Ejecutar comando
  if ! run_command "$cmd" "$options"; then
    error "Error ejecutando comando: $cmd"
    exit 1
  fi
  
  success "Comando completado: $cmd"
}

# Ejecutar script
main "$@"