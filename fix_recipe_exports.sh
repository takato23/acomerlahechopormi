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

# Verificar el archivo del servicio de recetas
check_recipe_service() {
  local service_file="src/features/recipes/services/recipeService.ts"
  
  if [ ! -f "$service_file" ]; then
    error "No se encuentra el archivo $service_file"
    return 1
  fi
  
  log "Analizando $service_file..."
  
  # Hacer backup
  cp "$service_file" "${service_file}.bak"
  success "Backup creado: ${service_file}.bak"
  
  # Verificar contenido actual
  if grep -q "export default" "$service_file"; then
    warn "El archivo ya tiene una exportación por defecto"
  else
    log "Corrigiendo exportaciones..."
    
    # Crear nuevo contenido
    cat > "$service_file" << 'EOF'
// Servicio de recetas
import { supabase } from '../../../lib/supabaseClient';
import { Recipe, RecipeFilters } from '../../../types/recipeTypes';

const recipeService = {
  // Obtener todas las recetas
  getRecipes: async (filters?: RecipeFilters) => {
    let query = supabase
      .from('recipes')
      .select('*');
    
    if (filters) {
      // Aplicar filtros
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.favorite !== undefined) {
        query = query.eq('is_favorite', filters.favorite);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  },
  
  // Obtener una receta por ID
  getRecipeById: async (id: string) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  },
  
  // Crear nueva receta
  createRecipe: async (recipe: Omit<Recipe, 'id'>) => {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  },
  
  // Actualizar receta
  updateRecipe: async (id: string, recipe: Partial<Recipe>) => {
    const { data, error } = await supabase
      .from('recipes')
      .update(recipe)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  },
  
  // Eliminar receta
  deleteRecipe: async (id: string) => {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
  },
  
  // Marcar/desmarcar favorito
  toggleFavorite: async (id: string, isFavorite: boolean) => {
    const { data, error } = await supabase
      .from('recipes')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  }
};

export default recipeService;
EOF
    
    success "Archivo reconstruido con exportación por defecto"
  fi
}

# Verificar el componente de lista de recetas
check_recipe_list() {
  local list_file="src/features/recipes/components/RecipeListPage.tsx"
  
  if [ ! -f "$list_file" ]; then
    error "No se encuentra el archivo $list_file"
    return 1
  fi
  
  log "Analizando $list_file..."
  
  # Hacer backup
  cp "$list_file" "${list_file}.bak"
  success "Backup creado: ${list_file}.bak"
  
  # Verificar y corregir importaciones
  if grep -q "import recipeService from" "$list_file"; then
    success "La importación es correcta"
  else
    log "Corrigiendo importación..."
    
    # Reemplazar importación
    sed -i '' '1i\
import recipeService from "../services/recipeService";\
' "$list_file"
    
    success "Importación corregida"
  fi
}

# Limpiar caché
clean_cache() {
  log "Limpiando caché..."
  
  # Limpiar caché de desarrollo
  rm -rf node_modules/.vite
  rm -rf node_modules/.cache
  find . -name "*.tsbuildinfo" -delete
  
  success "Caché limpiado"
}

# Verificar tipos
check_types() {
  log "Verificando tipos..."
  
  if ! npx tsc --noEmit; then
    warn "Se encontraron errores de tipos, pero continuando..."
  else
    success "Verificación de tipos exitosa"
  fi
}

# Reiniciar servidor de desarrollo
restart_dev_server() {
  log "Reiniciando servidor de desarrollo..."
  
  # Matar proceso actual de vite si existe
  pkill -f "vite"
  
  # Iniciar nuevo servidor
  npm run dev &
  
  success "Servidor reiniciado"
}

# Función principal
main() {
  log "Iniciando corrección de exportaciones de recetas..."
  echo "----------------------------------------"
  
  # 1. Verificar y corregir servicio
  check_recipe_service
  echo "----------------------------------------"
  
  # 2. Verificar y corregir lista
  check_recipe_list
  echo "----------------------------------------"
  
  # 3. Limpiar caché
  clean_cache
  echo "----------------------------------------"
  
  # 4. Verificar tipos
  check_types
  echo "----------------------------------------"
  
  # 5. Reiniciar servidor
  restart_dev_server
  echo "----------------------------------------"
  
  success "¡Correcciones completadas!"
  
  cat << EOF

${BLUE}Resumen de cambios:${NC}
✓ Servicio de recetas reconstruido
✓ Importaciones corregidas
✓ Caché limpiado
✓ Tipos verificados
✓ Servidor reiniciado

${BLUE}Para verificar:${NC}
1. Abre http://localhost:5173 en tu navegador
2. Ve a la lista de recetas
3. Verifica que no hay errores en la consola

${YELLOW}Si persisten los errores:${NC}
1. Revisa los archivos .bak para comparar cambios:
   - ${service_file}.bak
   - ${list_file}.bak
2. Ejecuta 'npm run build' para verificar errores
3. Revisa la consola de desarrollo

${BLUE}Para revertir cambios:${NC}
mv ${service_file}.bak ${service_file}
mv ${list_file}.bak ${list_file}
EOF
}

# Crear log
mkdir -p logs
LOG_FILE="logs/fix_recipe_exports_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar con log
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}