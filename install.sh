#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[INSTALL]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mostrar banner
show_banner() {
  cat << "EOF"
  _____           _                _____ _      _____       
 |  __ \         (_)              / ____| |    |_   _|      
 | |__) |___  ___ _ _ __   ___  | |    | |      | |        
 |  _  // _ \/ __| | '_ \ / _ \ | |    | |      | |        
 | | \ \  __/ (__| | |_) |  __/ | |____| |____ _| |_       
 |_|  \_\___|\___|_| .__/ \___|  \_____|______|_____|      
                   | |                                       
                   |_|                                       
EOF
  echo -e "${BLUE}Sistema de Gestión de Recetas${NC}"
  echo -e "${YELLOW}Instalación Express${NC}\n"
}

# Verificar requisitos
check_requirements() {
  log "Verificando requisitos..."
  
  # Verificar sudo
  if [ "$(id -u)" != "0" ]; then
    error "Este script debe ejecutarse con sudo"
    exit 1
  fi
  
  # Verificar git
  if ! command -v git >/dev/null 2>&1; then
    apt-get update && apt-get install -y git
  fi
}

# Clonar repositorio
clone_repository() {
  log "Clonando repositorio..."
  
  if [ -d "recipe-system" ]; then
    warn "Directorio existente. Actualizando..."
    cd recipe-system
    git pull
  else
    git clone https://github.com/tu-usuario/recipe-system.git
    cd recipe-system
  fi
}

# Configurar ambiente
setup_env() {
  log "Configurando ambiente..."
  
  # Solicitar datos
  echo -e "\n${BLUE}Configura las credenciales:${NC}"
  read -p "Supabase URL: " supabase_url
  read -p "Supabase Key: " supabase_key
  read -p "DB Host: " db_host
  read -p "DB User: " db_user
  read -p "DB Name: " db_name
  
  # Crear .env
  cat > .env << EOF
# Supabase
export SUPABASE_URL=$supabase_url
export SUPABASE_KEY=$supabase_key

# PostgreSQL
export DB_HOST=$db_host
export DB_USER=$db_user
export DB_NAME=$db_name

# Sistema
export RECIPE_SYSTEM_HOME=$(pwd)
export PATH=\$PATH:\$RECIPE_SYSTEM_HOME
EOF

  success "Variables de entorno configuradas"
}

# Instalar sistema
install_system() {
  log "Instalando sistema..."
  
  # 1. Dar permisos
  chmod +x *.sh
  
  # 2. Configurar ambiente
  ./setup_environment.sh
  
  # 3. Instalar sistema
  ./recipe_system.sh install --quick
  
  # 4. Verificar instalación
  ./verify_installation_complete.sh
}

# Configurar cron
setup_cron() {
  log "Configurando tareas programadas..."
  
  # Backup diario
  echo "0 0 * * * $PWD/recipe_system.sh backup --create" | crontab -
  
  # Monitoreo cada 6 horas
  echo "0 */6 * * * $PWD/recipe_system.sh monitor --report" | crontab -
  
  success "Tareas programadas configuradas"
}

# Generar accesos directos
create_shortcuts() {
  log "Creando accesos directos..."
  
  # Comando global
  ln -sf "$PWD/recipe_system.sh" /usr/local/bin/recipe-system
  
  # Desktop entry
  cat > /usr/share/applications/recipe-system.desktop << EOF
[Desktop Entry]
Name=Recipe System
Comment=Sistema de Gestión de Recetas
Exec=recipe-system
Terminal=true
Type=Application
Categories=Utility;
EOF

  success "Accesos directos creados"
}

# Función principal
main() {
  show_banner
  
  echo -e "${YELLOW}Esta instalación:${NC}"
  echo "1. Configura el ambiente"
  echo "2. Instala dependencias"
  echo "3. Configura la base de datos"
  echo "4. Instala el sistema"
  echo "5. Configura monitoreo"
  echo -e "6. Crea accesos directos\n"
  
  read -p "¿Continuar? (s/n): " confirm
  if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    error "Instalación cancelada"
    exit 1
  fi
  
  echo "----------------------------------------"
  
  # 1. Verificar requisitos
  check_requirements
  echo "----------------------------------------"
  
  # 2. Clonar repositorio
  clone_repository
  echo "----------------------------------------"
  
  # 3. Configurar ambiente
  setup_env
  echo "----------------------------------------"
  
  # 4. Instalar sistema
  install_system
  echo "----------------------------------------"
  
  # 5. Configurar cron
  setup_cron
  echo "----------------------------------------"
  
  # 6. Crear accesos directos
  create_shortcuts
  echo "----------------------------------------"
  
  success "¡Instalación completada exitosamente!"
  
  cat << EOF

${BLUE}Sistema instalado y configurado:${NC}
✓ Ambiente listo
✓ Sistema instalado
✓ Monitoreo configurado
✓ Backups programados
✓ Accesos directos creados

${BLUE}Para comenzar:${NC}
$ recipe-system --help

${BLUE}Para más información:${NC}
$ cat SISTEMA_COMPLETO.md

${YELLOW}¡Gracias por instalar Recipe System!${NC}
EOF
}

# Crear log
mkdir -p logs
LOG_FILE="logs/install_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar instalación
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}