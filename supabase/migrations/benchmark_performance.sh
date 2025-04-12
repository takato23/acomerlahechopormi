#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[BENCH]${NC} $1"; }
success() { echo -e "${GREEN}[GOOD]${NC} $1"; }
warn() { echo -e "${YELLOW}[SLOW]${NC} $1"; }
error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Verificar dependencias
check_dependencies() {
  command -v jq >/dev/null 2>&1 || { error "jq no está instalado. Por favor instala jq."; exit 1; }
  command -v curl >/dev/null 2>&1 || { error "curl no está instalado. Por favor instala curl."; exit 1; }
}

# Verificar credenciales
check_credentials() {
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    error "Configura las credenciales de Supabase:"
    echo "export SUPABASE_URL=tu_url"
    echo "export SUPABASE_KEY=tu_key"
    exit 1
  fi
}

# Función para medir tiempo de respuesta
measure_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  log "Probando $description..."
  
  local start=$(date +%s.%N)
  local response=$(curl -s -w "\n%{time_total}" -X "$method" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    "${SUPABASE_URL}${endpoint}" \
    ${data:+-d "$data"})
  
  local time=$(echo "$response" | tail -n1)
  local result=$(echo "$response" | sed '$d')
  
  # Evaluar rendimiento
  if (( $(echo "$time < 0.3" | bc -l) )); then
    success "$description completado en ${time}s"
  elif (( $(echo "$time < 1.0" | bc -l) )); then
    warn "$description completado en ${time}s"
  else
    error "$description completado en ${time}s"
  fi
  
  echo "$time"
}

# Benchmark: Lectura simple
benchmark_simple_read() {
  measure_request "GET" "/rest/v1/recipes?select=id,title&limit=10" "" "Lectura simple"
}

# Benchmark: Lectura compleja
benchmark_complex_read() {
  measure_request "GET" "/rest/v1/recipes?select=*,recipe_ingredients(*),category(*)&limit=10" "" "Lectura compleja"
}

# Benchmark: Búsqueda por título
benchmark_search() {
  measure_request "GET" "/rest/v1/recipes?title=ilike.*test*" "" "Búsqueda por título"
}

# Benchmark: Creación de receta
benchmark_create() {
  local data='{
    "title": "Benchmark Recipe",
    "description": "Test description",
    "instructions": ["Step 1", "Step 2"],
    "ingredients": [
      {"name": "Test Ingredient", "quantity": 100, "unit": "g"}
    ]
  }'
  
  measure_request "POST" "/rest/v1/recipes" "$data" "Creación de receta"
}

# Benchmark: Actualización de receta
benchmark_update() {
  local data='{"title": "Updated Benchmark Recipe"}'
  measure_request "PATCH" "/rest/v1/recipes?id=eq.last" "$data" "Actualización de receta"
}

# Benchmark: Filtrado complejo
benchmark_complex_filter() {
  measure_request "GET" "/rest/v1/recipes?select=*&is_favorite=eq.true&order=created_at.desc&tags=cs.{test}" "" "Filtrado complejo"
}

# Ejecutar todos los benchmarks
run_benchmarks() {
  log "Iniciando pruebas de rendimiento..."
  echo "----------------------------------------"
  
  # Array para almacenar resultados
  declare -A results
  
  check_dependencies
  check_credentials
  
  # Ejecutar benchmarks múltiples veces
  for i in {1..3}; do
    log "Ronda de pruebas $i/3"
    
    results["simple_read_$i"]=$(benchmark_simple_read)
    results["complex_read_$i"]=$(benchmark_complex_read)
    results["search_$i"]=$(benchmark_search)
    results["create_$i"]=$(benchmark_create)
    results["update_$i"]=$(benchmark_update)
    results["complex_filter_$i"]=$(benchmark_complex_filter)
    
    echo "----------------------------------------"
  done
  
  # Calcular promedios
  echo -e "\n${BLUE}=== Resumen de Rendimiento ===${NC}"
  
  local types=("simple_read" "complex_read" "search" "create" "update" "complex_filter")
  for type in "${types[@]}"; do
    local sum=0
    for i in {1..3}; do
      sum=$(echo "$sum + ${results[${type}_$i]}" | bc)
    done
    local avg=$(echo "scale=3; $sum / 3" | bc)
    
    # Evaluar rendimiento promedio
    if (( $(echo "$avg < 0.3" | bc -l) )); then
      success "Promedio $type: ${avg}s (Bueno)"
    elif (( $(echo "$avg < 1.0" | bc -l) )); then
      warn "Promedio $type: ${avg}s (Lento)"
    else
      error "Promedio $type: ${avg}s (Crítico)"
    fi
  done
  
  # Generar recomendaciones
  echo -e "\n${BLUE}=== Recomendaciones ===${NC}"
  for type in "${types[@]}"; do
    local avg=$(echo "scale=3; (${results[${type}_1]} + ${results[${type}_2]} + ${results[${type}_3]}) / 3" | bc)
    if (( $(echo "$avg >= 1.0" | bc -l) )); then
      case $type in
        "simple_read")
          warn "Considerar agregar índices adicionales para lecturas simples"
          ;;
        "complex_read")
          warn "Evaluar la necesidad de joins complejos o reducir la cantidad de datos recuperados"
          ;;
        "search")
          warn "Considerar implementar búsqueda full-text o mejorar índices existentes"
          ;;
        "create")
          warn "Revisar triggers y validaciones que puedan estar impactando el rendimiento"
          ;;
        "update")
          warn "Verificar locks y concurrencia en actualizaciones"
          ;;
        "complex_filter")
          warn "Optimizar índices para los campos más filtrados"
          ;;
      esac
    fi
  done
}

# Ejecutar benchmarks y guardar log
LOGS_DIR="./benchmark_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/performance_$(date '+%Y%m%d_%H%M%S').log"

{
  run_benchmarks
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}