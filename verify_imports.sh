#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[CHECK]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar estructura de servicios
check_services() {
  log "Verificando estructura de servicios..."
  
  local services_dir="src/features"
  local problems=0
  
  # Buscar todos los archivos de servicio
  find "$services_dir" -type f -name "*Service.ts" | while read service_file; do
    log "Analizando $service_file..."
    
    # Verificar exportación por defecto
    if ! grep -q "export default" "$service_file"; then
      error "Falta export default en $service_file"
      ((problems++))
      
      # Guardar archivo con problemas
      echo "$service_file" >> logs/problematic_services.txt
    fi
    
    # Verificar importaciones circulares
    if grep -q "import.*from.*Service" "$service_file"; then
      warn "Posible importación circular en $service_file"
    fi
  done
  
  return $problems
}

# Verificar componentes
check_components() {
  log "Verificando componentes..."
  
  local components_dir="src/features"
  local problems=0
  
  # Buscar todos los componentes
  find "$components_dir" -type f -name "*.tsx" | while read component_file; do
    log "Analizando $component_file..."
    
    # Verificar importaciones de servicios
    if grep -q "import.*Service from" "$component_file"; then
      # Verificar que el servicio existe
      local service_import=$(grep "import.*Service from" "$component_file" | sed 's/.*from "\(.*\)".*/\1/')
      
      if [ ! -f "src/$service_import.ts" ]; then
        error "Servicio no encontrado: $service_import en $component_file"
        ((problems++))
      fi
    fi
  done
  
  return $problems
}

# Verificar tipos
check_types() {
  log "Verificando tipos..."
  
  local types_dir="src/types"
  local problems=0
  
  # Verificar exportaciones de tipos
  find "$types_dir" -type f -name "*.ts" | while read type_file; do
    log "Analizando $type_file..."
    
    # Verificar que se exportan los tipos
    if ! grep -q "export type\|export interface" "$type_file"; then
      warn "No se encontraron exportaciones en $type_file"
    fi
  done
  
  # Verificar referencias circulares
  if ! npx madge --circular src/; then
    error "Se encontraron referencias circulares"
    ((problems++))
  fi
  
  return $problems
}

# Verificar estructura lazy loading
check_lazy_loading() {
  log "Verificando lazy loading..."
  
  local router_file="src/routes/lazyComponents.tsx"
  
  if [ ! -f "$router_file" ]; then
    warn "No se encuentra archivo de componentes lazy"
    return 1
  fi
  
  # Verificar importaciones lazy
  if ! grep -q "React.lazy" "$router_file"; then
    warn "No se encontraron componentes lazy"
    return 1
  fi
  
  success "Estructura lazy loading correcta"
  return 0
}

# Generar reporte
generate_report() {
  local report_file="import_reports/imports_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p import_reports
  
  {
    echo "# Reporte de Verificación de Imports"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Problemas encontrados"
    
    if [ -f "logs/problematic_services.txt" ]; then
      echo "### Servicios con problemas:"
      cat logs/problematic_services.txt
    else
      echo "✓ No se encontraron servicios con problemas"
    fi
    
    echo
    echo "## Estadísticas"
    echo "- Total de servicios: $(find src/features -type f -name "*Service.ts" | wc -l)"
    echo "- Total de componentes: $(find src/features -type f -name "*.tsx" | wc -l)"
    echo "- Total de tipos: $(find src/types -type f -name "*.ts" | wc -l)"
    
    echo
    echo "## Recomendaciones"
    if [ $total_problems -gt 0 ]; then
      echo "1. Revisar servicios sin export default"
      echo "2. Corregir importaciones circulares"
      echo "3. Verificar servicios faltantes"
    else
      echo "✓ No se requieren acciones correctivas"
    fi
  } > "$report_file"
  
  success "Reporte generado: $report_file"
}

# Función principal
main() {
  log "Iniciando verificación de imports..."
  echo "----------------------------------------"
  
  # Variables para conteo
  local total_problems=0
  
  # Crear directorio de logs
  mkdir -p logs
  
  # 1. Verificar servicios
  check_services
  ((total_problems+=$?))
  echo "----------------------------------------"
  
  # 2. Verificar componentes
  check_components
  ((total_problems+=$?))
  echo "----------------------------------------"
  
  # 3. Verificar tipos
  check_types
  ((total_problems+=$?))
  echo "----------------------------------------"
  
  # 4. Verificar lazy loading
  check_lazy_loading
  ((total_problems+=$?))
  echo "----------------------------------------"
  
  # Generar reporte
  generate_report
  
  # Resumen final
  if [ $total_problems -eq 0 ]; then
    success "✅ Estructura de imports correcta"
  else
    warn "⚠️ Se encontraron $total_problems problemas"
  fi
  
  cat << EOF

${BLUE}Estadísticas:${NC}
- Servicios verificados: $(find src/features -type f -name "*Service.ts" | wc -l)
- Componentes analizados: $(find src/features -type f -name "*.tsx" | wc -l)
- Tipos revisados: $(find src/types -type f -name "*.ts" | wc -l)

${BLUE}Próximos pasos:${NC}
1. Revisa el reporte detallado
2. Corrige los problemas encontrados
3. Ejecuta ./fix_recipe_exports.sh si es necesario

${BLUE}Para más información:${NC}
$ cat import_reports/latest.md
EOF
}

# Ejecutar verificación
LOG_FILE="logs/verify_imports_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Crear enlace al último reporte
ln -sf "$(ls -t import_reports/imports_*.md | head -1)" import_reports/latest.md

exit ${PIPESTATUS[0]}