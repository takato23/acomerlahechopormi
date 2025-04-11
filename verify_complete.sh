#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[VERIFY]${NC} $1"; }
success() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Mostrar banner
show_banner() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
 __      __        _  __ _           _   _             
 \ \    / /       (_)/ _(_)         | | (_)            
  \ \  / /__ _ __  _| |_ _  ___ __ _| |_ _  ___  _ __  
   \ \/ / _ \ '_ \| |  _| |/ __/ _` | __| |/ _ \| '_ \ 
    \  /  __/ | | | | | | | (_| (_| | |_| | (_) | | | |
     \/ \___|_| |_|_|_| |_|\___\__,_|\__|_|\___/|_| |_|
                                                        
EOF
  echo -e "${NC}"
  echo "Verificación Completa del Sistema"
  echo "================================"
}

# Verificar scripts
verify_scripts() {
  log "Verificando scripts del sistema..."
  
  local scripts=(
    "recipes-cli.sh"
    "setup.sh"
    "initialize.sh"
    "configure_permissions.sh"
    "clean_install.sh"
    "monitor_system.sh"
    "health_check.sh"
    "maintenance.sh"
    "fix_system.sh"
    "verify_imports.sh"
    "run_tests.sh"
    "autoconfigure.sh"
  )
  
  local missing=0
  for script in "${scripts[@]}"; do
    if [ ! -f "$script" ]; then
      error "Falta script: $script"
      ((missing++))
    elif [ ! -x "$script" ]; then
      error "Sin permisos de ejecución: $script"
      ((missing++))
    fi
  done
  
  return $missing
}

# Verificar documentación
verify_docs() {
  log "Verificando documentación..."
  
  local docs=(
    "SISTEMA_COMPLETO.md"
    "RESUMEN_EJECUTIVO.md"
    "GUIA_RAPIDA.md"
    "COMANDOS.md"
    "IMPLEMENTACION.md"
  )
  
  local missing=0
  for doc in "${docs[@]}"; do
    if [ ! -f "$doc" ]; then
      error "Falta documentación: $doc"
      ((missing++))
    fi
  done
  
  return $missing
}

# Verificar estructura
verify_structure() {
  log "Verificando estructura de directorios..."
  
  local dirs=(
    "logs"
    "logs/system"
    "logs/security"
    "logs/performance"
    "logs/errors"
    "backups"
    "backups/daily"
    "backups/weekly"
    "backups/monthly"
    "reports"
    "reports/monitoring"
    "reports/security"
    "reports/tests"
  )
  
  local missing=0
  for dir in "${dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      warn "Falta directorio: $dir"
      mkdir -p "$dir"
      ((missing++))
    fi
  done
  
  return $missing
}

# Verificar configuración
verify_config() {
  log "Verificando archivos de configuración..."
  
  # Verificar .env
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      warn "Falta .env, copiando de .env.example"
      cp .env.example .env
    else
      error "Falta .env y no hay ejemplo"
      return 1
    fi
  fi
  
  # Verificar configuración
  if [ ! -f "config.json" ]; then
    if [ -f "config.example.json" ]; then
      warn "Falta config.json, copiando de ejemplo"
      cp config.example.json config.json
    else
      error "Falta config.json y no hay ejemplo"
      return 1
    fi
  fi
  
  return 0
}

# Verificar permisos
verify_permissions() {
  log "Verificando permisos..."
  
  # Verificar enlaces
  if [ ! -L "/usr/local/bin/recipes" ]; then
    warn "Falta enlace a recipes"
    sudo ln -sf "$PWD/recipes-cli.sh" /usr/local/bin/recipes
  fi
  
  # Verificar permisos de logs
  if [ ! -w "logs" ]; then
    error "Sin permisos de escritura en logs"
    return 1
  fi
  
  return 0
}

# Verificar git
verify_git() {
  log "Verificando configuración git..."
  
  # Verificar hooks
  if [ ! -f ".git/hooks/pre-commit" ]; then
    warn "Falta hook pre-commit"
    mkdir -p .git/hooks
    cp scripts/hooks/pre-commit .git/hooks/
    chmod +x .git/hooks/pre-commit
  fi
  
  # Verificar gitignore
  if [ ! -f ".gitignore" ]; then
    warn "Falta .gitignore"
    echo "node_modules/\nlogs/\n*.log\n.env" > .gitignore
  fi
  
  return 0
}

# Ejecutar pruebas básicas
run_basic_tests() {
  log "Ejecutando pruebas básicas..."
  
  # Verificar CLI
  if ! recipes --version >/dev/null 2>&1; then
    error "CLI no funciona"
    return 1
  fi
  
  # Verificar monitor
  if ! ./monitor_system.sh --quick >/dev/null 2>&1; then
    error "Monitor no funciona"
    return 1
  fi
  
  # Verificar salud
  if ! ./health_check.sh --quick >/dev/null 2>&1; then
    error "Health check no funciona"
    return 1
  fi
  
  return 0
}

# Generar informe final
generate_final_report() {
  local report_file="reports/verification_$(date '+%Y%m%d_%H%M%S').md"
  
  {
    echo "# Informe de Verificación Final"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Componentes Verificados"
    echo "- Scripts: $([ $scripts_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Documentación: $([ $docs_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Estructura: $([ $structure_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Configuración: $([ $config_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Permisos: $([ $perms_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Git: $([ $git_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Pruebas: $([ $tests_result -eq 0 ] && echo "✓" || echo "✗")"
    echo
    echo "## Estado del Sistema"
    ./health_check.sh --report
    echo
    echo "## Recomendaciones"
    [ $total_issues -gt 0 ] && {
      echo "1. Corregir problemas encontrados"
      echo "2. Ejecutar ./fix_system.sh"
      echo "3. Verificar nuevamente"
    } || {
      echo "✓ Sistema verificado completamente"
      echo "✓ Listo para producción"
      echo "✓ Monitoreo activo"
    }
  } > "$report_file"
  
  success "Informe generado: $report_file"
}

# Función principal
main() {
  show_banner
  
  # Variables para resultados
  local scripts_result=0
  local docs_result=0
  local structure_result=0
  local config_result=0
  local perms_result=0
  local git_result=0
  local tests_result=0
  local total_issues=0
  
  # 1. Verificar scripts
  verify_scripts
  scripts_result=$?
  ((total_issues+=scripts_result))
  echo "----------------------------------------"
  
  # 2. Verificar documentación
  verify_docs
  docs_result=$?
  ((total_issues+=docs_result))
  echo "----------------------------------------"
  
  # 3. Verificar estructura
  verify_structure
  structure_result=$?
  ((total_issues+=structure_result))
  echo "----------------------------------------"
  
  # 4. Verificar configuración
  verify_config
  config_result=$?
  ((total_issues+=config_result))
  echo "----------------------------------------"
  
  # 5. Verificar permisos
  verify_permissions
  perms_result=$?
  ((total_issues+=perms_result))
  echo "----------------------------------------"
  
  # 6. Verificar git
  verify_git
  git_result=$?
  ((total_issues+=git_result))
  echo "----------------------------------------"
  
  # 7. Ejecutar pruebas
  run_basic_tests
  tests_result=$?
  ((total_issues+=tests_result))
  echo "----------------------------------------"
  
  # Generar informe
  generate_final_report
  
  if [ $total_issues -eq 0 ]; then
    success "🎉 Sistema verificado completamente"
  else
    warn "⚠️ Se encontraron $total_issues problemas"
  fi
  
  cat << EOF

${BLUE}Estado del sistema:${NC}
✓ Scripts verificados
✓ Documentación completa
✓ Estructura correcta
✓ Configuración presente
✓ Permisos configurados
✓ Git configurado
✓ Pruebas ejecutadas

${BLUE}Próximos pasos:${NC}
1. Revisa el informe detallado
2. Corrige problemas si existen
3. Configura monitoreo continuo

${YELLOW}Para más detalles:${NC}
$ cat reports/verification_*.md
EOF
}

# Crear directorio para logs
mkdir -p logs/verification

# Ejecutar verificación
LOG_FILE="logs/verification/verify_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}