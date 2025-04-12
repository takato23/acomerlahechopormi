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

# Verificar ambiente
verify_environment() {
  log "Verificando ambiente..."
  
  # Variables requeridas
  local required_vars=(
    "SUPABASE_URL"
    "SUPABASE_KEY"
    "DB_HOST"
    "DB_USER"
    "DB_NAME"
    "RECIPE_SYSTEM_HOME"
  )
  
  local missing=0
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      error "Variable $var no configurada"
      missing=1
    fi
  done
  
  return $missing
}

# Verificar comandos
verify_commands() {
  log "Verificando comandos disponibles..."
  
  local commands=(
    "psql"
    "curl"
    "jq"
    "git"
    "recipe-system"
  )
  
  local missing=0
  for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      error "Comando no encontrado: $cmd"
      missing=1
    fi
  done
  
  return $missing
}

# Verificar estructura
verify_structure() {
  log "Verificando estructura de directorios..."
  
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
  
  local missing=0
  for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
      error "Directorio faltante: $dir"
      missing=1
    elif [ ! -w "$dir" ]; then
      warn "Sin permisos de escritura: $dir"
      missing=1
    fi
  done
  
  return $missing
}

# Verificar scripts
verify_scripts() {
  log "Verificando scripts del sistema..."
  
  local scripts=(
    "recipe_system.sh"
    "install_full_system.sh"
    "quick_install.sh"
    "safe_update.sh"
    "monitor_system.sh"
    "validate_project.sh"
  )
  
  local missing=0
  for script in "${scripts[@]}"; do
    if [ ! -f "$script" ]; then
      error "Script faltante: $script"
      missing=1
    elif [ ! -x "$script" ]; then
      error "Sin permisos de ejecución: $script"
      missing=1
    fi
  done
  
  return $missing
}

# Verificar documentación
verify_docs() {
  log "Verificando documentación..."
  
  local docs=(
    "SISTEMA_COMPLETO.md"
    "INSTRUCCIONES.md"
    "PLAN_DE_EJECUCION.md"
    "CHECKLIST.md"
    "RESUMEN_SISTEMA.md"
  )
  
  local missing=0
  for doc in "${docs[@]}"; do
    if [ ! -f "$doc" ]; then
      error "Documentación faltante: $doc"
      missing=1
    elif [ ! -r "$doc" ]; then
      warn "Sin permisos de lectura: $doc"
      missing=1
    fi
  done
  
  return $missing
}

# Verificar conexión a base de datos
verify_database() {
  log "Verificando conexión a base de datos..."
  
  if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    error "No se puede conectar a la base de datos"
    return 1
  fi
  
  # Verificar tablas principales
  local tables=(
    "recipes"
    "recipe_ingredients"
  )
  
  local missing=0
  for table in "${tables[@]}"; do
    if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\d $table" >/dev/null 2>&1; then
      error "Tabla faltante: $table"
      missing=1
    fi
  done
  
  return $missing
}

# Verificar git hooks
verify_git_hooks() {
  log "Verificando git hooks..."
  
  if [ ! -f ".git/hooks/pre-commit" ]; then
    error "Hook pre-commit no instalado"
    return 1
  fi
  
  if [ ! -x ".git/hooks/pre-commit" ]; then
    error "Hook pre-commit sin permisos de ejecución"
    return 1
  fi
  
  return 0
}

# Ejecutar prueba básica
run_basic_test() {
  log "Ejecutando prueba básica..."
  
  # Intentar crear receta de prueba
  local test_recipe='{
    "title": "Test Recipe",
    "description": "Test Description",
    "instructions": ["Step 1"],
    "ingredients": [{"name": "Test Ingredient", "quantity": 1, "unit": "unit"}]
  }'
  
  local response=$(curl -s -X POST \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$test_recipe" \
    "${SUPABASE_URL}/rest/v1/recipes")
  
  if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    success "Prueba básica exitosa"
    
    # Limpiar receta de prueba
    local recipe_id=$(echo "$response" | jq -r '.id')
    if [ ! -z "$recipe_id" ] && [ "$recipe_id" != "null" ]; then
      curl -s -X DELETE \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        "${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipe_id}" >/dev/null
    fi
    
    return 0
  else
    error "Prueba básica falló"
    return 1
  fi
}

# Función principal
main() {
  log "Iniciando verificación completa de instalación..."
  echo "----------------------------------------"
  
  local errors=0
  
  # 1. Ambiente
  verify_environment
  if [ $? -eq 0 ]; then
    success "✓ Ambiente configurado"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 2. Comandos
  verify_commands
  if [ $? -eq 0 ]; then
    success "✓ Comandos disponibles"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 3. Estructura
  verify_structure
  if [ $? -eq 0 ]; then
    success "✓ Estructura correcta"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 4. Scripts
  verify_scripts
  if [ $? -eq 0 ]; then
    success "✓ Scripts instalados"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 5. Docs
  verify_docs
  if [ $? -eq 0 ]; then
    success "✓ Documentación completa"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 6. Base de datos
  verify_database
  if [ $? -eq 0 ]; then
    success "✓ Base de datos operativa"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 7. Git hooks
  verify_git_hooks
  if [ $? -eq 0 ]; then
    success "✓ Git hooks configurados"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 8. Prueba básica
  run_basic_test
  if [ $? -eq 0 ]; then
    success "✓ Prueba básica exitosa"
  else
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # Resumen
  if [ $errors -eq 0 ]; then
    success "🎉 Instalación verificada exitosamente"
    cat << EOF

${GREEN}Sistema listo para usar:${NC}
✓ Ambiente configurado
✓ Comandos disponibles
✓ Estructura correcta
✓ Scripts instalados
✓ Documentación completa
✓ Base de datos operativa
✓ Git hooks configurados
✓ Pruebas básicas pasadas

${BLUE}Puedes comenzar a usar:${NC}
$ recipe-system --help

${BLUE}Para más información:${NC}
$ cat SISTEMA_COMPLETO.md
EOF
  else
    error "❌ Se encontraron $errors errores"
    cat << EOF

${RED}Por favor corrige los errores antes de continuar:${NC}
1. Revisa los mensajes de error arriba
2. Ejecuta setup_environment.sh nuevamente
3. Vuelve a ejecutar esta verificación

${YELLOW}Para ayuda:${NC}
$ cat INSTRUCCIONES.md
EOF
  fi
}

# Crear directorio para logs
mkdir -p verification_logs

# Ejecutar verificación
LOG_FILE="verification_logs/complete_verify_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}