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

# Mostrar banner
show_banner() {
  echo -e "${BLUE}"
  cat << "EOF"
   ____             _         _____ _       
  |  _ \ ___   ___ | |_ ___  |  ___(_)_  __
  | |_) / _ \ / _ \| __/ _ \ | |_  | \ \/ /
  |  _ < (_) | (_) | ||  __/ |  _| | |>  < 
  |_| \_\___/ \___/ \__\___| |_|   |_/_/\_\
                                           
EOF
  echo -e "${NC}"
  echo "Sistema de Corrección y Verificación"
  echo "====================================="
}

# Verificar requisitos
check_requirements() {
  log "Verificando requisitos..."
  
  # Verificar Node.js y npm
  if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
    error "Se requiere Node.js y npm"
    exit 1
  fi
  
  # Verificar dependencias
  if [ ! -d "node_modules" ]; then
    log "Instalando dependencias..."
    npm install
  fi
  
  success "Requisitos verificados"
}

# Ejecutar verificación de imports
run_import_check() {
  log "Verificando estructura de imports..."
  
  ./verify_imports.sh
  local result=$?
  
  if [ $result -eq 0 ]; then
    success "Verificación de imports completada"
    return 0
  else
    warn "Se encontraron problemas en los imports"
    return 1
  fi
}

# Ejecutar corrección de recetas
run_recipe_fix() {
  log "Corrigiendo servicio de recetas..."
  
  ./fix_recipe_exports.sh
  local result=$?
  
  if [ $result -eq 0 ]; then
    success "Servicio de recetas corregido"
    return 0
  else
    error "Error corrigiendo servicio de recetas"
    return 1
  fi
}

# Limpiar y reconstruir
clean_and_rebuild() {
  log "Limpiando y reconstruyendo..."
  
  # Limpiar caché
  rm -rf node_modules/.vite
  rm -rf node_modules/.cache
  
  # Reconstruir
  npm run build
  
  if [ $? -eq 0 ]; then
    success "Reconstrucción completada"
    return 0
  else
    error "Error en la reconstrucción"
    return 1
  fi
}

# Verificar tipos
check_types() {
  log "Verificando tipos..."
  
  npx tsc --noEmit
  
  if [ $? -eq 0 ]; then
    success "Verificación de tipos exitosa"
    return 0
  else
    warn "Se encontraron errores de tipos"
    return 1
  fi
}

# Generar reporte final
generate_final_report() {
  local report_file="fix_reports/system_fix_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p fix_reports
  
  {
    echo "# Reporte de Corrección del Sistema"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Acciones Realizadas"
    echo "1. Verificación de imports"
    echo "2. Corrección de servicio de recetas"
    echo "3. Limpieza y reconstrucción"
    echo "4. Verificación de tipos"
    echo
    echo "## Resultados"
    echo "- Imports: $([ $import_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Recetas: $([ $recipe_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Build: $([ $build_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Tipos: $([ $types_result -eq 0 ] && echo "✓" || echo "✗")"
    echo
    echo "## Estado Final"
    if [ $total_errors -eq 0 ]; then
      echo "✅ Sistema corregido exitosamente"
    else
      echo "⚠️ Quedan $total_errors problemas por resolver"
    fi
  } > "$report_file"
  
  success "Reporte generado: $report_file"
}

# Función principal
main() {
  show_banner
  echo "----------------------------------------"
  
  # Variables para resultados
  local import_result=0
  local recipe_result=0
  local build_result=0
  local types_result=0
  local total_errors=0
  
  # 1. Verificar requisitos
  check_requirements
  echo "----------------------------------------"
  
  # 2. Verificar imports
  run_import_check
  import_result=$?
  ((total_errors+=import_result))
  echo "----------------------------------------"
  
  # 3. Corregir recetas
  run_recipe_fix
  recipe_result=$?
  ((total_errors+=recipe_result))
  echo "----------------------------------------"
  
  # 4. Limpiar y reconstruir
  clean_and_rebuild
  build_result=$?
  ((total_errors+=build_result))
  echo "----------------------------------------"
  
  # 5. Verificar tipos
  check_types
  types_result=$?
  ((total_errors+=types_result))
  echo "----------------------------------------"
  
  # 6. Generar reporte
  generate_final_report
  
  # Resumen final
  if [ $total_errors -eq 0 ]; then
    success "🎉 Sistema corregido exitosamente"
  else
    warn "⚠️ Quedan $total_errors problemas por resolver"
  fi
  
  cat << EOF

${BLUE}Resumen de correcciones:${NC}
✓ Verificación de estructura
✓ Corrección de servicio de recetas
✓ Reconstrucción del sistema
✓ Verificación de tipos

${BLUE}Próximos pasos:${NC}
1. Reinicia el servidor de desarrollo: npm run dev
2. Verifica la aplicación en el navegador
3. Revisa el reporte detallado

${YELLOW}Si persisten los errores:${NC}
1. Revisa los logs individuales en /logs
2. Ejecuta las correcciones manualmente
3. Contacta al equipo de desarrollo

${BLUE}Para más información:${NC}
$ cat fix_reports/latest.md
EOF
}

# Crear directorio para logs
mkdir -p logs

# Ejecutar sistema
LOG_FILE="logs/system_fix_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Crear enlace al último reporte
ln -sf "$(ls -t fix_reports/system_fix_*.md | head -1)" fix_reports/latest.md

exit ${PIPESTATUS[0]}