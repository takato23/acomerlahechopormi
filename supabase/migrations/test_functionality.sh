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

# Verificar credenciales
check_credentials() {
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    error "Configura las credenciales de Supabase:"
    echo "export SUPABASE_URL=tu_url"
    echo "export SUPABASE_KEY=tu_key"
    exit 1
  fi
}

# Función para hacer requests a Supabase
supabase_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  curl -s -X "$method" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    "${SUPABASE_URL}${endpoint}" \
    ${data:+-d "$data"}
}

# Test: Crear receta
test_create_recipe() {
  log "Probando creación de receta..."
  
  local recipe_data='{
    "title": "Receta de Prueba",
    "description": "Descripción de prueba",
    "instructions": ["Paso 1", "Paso 2"],
    "ingredients": [
      {"name": "Ingrediente 1", "quantity": 100, "unit": "g"},
      {"name": "Ingrediente 2", "quantity": 200, "unit": "ml"}
    ]
  }'
  
  local response=$(supabase_request "POST" "/rest/v1/recipes" "$recipe_data")
  local recipe_id=$(echo "$response" | jq -r '.id')
  
  if [ "$recipe_id" != "null" ] && [ ! -z "$recipe_id" ]; then
    success "Receta creada con ID: $recipe_id"
    echo "$recipe_id" > /tmp/test_recipe_id
    return 0
  else
    error "Error creando receta: $response"
    return 1
  fi
}

# Test: Leer receta
test_read_recipe() {
  local recipe_id=$(cat /tmp/test_recipe_id)
  log "Probando lectura de receta $recipe_id..."
  
  local response=$(supabase_request "GET" "/rest/v1/recipes?id=eq.${recipe_id}&select=*,recipe_ingredients(*)")
  
  if [ "$(echo "$response" | jq length)" -gt 0 ]; then
    success "Receta leída correctamente"
    return 0
  else
    error "Error leyendo receta: $response"
    return 1
  fi
}

# Test: Actualizar receta
test_update_recipe() {
  local recipe_id=$(cat /tmp/test_recipe_id)
  log "Probando actualización de receta $recipe_id..."
  
  local update_data='{
    "title": "Receta Actualizada",
    "description": "Descripción actualizada"
  }'
  
  local response=$(supabase_request "PATCH" "/rest/v1/recipes?id=eq.${recipe_id}" "$update_data")
  
  if [ -z "$response" ]; then
    success "Receta actualizada correctamente"
    return 0
  else
    error "Error actualizando receta: $response"
    return 1
  fi
}

# Test: Marcar como favorito
test_favorite_recipe() {
  local recipe_id=$(cat /tmp/test_recipe_id)
  log "Probando marcar receta como favorita..."
  
  local favorite_data='{"is_favorite": true}'
  local response=$(supabase_request "PATCH" "/rest/v1/recipes?id=eq.${recipe_id}" "$favorite_data")
  
  if [ -z "$response" ]; then
    success "Receta marcada como favorita"
    return 0
  else
    error "Error marcando receta como favorita: $response"
    return 1
  fi
}

# Test: Actualizar ingredientes
test_update_ingredients() {
  local recipe_id=$(cat /tmp/test_recipe_id)
  log "Probando actualización de ingredientes..."
  
  # Primero eliminar ingredientes existentes
  supabase_request "DELETE" "/rest/v1/recipe_ingredients?recipe_id=eq.${recipe_id}"
  
  # Agregar nuevos ingredientes
  local ingredients_data='[
    {"recipe_id": "'$recipe_id'", "ingredient_name": "Nuevo Ingrediente 1", "quantity": 150, "unit": "g"},
    {"recipe_id": "'$recipe_id'", "ingredient_name": "Nuevo Ingrediente 2", "quantity": 300, "unit": "ml"}
  ]'
  
  local response=$(supabase_request "POST" "/rest/v1/recipe_ingredients" "$ingredients_data")
  
  if [ "$(echo "$response" | jq length)" -gt 0 ]; then
    success "Ingredientes actualizados correctamente"
    return 0
  else
    error "Error actualizando ingredientes: $response"
    return 1
  fi
}

# Test: Eliminar receta
test_delete_recipe() {
  local recipe_id=$(cat /tmp/test_recipe_id)
  log "Probando eliminación de receta $recipe_id..."
  
  local response=$(supabase_request "DELETE" "/rest/v1/recipes?id=eq.${recipe_id}")
  
  if [ -z "$response" ]; then
    success "Receta eliminada correctamente"
    rm /tmp/test_recipe_id
    return 0
  else
    error "Error eliminando receta: $response"
    return 1
  fi
}

# Ejecutar todos los tests
run_all_tests() {
  log "Iniciando pruebas funcionales..."
  echo "----------------------------------------"
  
  local failed=0
  
  check_credentials || exit 1
  
  # Ejecutar tests en secuencia
  test_create_recipe || failed=1
  echo "----------------------------------------"
  
  test_read_recipe || failed=1
  echo "----------------------------------------"
  
  test_update_recipe || failed=1
  echo "----------------------------------------"
  
  test_favorite_recipe || failed=1
  echo "----------------------------------------"
  
  test_update_ingredients || failed=1
  echo "----------------------------------------"
  
  test_delete_recipe || failed=1
  echo "----------------------------------------"
  
  if [ $failed -eq 0 ]; then
    success "Todas las pruebas pasaron exitosamente"
    return 0
  else
    error "Algunas pruebas fallaron"
    return 1
  fi
}

# Ejecutar tests y guardar log
LOGS_DIR="./test_logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/functionality_test_$(date '+%Y%m%d_%H%M%S').log"

{
  run_all_tests
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}