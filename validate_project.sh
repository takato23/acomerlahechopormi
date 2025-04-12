#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[CHECK]${NC} $1"; }
success() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Verificar estructura del proyecto
check_project_structure() {
  log "Verificando estructura del proyecto..."
  
  local required_files=(
    "supabase/migrations/052_combine_recipe_fixes.sql"
    "supabase/migrations/053_fix_existing_recipe_data.sql"
    "supabase/migrations/054_recipes_rollback.sql"
    "supabase/migrations/055_verify_recipe_system.sql"
    "supabase/migrations/056_recipes_revert_point.sql"
    "supabase/migrations/057_verify_final_state.sql"
    "supabase/migrations/058_emergency_rollback.sql"
    "supabase/migrations/setup_recipes.sh"
    "supabase/migrations/verify_installation.sh"
    "supabase/migrations/test_functionality.sh"
    "supabase/migrations/benchmark_performance.sh"
    "supabase/migrations/monitor_system.sh"
    "supabase/migrations/safe_update.sh"
    "supabase/migrations/recipe_system.sh"
    "supabase/migrations/INSTRUCCIONES.md"
    "supabase/migrations/PLAN_DE_EJECUCION.md"
    "supabase/migrations/CHECKLIST.md"
    "supabase/migrations/RESUMEN_SISTEMA.md"
  )
  
  local missing=0
  for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
      error "Falta archivo: $file"
      missing=1
    fi
  done
  
  if [ $missing -eq 0 ]; then
    success "Estructura del proyecto completa"
    return 0
  else
    return 1
  fi
}

# Verificar permisos de archivos
check_file_permissions() {
  log "Verificando permisos de archivos..."
  
  local executable_files=(
    "supabase/migrations/setup_recipes.sh"
    "supabase/migrations/verify_installation.sh"
    "supabase/migrations/test_functionality.sh"
    "supabase/migrations/benchmark_performance.sh"
    "supabase/migrations/monitor_system.sh"
    "supabase/migrations/safe_update.sh"
    "supabase/migrations/recipe_system.sh"
  )
  
  local invalid=0
  for file in "${executable_files[@]}"; do
    if [ ! -x "$file" ]; then
      error "Falta permiso de ejecución: $file"
      invalid=1
    fi
  done
  
  if [ $invalid -eq 0 ]; then
    success "Permisos de archivos correctos"
    return 0
  else
    return 1
  fi
}

# Verificar scripts
check_scripts() {
  log "Verificando scripts..."
  
  local scripts=(
    "supabase/migrations/setup_recipes.sh"
    "supabase/migrations/verify_installation.sh"
    "supabase/migrations/test_functionality.sh"
    "supabase/migrations/benchmark_performance.sh"
  )
  
  local invalid=0
  for script in "${scripts[@]}"; do
    if ! bash -n "$script"; then
      error "Error de sintaxis en: $script"
      invalid=1
    fi
  done
  
  if [ $invalid -eq 0 ]; then
    success "Scripts verificados correctamente"
    return 0
  else
    return 1
  fi
}

# Verificar SQL
check_sql() {
  log "Verificando archivos SQL..."
  
  local sql_files=($(find supabase/migrations -name "*.sql"))
  local invalid=0
  
  for file in "${sql_files[@]}"; do
    if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file" --dry-run >/dev/null 2>&1; then
      error "Error de sintaxis SQL en: $file"
      invalid=1
    fi
  done
  
  if [ $invalid -eq 0 ]; then
    success "Archivos SQL verificados correctamente"
    return 0
  else
    return 1
  fi
}

# Verificar documentación
check_docs() {
  log "Verificando documentación..."
  
  local docs=(
    "supabase/migrations/INSTRUCCIONES.md"
    "supabase/migrations/PLAN_DE_EJECUCION.md"
    "supabase/migrations/CHECKLIST.md"
    "supabase/migrations/RESUMEN_SISTEMA.md"
  )
  
  local invalid=0
  for doc in "${docs[@]}"; do
    if [ ! -r "$doc" ]; then
      error "No se puede leer: $doc"
      invalid=1
    elif [ ! -s "$doc" ]; then
      warn "Archivo vacío: $doc"
      invalid=1
    fi
  done
  
  if [ $invalid -eq 0 ]; then
    success "Documentación verificada correctamente"
    return 0
  else
    return 1
  fi
}

# Función principal
main() {
  log "Iniciando validación completa del proyecto..."
  echo "----------------------------------------"
  
  local errors=0
  
  # 1. Estructura
  if ! check_project_structure; then
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 2. Permisos
  if ! check_file_permissions; then
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 3. Scripts
  if ! check_scripts; then
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 4. SQL
  if ! check_sql; then
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # 5. Docs
  if ! check_docs; then
    ((errors++))
  fi
  echo "----------------------------------------"
  
  # Resumen
  echo -e "\n${BLUE}=== Resumen de Validación ===${NC}"
  
  if [ $errors -eq 0 ]; then
    success "✨ Proyecto validado exitosamente"
    cat << EOF

${GREEN}El proyecto cumple con todos los requisitos:${NC}
✓ Estructura completa
✓ Permisos correctos
✓ Scripts válidos
✓ SQL sintácticamente correcto
✓ Documentación presente y legible

${BLUE}Próximos pasos:${NC}
1. Ejecuta ./recipe_system.sh install para instalar
2. Revisa INSTRUCCIONES.md para más detalles
3. Configura el monitoreo según necesidades
EOF
  else
    error "❌ Se encontraron $errors errores"
    cat << EOF

${RED}Por favor corrige los errores antes de continuar:${NC}
1. Revisa los mensajes de error arriba
2. Ejecuta este script nuevamente
3. Consulta INSTRUCCIONES.md si necesitas ayuda

${YELLOW}Para soporte:${NC}
- Abre un issue en el repositorio
- Incluye el log de validación
- Describe los pasos realizados
EOF
  fi
}

# Crear directorio para logs
mkdir -p validation_logs

# Ejecutar validación y guardar log
LOG_FILE="validation_logs/validation_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Salir con el código de error apropiado
exit ${PIPESTATUS[0]}