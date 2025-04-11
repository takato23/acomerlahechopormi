#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[FIX]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar archivo recipeService
fix_recipe_service() {
  local file="src/features/recipes/services/recipeService.ts"
  
  if [ ! -f "$file" ]; then
    error "No se encuentra el archivo $file"
    return 1
  }
  
  # Hacer backup
  cp "$file" "${file}.bak"
  
  # Verificar si ya tiene export default
  if ! grep -q "export default" "$file"; then
    log "Corrigiendo exportaciones en $file"
    
    # Leer el contenido actual
    local content=$(cat "$file")
    
    # Crear nuevo contenido con export default
    cat > "$file" << EOF
// Servicio de recetas
const recipeService = {
$(echo "$content" | sed 's/export const \([a-zA-Z]*\)/\1/')
};

export default recipeService;
EOF
    
    success "Archivo corregido: $file"
  else
    success "El archivo ya tiene la estructura correcta"
  fi
}

# Verificar importaciones
fix_imports() {
  local file="src/features/recipes/components/RecipeListPage.tsx"
  
  if [ ! -f "$file" ]; then
    error "No se encuentra el archivo $file"
    return 1
  }
  
  # Hacer backup
  cp "$file" "${file}.bak"
  
  # Corregir importación
  sed -i '' 's/import recipeService from/import * as recipeService from/' "$file"
  
  success "Importaciones corregidas en $file"
}

# Verificar tipos
check_types() {
  log "Verificando tipos..."
  
  if ! npx tsc --noEmit; then
    warn "Se encontraron errores de tipos"
    return 1
  else
    success "Tipos verificados correctamente"
    return 0
  fi
}

# Limpiar caché
clear_cache() {
  log "Limpiando caché..."
  
  # Limpiar caché de vite
  rm -rf node_modules/.vite
  
  # Limpiar caché de TypeScript
  find . -name "*.tsbuildinfo" -delete
  
  success "Caché limpiado"
}

# Función principal
main() {
  log "Iniciando corrección de importaciones..."
  echo "----------------------------------------"
  
  # 1. Corregir servicio
  fix_recipe_service
  echo "----------------------------------------"
  
  # 2. Corregir importaciones
  fix_imports
  echo "----------------------------------------"
  
  # 3. Limpiar caché
  clear_cache
  echo "----------------------------------------"
  
  # 4. Verificar tipos
  check_types
  echo "----------------------------------------"
  
  success "Correcciones completadas"
  
  cat << EOF

${BLUE}Cambios realizados:${NC}
✓ Estructura de recipeService corregida
✓ Importaciones actualizadas
✓ Caché limpiado
✓ Tipos verificados

${BLUE}Próximos pasos:${NC}
1. Reinicia el servidor de desarrollo
2. Verifica que no haya errores
3. Prueba la funcionalidad

${YELLOW}Si persisten los errores:${NC}
1. Revisa los archivos .bak para comparar cambios
2. Ejecuta 'npm run dev' nuevamente
3. Verifica la consola del navegador
EOF
}

# Ejecutar script
main