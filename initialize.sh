#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[INIT]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar banner
show_banner() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
  ___      _ _   _       _ _          
 |_ _|_ _ (_) |_(_)__ _ | (_)______ _ 
  | || ' \| |  _| / _` || | |_ / -_) '_|
 |___|_||_|_|\__|_\__,_||_|_/__\___|_|  
                                        
EOF
  echo -e "${NC}"
  echo "Sistema de Inicialización"
  echo "========================="
}

# Configurar permisos
setup_permissions() {
  log "Configurando permisos..."
  
  # Scripts ejecutables
  local executables=(
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
    "IMPLEMENTACION.md"
    "GUIA_RAPIDA.md"
    "COMANDOS.md"
    ".env"
  )
  
  for file in "${readonly_files[@]}"; do
    if [ -f "$file" ]; then
      chmod 644 "$file"
      success "Permisos de lectura: $file"
    fi
  done
}

# Crear estructura de directorios
create_directories() {
  log "Creando estructura de directorios..."
  
  local directories=(
    "logs"
    "logs/system"
    "logs/monitoring"
    "logs/security"
    "logs/tests"
    "backups"
    "backups/daily"
    "backups/weekly"
    "backups/monthly"
    "reports"
    "reports/monitoring"
    "reports/security"
    "reports/tests"
    "tmp"
  )
  
  for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    chmod 755 "$dir"
    success "Directorio creado: $dir"
  done
}

# Verificar herramientas necesarias
check_tools() {
  log "Verificando herramientas necesarias..."
  
  local tools=(
    "node"
    "npm"
    "psql"
    "curl"
    "jq"
  )
  
  local missing=0
  for tool in "${tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      error "Falta herramienta: $tool"
      ((missing++))
    else
      success "Herramienta encontrada: $tool"
    fi
  done
  
  return $missing
}

# Instalar dependencias
install_dependencies() {
  log "Instalando dependencias..."
  
  # Verificar package.json
  if [ ! -f "package.json" ]; then
    error "No se encuentra package.json"
    return 1
  fi
  
  # Instalar dependencias
  npm install
  
  if [ $? -eq 0 ]; then
    success "Dependencias instaladas"
    return 0
  else
    error "Error instalando dependencias"
    return 1
  fi
}

# Configurar git hooks
setup_git_hooks() {
  log "Configurando git hooks..."
  
  # Crear directorio de hooks
  mkdir -p .git/hooks
  
  # Hook pre-commit
  cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./run_tests.sh --quick
EOF
  
  chmod +x .git/hooks/pre-commit
  
  # Hook pre-push
  cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
./run_tests.sh --full
EOF
  
  chmod +x .git/hooks/pre-push
  
  success "Git hooks configurados"
}

# Crear archivos de ejemplo
create_example_files() {
  log "Creando archivos de ejemplo..."
  
  # Ejemplo de .env
  if [ ! -f ".env" ]; then
    cat > .env.example << EOF
SUPABASE_URL=your_url_here
SUPABASE_KEY=your_key_here
DB_HOST=localhost
DB_USER=postgres
DB_NAME=recipes
EOF
    success "Archivo .env.example creado"
  fi
  
  # Ejemplo de configuración
  cat > config.example.json << EOF
{
  "monitoring": {
    "interval": 15,
    "alertEmail": "alerts@example.com",
    "retentionDays": 30
  },
  "backups": {
    "daily": true,
    "weekly": true,
    "monthly": true,
    "retention": {
      "daily": 7,
      "weekly": 4,
      "monthly": 12
    }
  },
  "security": {
    "enableRLS": true,
    "enableAudit": true,
    "maxLoginAttempts": 5
  }
}
EOF
  success "Archivo config.example.json creado"
}

# Función principal
main() {
  show_banner
  
  echo -e "\n${YELLOW}Este script:${NC}"
  echo "1. Configurará permisos"
  echo "2. Creará directorios"
  echo "3. Verificará herramientas"
  echo "4. Instalará dependencias"
  echo "5. Configurará git hooks"
  echo -e "6. Creará archivos de ejemplo\n"
  
  read -p "¿Continuar? (s/n): " confirm
  if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    error "Inicialización cancelada"
    exit 1
  fi
  
  echo "----------------------------------------"
  
  # 1. Configurar permisos
  setup_permissions
  echo "----------------------------------------"
  
  # 2. Crear directorios
  create_directories
  echo "----------------------------------------"
  
  # 3. Verificar herramientas
  check_tools
  local tools_result=$?
  echo "----------------------------------------"
  
  # 4. Instalar dependencias
  install_dependencies
  local deps_result=$?
  echo "----------------------------------------"
  
  # 5. Configurar git hooks
  setup_git_hooks
  echo "----------------------------------------"
  
  # 6. Crear archivos de ejemplo
  create_example_files
  echo "----------------------------------------"
  
  # Resumen final
  if [ $tools_result -eq 0 ] && [ $deps_result -eq 0 ]; then
    success "✨ Sistema inicializado correctamente"
  else
    warn "⚠️ Sistema inicializado con advertencias"
  fi
  
  cat << EOF

${BLUE}Sistema preparado:${NC}
✓ Permisos configurados
✓ Directorios creados
✓ Herramientas verificadas
✓ Dependencias instaladas
✓ Git hooks configurados
✓ Ejemplos creados

${BLUE}Próximos pasos:${NC}
1. Configura las variables en .env
2. Revisa config.json
3. Ejecuta ./setup.sh

${YELLOW}Notas:${NC}
- Revisa .env.example para la configuración
- Personaliza config.json según necesidades
- Los logs se guardarán en /logs
EOF
}

# Crear log
mkdir -p logs/init
LOG_FILE="logs/init/initialize_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar inicialización
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}