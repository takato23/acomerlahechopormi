#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Lista de archivos que necesitan permisos de ejecución
EXECUTABLE_FILES=(
  "setup_recipes.sh"
  "verify_installation.sh"
  "test_functionality.sh"
  "benchmark_performance.sh"
)

# Lista de archivos SQL y de documentación
SQL_FILES=(
  "052_combine_recipe_fixes.sql"
  "053_fix_existing_recipe_data.sql"
  "054_recipes_rollback.sql"
  "055_verify_recipe_system.sql"
  "056_recipes_revert_point.sql"
  "057_verify_final_state.sql"
  "058_emergency_rollback.sql"
)

DOC_FILES=(
  "README.md"
  "INSTRUCCIONES.md"
)

# Verificar si estamos en el directorio correcto
check_directory() {
  if [ ! -f "setup_recipes.sh" ]; then
    error "Este script debe ejecutarse desde el directorio de migraciones"
    exit 1
  fi
}

# Crear directorios necesarios
create_directories() {
  log "Creando directorios necesarios..."
  
  local dirs=(
    "logs"
    "logs/migrations"
    "logs/tests"
    "logs/benchmarks"
    "backups"
  )
  
  for dir in "${dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      mkdir -p "$dir"
      success "Creado directorio: $dir"
    else
      log "Directorio existente: $dir"
    fi
  done
}

# Verificar y establecer permisos
set_permissions() {
  log "Configurando permisos..."
  
  # Scripts ejecutables
  for file in "${EXECUTABLE_FILES[@]}"; do
    if [ -f "$file" ]; then
      chmod +x "$file"
      success "Permisos de ejecución establecidos: $file"
    else
      warn "Archivo no encontrado: $file"
    fi
  done
  
  # Archivos SQL
  for file in "${SQL_FILES[@]}"; do
    if [ -f "$file" ]; then
      chmod 644 "$file"
      success "Permisos de lectura establecidos: $file"
    else
      warn "Archivo no encontrado: $file"
    fi
  done
  
  # Documentación
  for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
      chmod 644 "$file"
      success "Permisos de lectura establecidos: $file"
    else
      warn "Archivo no encontrado: $file"
    fi
  done
}

# Verificar todos los archivos necesarios
verify_files() {
  log "Verificando archivos necesarios..."
  local missing=0
  
  # Verificar todos los archivos
  for file in "${EXECUTABLE_FILES[@]}" "${SQL_FILES[@]}" "${DOC_FILES[@]}"; do
    if [ ! -f "$file" ]; then
      error "Falta archivo: $file"
      missing=1
    fi
  done
  
  if [ $missing -eq 1 ]; then
    error "Faltan archivos necesarios"
    exit 1
  else
    success "Todos los archivos necesarios están presentes"
  fi
}

# Verificar permisos actuales
check_current_permissions() {
  log "Verificando permisos actuales..."
  local has_issues=0
  
  # Verificar ejecutables
  for file in "${EXECUTABLE_FILES[@]}"; do
    if [ -f "$file" ] && [ ! -x "$file" ]; then
      warn "Falta permiso de ejecución: $file"
      has_issues=1
    fi
  done
  
  # Verificar archivos de solo lectura
  for file in "${SQL_FILES[@]}" "${DOC_FILES[@]}"; do
    if [ -f "$file" ] && [ ! -r "$file" ]; then
      warn "Falta permiso de lectura: $file"
      has_issues=1
    fi
  done
  
  return $has_issues
}

# Verificar directorios de logs
check_log_directories() {
  log "Verificando directorios de logs..."
  local has_issues=0
  
  local dirs=(
    "logs"
    "logs/migrations"
    "logs/tests"
    "logs/benchmarks"
    "backups"
  )
  
  for dir in "${dirs[@]}"; do
    if [ ! -d "$dir" ] || [ ! -w "$dir" ]; then
      warn "Problema con directorio: $dir"
      has_issues=1
    fi
  done
  
  return $has_issues
}

# Función principal
main() {
  log "Iniciando configuración de permisos..."
  echo "----------------------------------------"
  
  # 1. Verificar directorio
  check_directory
  echo "----------------------------------------"
  
  # 2. Verificar archivos
  verify_files
  echo "----------------------------------------"
  
  # 3. Crear directorios
  create_directories
  echo "----------------------------------------"
  
  # 4. Verificar permisos actuales
  if check_current_permissions; then
    success "Permisos actuales correctos"
  else
    warn "Se encontraron problemas con los permisos"
    echo "----------------------------------------"
    
    # 5. Establecer permisos
    set_permissions
  fi
  echo "----------------------------------------"
  
  # 6. Verificar directorios de logs
  if check_log_directories; then
    success "Directorios de logs correctos"
  else
    warn "Problemas con directorios de logs"
  fi
  echo "----------------------------------------"
  
  success "¡Configuración de permisos completada!"
  
  # Instrucciones finales
  cat << EOF

${BLUE}Resumen:${NC}
- Scripts ejecutables (755): ${#EXECUTABLE_FILES[@]}
- Archivos SQL (644): ${#SQL_FILES[@]}
- Documentación (644): ${#DOC_FILES[@]}

${BLUE}Próximos pasos:${NC}
1. Ejecuta la instalación: ./setup_recipes.sh
2. Verifica la instalación: ./verify_installation.sh
3. Ejecuta las pruebas: ./test_functionality.sh
4. Realiza los benchmarks: ./benchmark_performance.sh

Para más información, consulta INSTRUCCIONES.md
EOF
}

# Ejecutar script
main

exit 0