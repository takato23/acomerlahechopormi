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

# Verificar sudo
check_sudo() {
  if [ "$(id -u)" != "0" ]; then
    error "Este script debe ejecutarse con sudo"
    exit 1
  fi
}

# Crear estructura de directorios
create_directory_structure() {
  log "Creando estructura de directorios..."
  
  local directories=(
    "supabase/migrations/sql"
    "supabase/migrations/scripts"
    "supabase/migrations/docs"
    "logs/migrations"
    "logs/tests"
    "logs/monitor"
    "backups"
    "validation_logs"
    "monitoring_logs"
    "quick_logs"
    "safe_update_logs"
  )
  
  for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    chmod 755 "$dir"
    success "Creado directorio: $dir"
  done
}

# Instalar dependencias
install_dependencies() {
  log "Instalando dependencias..."
  
  # Actualizar repositorios
  apt-get update
  
  # Instalar dependencias
  local packages=(
    postgresql-client
    curl
    jq
    git
    vim
    htop
    tree
  )
  
  for package in "${packages[@]}"; do
    if ! dpkg -l | grep -q "^ii  $package "; then
      apt-get install -y "$package"
      success "Instalado: $package"
    else
      log "Ya instalado: $package"
    fi
  done
}

# Configurar permisos
setup_permissions() {
  log "Configurando permisos..."
  
  # Scripts ejecutables
  local executables=(
    "recipe_system.sh"
    "install_full_system.sh"
    "quick_install.sh"
    "safe_update.sh"
    "monitor_system.sh"
    "validate_project.sh"
    "verify_installation.sh"
    "test_functionality.sh"
    "benchmark_performance.sh"
    "setup_permissions.sh"
    "setup_environment.sh"
  )
  
  for script in "${executables[@]}"; do
    if [ -f "$script" ]; then
      chmod +x "$script"
      success "Permisos de ejecución: $script"
    fi
  done
  
  # Archivos de solo lectura
  local readonly_files=(
    "SISTEMA_COMPLETO.md"
    "INSTRUCCIONES.md"
    "PLAN_DE_EJECUCION.md"
    "CHECKLIST.md"
    "RESUMEN_SISTEMA.md"
  )
  
  for file in "${readonly_files[@]}"; do
    if [ -f "$file" ]; then
      chmod 644 "$file"
      success "Permisos de lectura: $file"
    fi
  done
}

# Configurar variables de entorno
setup_environment_vars() {
  log "Configurando variables de entorno..."
  
  # Crear archivo de entorno si no existe
  if [ ! -f ".env" ]; then
    cat > .env << EOF
# Supabase
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_supabase_key

# PostgreSQL
export DB_HOST=your_db_host
export DB_USER=your_db_user
export DB_NAME=your_db_name

# Sistema
export RECIPE_SYSTEM_HOME=$(pwd)
export PATH=\$PATH:\$RECIPE_SYSTEM_HOME
EOF
    success "Archivo .env creado"
  fi
  
  # Cargar variables
  source .env
  
  # Agregar al bashrc si no existe
  if ! grep -q "source $(pwd)/.env" ~/.bashrc; then
    echo "source $(pwd)/.env" >> ~/.bashrc
    success "Variables de entorno agregadas a .bashrc"
  fi
}

# Crear enlaces simbólicos
create_symlinks() {
  log "Creando enlaces simbólicos..."
  
  # Enlazar scripts principales
  ln -sf "$(pwd)/recipe_system.sh" /usr/local/bin/recipe-system
  success "Enlace creado: recipe-system"
}

# Configurar git hooks
setup_git_hooks() {
  log "Configurando git hooks..."
  
  # Crear directorio de hooks
  mkdir -p .git/hooks
  
  # Hook pre-commit
  cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./validate_project.sh
EOF
  
  chmod +x .git/hooks/pre-commit
  success "Hook pre-commit configurado"
}

# Función principal
main() {
  log "Iniciando configuración del ambiente..."
  echo "----------------------------------------"
  
  # Verificar sudo
  check_sudo
  echo "----------------------------------------"
  
  # Crear directorios
  create_directory_structure
  echo "----------------------------------------"
  
  # Instalar dependencias
  install_dependencies
  echo "----------------------------------------"
  
  # Configurar permisos
  setup_permissions
  echo "----------------------------------------"
  
  # Configurar variables
  setup_environment_vars
  echo "----------------------------------------"
  
  # Crear enlaces
  create_symlinks
  echo "----------------------------------------"
  
  # Configurar git
  setup_git_hooks
  echo "----------------------------------------"
  
  success "✨ Ambiente configurado exitosamente"
  
  cat << EOF

${BLUE}Sistema listo para usar:${NC}
1. Edita .env con tus credenciales
2. Ejecuta: source ~/.bashrc
3. Prueba: recipe-system --help

${BLUE}Estructura creada:${NC}
$(tree -L 2)

${BLUE}Próximos pasos:${NC}
1. Configura las variables en .env
2. Ejecuta ./recipe_system.sh install
3. Verifica con ./validate_project.sh
4. Revisa SISTEMA_COMPLETO.md
EOF
}

# Crear log
LOG_FILE="logs/setup_$(date '+%Y%m%d_%H%M%S').log"
mkdir -p "$(dirname "$LOG_FILE")"

# Ejecutar setup
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}