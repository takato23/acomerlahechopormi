# Plan de Implementación: Tags y Vista de Lista para Recetas

## Resumen de Decisiones (Basado en Simulación de Equipo)

1.  **Gestión de Tags:** **Opción A (Predefinidos)**.
    *   Se usará una columna `tags TEXT[]` en la tabla `recipes` de Supabase/PostgreSQL.
    *   Se creará un índice GIN: `CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);`.
    *   Se definirá una lista inicial de tags predefinidos en el frontend.
2.  **Vista de Lista:** **Minimalista y escaneable**.
    *   Mostrará **Título** y **Tags** (usando el componente `Badge`).
    *   Se evaluará añadir tiempo/dificultad con iconos si los datos están disponibles y no sobrecarga el diseño.
    *   **No** incluirá imagen miniatura para optimizar el rendimiento y la escaneabilidad.
3.  **UI Filtros/Switch:**
    *   **Switch de Vista:** Se usarán **botones con iconos** claros (ej., cuadrícula/lista).
    *   **Filtros de Tags:** Se usará una **lista de checkboxes** para los tags predefinidos, probablemente dentro de un componente `Popover` o `Accordion` para ahorrar espacio.

## Plan de Acción Detallado

### 1. Definir Lista Inicial de Tags

*   Crear una constante o archivo de configuración en el frontend (ej., `src/config/recipeTags.ts`) con la lista inicial.
    *   Ejemplo: `['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Vegano', 'Vegetariano', 'Sin Gluten', 'Rápido', 'Económico']` (Ajustar según sea necesario).

### 2. Backend (Supabase/PostgreSQL & Servicios)

*   **Migraciones SQL:**
    *   Crear archivo de migración: `supabase/migrations/XXX_add_recipe_tags_column.sql`
        ```sql
        -- Add tags column to recipes table
        ALTER TABLE public.recipes
        ADD COLUMN tags TEXT[];
        ```
    *   Crear archivo de migración: `supabase/migrations/YYY_add_recipe_tags_index.sql`
        ```sql
        -- Add GIN index for tags array for efficient filtering
        CREATE INDEX idx_recipes_tags ON public.recipes USING GIN (tags);
        ```
*   **Actualizar Tipos:**
    *   Ejecutar `supabase gen types typescript --project-id <your-project-id> --schema public > src/lib/database.types.ts` para regenerar los tipos.
*   **Servicios (`src/features/recipes/recipeService.ts` o equivalente):**
    *   Asegurar que las funciones `createRecipe` y `updateRecipe` incluyan el campo `tags: string[] | null` en sus parámetros y lógica.
    *   Actualizar la función `getRecipes` (o similar):
        *   Añadir un parámetro opcional `selectedTags?: string[]`.
        *   Si `selectedTags` tiene elementos, añadir el filtro a la consulta de Supabase:
          ```typescript
          if (selectedTags && selectedTags.length > 0) {
            query = query.filter('tags', 'cs', `{${selectedTags.join(',')}}`); // 'cs' = contains
            // O alternativamente '@>' si se prefiere la sintaxis de array:
            // query = query.filter('tags', '@>', selectedTags);
          }
          ```
          *Nota: Revisar la documentación de Supabase para la sintaxis de filtro de array más eficiente (`cs` o `@>`). `@>` suele ser preferible con índices GIN.*

### 3. Frontend (React/TypeScript/Zustand)

*   **Store (`src/stores/recipeStore.ts`):**
    *   Añadir estado: `viewMode: 'card' | 'list' = 'card';`
    *   Añadir estado: `selectedTags: string[] = [];`
    *   Añadir estado/constante: `availableTags: string[] = [...] // Importar desde la configuración`.
    *   Modificar la acción `fetchRecipes` para pasar `selectedTags` al servicio backend.
    *   Añadir acción: `setViewMode(mode: 'card' | 'list') { set({ viewMode: mode }); }`
    *   Añadir acción: `toggleTagFilter(tag: string) { set(state => { const newTags = state.selectedTags.includes(tag) ? state.selectedTags.filter(t => t !== tag) : [...state.selectedTags, tag]; state.fetchRecipes(newTags); /* Pasar filtros actualizados */ return { selectedTags: newTags }; }); }`
    *   Añadir acción: `clearTagFilters() { set({ selectedTags: [] }); this.fetchRecipes([]); /* Pasar filtros vacíos */ }`
*   **Página de Recetas (`src/features/recipes/pages/RecipesPage.tsx` o similar):**
    *   Obtener estados y acciones relevantes del `recipeStore`.
    *   Implementar `ViewModeSwitch` component:
        *   Usar `Button` de ShadCN/UI con iconos (ej. `LayoutGrid`, `List`).
        *   Llamar a `setViewMode` al hacer clic.
    *   Implementar `TagFilter` component:
        *   Usar `Popover` o `Accordion` de ShadCN/UI.
        *   Dentro, mapear `availableTags` para renderizar `Checkbox` de ShadCN/UI.
        *   El estado `checked` de cada checkbox se basa en `selectedTags.includes(tag)`.
        *   El `onCheckedChange` llama a `toggleTagFilter(tag)`.
        *   Añadir un botón "Limpiar filtros" que llame a `clearTagFilters`.
    *   Renderizado condicional:
        ```typescript
        {viewMode === 'card' ? (
          <RecipeCardGrid recipes={recipes} loading={loading} />
        ) : (
          <RecipeList recipes={recipes} loading={loading} />
        )}
        ```
*   **Componente Tarjeta (`src/features/recipes/components/RecipeCard.tsx`):**
    *   Añadir sección para mostrar tags:
        ```typescript
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        ```
*   **Nuevo Componente Lista (`src/features/recipes/components/RecipeList.tsx`):**
    *   Props: `recipes: Recipe[]`, `loading: boolean`.
    *   Renderiza un contenedor (ej. `div` o `ul`).
    *   Muestra un spinner si `loading` es true.
    *   Muestra un mensaje si no hay recetas.
    *   Mapea `recipes` y renderiza `<RecipeListItem key={recipe.id} recipe={recipe} />`.
*   **Nuevo Componente Item Lista (`src/features/recipes/components/RecipeListItem.tsx`):**
    *   Props: `recipe: Recipe`.
    *   Renderiza un contenedor (ej. `div` con `border-b`, `li`).
    *   Muestra `recipe.name` (título, ej. `h3` o `p` con fuente grande).
    *   Muestra los `recipe.tags` usando `Badge` (como en `RecipeCard`, quizás más pequeños).
    *   (Opcional) Añadir iconos para tiempo/dificultad.