#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[PERMS]${NC} $1"; }
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

# Configurar permisos de archivos
setup_file_permissions() {
  log "Configurando permisos de archivos..."
  
  # Scripts ejecutables
  local executables=(
    "recipes-cli.sh"
    "setup.sh"
    "fix_system.sh"
    "health_check.sh"
    "monitor_system.sh"
    "run_tests.sh"
    "maintenance.sh"
    "verify_imports.sh"
    "fix_recipe_exports.sh"
    "verify_installation_complete.sh"
    "initialize.sh"
    "autoconfigure.sh"
    "configure_permissions.sh"
  )
  
  for script in "${executables[@]}"; do
    if [ -f "$script" ]; then
      chmod 755 "$script"
      success "Permisos ejecutables: $script"
    else
      warn "No se encuentra: $script"
    fi
  done
  
  # Archivos de configuración
  local configs=(
    ".env"
    "config.json"
    "tsconfig.json"
    "package.json"
  )
  
  for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
      chmod 644 "$config"
      success "Permisos de configuración: $config"
    fi
  done
}

# Configurar permisos de directorios
setup_directory_permissions() {
  log "Configurando permisos de directorios..."
  
  # Directorios de sistema
  local system_dirs=(
    "logs"
    "backups"
    "reports"
    "tmp"
  )
  
  for dir in "${system_dirs[@]}"; do
    if [ -d "$dir" ]; then
      chmod 755 "$dir"
      success "Permisos de sistema: $dir"
    else
      mkdir -p "$dir"
      chmod 755 "$dir"
      success "Directorio creado: $dir"
    fi
  done
  
  # Directorios sensibles
  local secure_dirs=(
    "backups/secure"
    "logs/secure"
  )
  
  for dir in "${secure_dirs[@]}"; do
    if [ -d "$dir" ]; then
      chmod 700 "$dir"
      success "Permisos seguros: $dir"
    else
      mkdir -p "$dir"
      chmod 700 "$dir"
      success "Directorio seguro creado: $dir"
    fi
  done
}

# Crear enlaces simbólicos
create_symlinks() {
  log "Creando enlaces simbólicos..."
  
  # Comandos principales
  ln -sf "$PWD/recipes-cli.sh" /usr/local/bin/recipes
  ln -sf "$PWD/health_check.sh" /usr/local/bin/recipes-health
  ln -sf "$PWD/monitor_system.sh" /usr/local/bin/recipes-monitor
  
  success "Enlaces creados en /usr/local/bin"
  
  # Enlaces de logs
  ln -sf "$PWD/logs/current.log" /var/log/recipes.log
  ln -sf "$PWD/logs/monitor.log" /var/log/recipes-monitor.log
  
  success "Enlaces de logs creados"
}

# Configurar git hooks
setup_git_hooks() {
  log "Configurando git hooks..."
  
  local hooks_dir=".git/hooks"
  mkdir -p "$hooks_dir"
  
  # Pre-commit: ejecutar pruebas
  cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash
echo "Ejecutando pruebas rápidas..."
./run_tests.sh --quick
EOF
  chmod +x "$hooks_dir/pre-commit"
  
  # Pre-push: verificar todo
  cat > "$hooks_dir/pre-push" << 'EOF'
#!/bin/bash
echo "Verificando sistema..."
./verify_installation_complete.sh --quick
EOF
  chmod +x "$hooks_dir/pre-push"
  
  success "Git hooks configurados"
}

# Verificar permisos
verify_permissions() {
  log "Verificando permisos..."
  
  local errors=0
  
  # Verificar ejecutables
  find . -type f -name "*.sh" -print0 | while IFS= read -r -d '' file; do
    if [ ! -x "$file" ]; then
      error "Falta permiso de ejecución: $file"
      ((errors++))
    fi
  done
  
  # Verificar directorios
  find . -type d -print0 | while IFS= read -r -d '' dir; do
    if [ ! -x "$dir" ] || [ ! -r "$dir" ]; then
      error "Permisos incorrectos en directorio: $dir"
      ((errors++))
    fi
  done
  
  return $errors
}

# Generar informe
generate_report() {
  local report_file="reports/permissions_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p reports
  
  {
    echo "# Informe de Permisos"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Archivos Ejecutables"
    find . -type f -executable -ls
    echo
    echo "## Directorios"
    find . -type d -ls
    echo
    echo "## Enlaces Simbólicos"
    ls -l /usr/local/bin/recipes*
    echo
    echo "## Git Hooks"
    ls -l .git/hooks/
  } > "$report_file"
  
  success "Informe generado: $report_file"
}

# Función principal
main() {
  log "Configurando permisos del sistema..."
  echo "----------------------------------------"
  
  # 1. Verificar sudo
  check_sudo
  echo "----------------------------------------"
  
  # 2. Configurar permisos de archivos
  setup_file_permissions
  echo "----------------------------------------"
  
  # 3. Configurar permisos de directorios
  setup_directory_permissions
  echo "----------------------------------------"
  
  # 4. Crear enlaces simbólicos
  create_symlinks
  echo "----------------------------------------"
  
  # 5. Configurar git hooks
  setup_git_hooks
  echo "----------------------------------------"
  
  # 6. Verificar permisos
  verify_permissions
  local verify_result=$?
  echo "----------------------------------------"
  
  # 7. Generar informe
  generate_report
  
  if [ $verify_result -eq 0 ]; then
    success "¡Permisos configurados correctamente!"
  else
    warn "Se encontraron $verify_result problemas"
  fi
  
  cat << EOF

${BLUE}Sistema configurado:${NC}
✓ Permisos de archivos
✓ Permisos de directorios
✓ Enlaces simbólicos
✓ Git hooks

${BLUE}Comandos disponibles:${NC}
$ recipes         # CLI principal
$ recipes-health  # Verificar salud
$ recipes-monitor # Monitorear sistema

${BLUE}Logs en:${NC}
- /var/log/recipes.log
- /var/log/recipes-monitor.log

${YELLOW}Nota:${NC}
Los git hooks verificarán el sistema antes de
cada commit y push.
EOF
}

# Crear log
mkdir -p logs/permissions
LOG_FILE="logs/permissions/setup_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar configuración
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}