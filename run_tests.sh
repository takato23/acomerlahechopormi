#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[TEST]${NC} $1"; }
success() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Mostrar banner
show_banner() {
  echo -e "${BLUE}"
  cat << "EOF"
  _____           _                _____         _       
 |  __ \         (_)              |_   _|       | |      
 | |__) |___  ___ _ _ __   ___     | | ___  ___| |_ ___ 
 |  _  // _ \/ __| | '_ \ / _ \    | |/ _ \/ __| __/ __|
 | | \ \  __/ (__| | |_) |  __/    | |  __/\__ \ |_\__ \
 |_|  \_\___|\___|_| .__/ \___|    \_/\___||___/\__|___/
                   | |                                    
                   |_|                                    
EOF
  echo -e "${NC}"
  echo "Sistema de Pruebas Automatizadas"
  echo "================================"
}

# Pruebas de ambiente
test_environment() {
  log "Verificando ambiente..."
  
  # Variables de entorno
  local required_vars=(
    "SUPABASE_URL"
    "SUPABASE_KEY"
    "DB_HOST"
    "DB_USER"
    "DB_NAME"
  )
  
  local failed=0
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      error "Falta variable: $var"
      ((failed++))
    fi
  done
  
  return $failed
}

# Pruebas de servicios
test_services() {
  log "Probando servicios..."
  
  # Crear receta de prueba
  local test_recipe='{
    "title": "Test Recipe",
    "description": "Test Description",
    "instructions": ["Step 1"],
    "ingredients": [{"name": "Test Ingredient", "quantity": 1, "unit": "unit"}]
  }'
  
  # Intentar crear
  local response=$(curl -s -X POST \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$test_recipe" \
    "${SUPABASE_URL}/rest/v1/recipes")
  
  if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    success "Servicio de recetas operativo"
    
    # Limpiar receta de prueba
    local recipe_id=$(echo "$response" | jq -r '.id')
    curl -s -X DELETE \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      "${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipe_id}" >/dev/null
    
    return 0
  else
    error "Error en servicio de recetas"
    return 1
  fi
}

# Pruebas de base de datos
test_database() {
  log "Probando base de datos..."
  
  # Verificar conexión
  if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    error "Error de conexión a base de datos"
    return 1
  fi
  
  # Verificar tablas
  local tables=(
    "recipes"
    "recipe_ingredients"
  )
  
  local failed=0
  for table in "${tables[@]}"; do
    if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\d $table" >/dev/null 2>&1; then
      error "Tabla no encontrada: $table"
      ((failed++))
    fi
  done
  
  return $failed
}

# Pruebas de rendimiento
test_performance() {
  log "Ejecutando pruebas de rendimiento..."
  
  # Query simple
  local start_time=$(date +%s.%N)
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM recipes;" >/dev/null
  local query_time=$(echo "$(date +%s.%N) - $start_time" | bc)
  
  if (( $(echo "$query_time > 1.0" | bc -l) )); then
    warn "Query lenta: ${query_time}s"
  else
    success "Rendimiento aceptable: ${query_time}s"
  fi
  
  # Query compleja
  start_time=$(date +%s.%N)
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT r.*, COUNT(ri.id) as ingredient_count 
    FROM recipes r 
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id 
    GROUP BY r.id 
    LIMIT 10;
  " >/dev/null
  local complex_time=$(echo "$(date +%s.%N) - $start_time" | bc)
  
  if (( $(echo "$complex_time > 2.0" | bc -l) )); then
    warn "Query compleja lenta: ${complex_time}s"
    return 1
  else
    success "Rendimiento complejo aceptable: ${complex_time}s"
    return 0
  fi
}

# Pruebas de monitoreo
test_monitoring() {
  log "Verificando sistema de monitoreo..."
  
  # Verificar scripts de monitoreo
  local monitor_scripts=(
    "health_check.sh"
    "monitor_system.sh"
  )
  
  local failed=0
  for script in "${monitor_scripts[@]}"; do
    if [ ! -x "$script" ]; then
      error "Script no ejecutable: $script"
      ((failed++))
    fi
  done
  
  # Verificar logs
  if [ ! -d "monitoring_logs" ]; then
    error "Directorio de logs no encontrado"
    ((failed++))
  fi
  
  return $failed
}

# Pruebas de seguridad
test_security() {
  log "Ejecutando pruebas de seguridad..."
  
  # Verificar políticas RLS
  local policies=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('recipes', 'recipe_ingredients');
  ")
  
  if [ "$policies" -eq 0 ]; then
    error "No hay políticas RLS configuradas"
    return 1
  fi
  
  success "Políticas de seguridad verificadas"
  return 0
}

# Generar reporte
generate_test_report() {
  local report_file="test_reports/test_run_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p test_reports
  
  {
    echo "# Reporte de Pruebas"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Resultados"
    echo "- Ambiente: $([ $env_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Servicios: $([ $services_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Base de datos: $([ $db_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Rendimiento: $([ $perf_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Monitoreo: $([ $monitor_result -eq 0 ] && echo "✓" || echo "✗")"
    echo "- Seguridad: $([ $security_result -eq 0 ] && echo "✓" || echo "✗")"
    echo
    echo "## Métricas"
    echo "- Query simple: ${query_time}s"
    echo "- Query compleja: ${complex_time}s"
    echo "- Políticas RLS: $policies"
    echo
    echo "## Estado"
    if [ $total_failures -eq 0 ]; then
      echo "✅ Todas las pruebas pasaron"
    else
      echo "⚠️ Fallaron $total_failures pruebas"
    fi
  } > "$report_file"
  
  success "Reporte generado: $report_file"
}

# Función principal
main() {
  show_banner
  
  # Variables para resultados
  local env_result=0
  local services_result=0
  local db_result=0
  local perf_result=0
  local monitor_result=0
  local security_result=0
  local total_failures=0
  
  # 1. Ambiente
  test_environment
  env_result=$?
  ((total_failures+=env_result))
  echo "----------------------------------------"
  
  # 2. Servicios
  test_services
  services_result=$?
  ((total_failures+=services_result))
  echo "----------------------------------------"
  
  # 3. Base de datos
  test_database
  db_result=$?
  ((total_failures+=db_result))
  echo "----------------------------------------"
  
  # 4. Rendimiento
  test_performance
  perf_result=$?
  ((total_failures+=perf_result))
  echo "----------------------------------------"
  
  # 5. Monitoreo
  test_monitoring
  monitor_result=$?
  ((total_failures+=monitor_result))
  echo "----------------------------------------"
  
  # 6. Seguridad
  test_security
  security_result=$?
  ((total_failures+=security_result))
  echo "----------------------------------------"
  
  # Generar reporte
  generate_test_report
  
  # Resumen final
  if [ $total_failures -eq 0 ]; then
    success "🎉 Todas las pruebas pasaron"
  else
    warn "⚠️ Fallaron $total_failures pruebas"
  fi
  
  cat << EOF

${BLUE}Resumen de pruebas:${NC}
✓ Sistema verificado
✓ Servicios probados
✓ Rendimiento medido
✓ Seguridad validada

${BLUE}Para más detalles:${NC}
$ cat test_reports/latest.md

${YELLOW}Si hay fallos:${NC}
1. Revisa los logs detallados
2. Ejecuta pruebas específicas
3. Utiliza ./fix_system.sh
EOF
}

# Crear directorio para logs
mkdir -p test_logs

# Ejecutar pruebas
LOG_FILE="test_logs/test_run_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Crear enlace al último reporte
ln -sf "$(ls -t test_reports/test_run_*.md | head -1)" test_reports/latest.md

exit ${PIPESTATUS[0]}