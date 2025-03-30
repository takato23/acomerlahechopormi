# Plan: Gestión de Recetas (MVP)

Este documento detalla el plan para implementar la funcionalidad básica de gestión de recetas, como paso previo a la implementación del Planificador Semanal (Meal Planner), según lo definido en el `ROADMAP.md`.

## Objetivos del MVP de Recetas

*   Permitir a los usuarios crear, ver, editar y eliminar sus propias recetas.
*   Asociar ingredientes (nombre, cantidad, unidad) a cada receta.
*   Establecer la base de datos y la estructura de código para futuras funcionalidades relacionadas con recetas.

## Plan Detallado

1.  **Esquema Base de Datos (Supabase):**
    *   **Tabla `recipes`:**
        *   `id` (uuid, primary key, default: `gen_random_uuid()`)
        *   `user_id` (uuid, foreign key a `auth.users.id`, not null)
        *   `title` (text, not null)
        *   `description` (text, nullable)
        *   `instructions` (text, nullable)
        *   `created_at` (timestamp with time zone, default: `now()`)
        *   *Asegurar RLS (Row Level Security) para que los usuarios solo vean/modifiquen sus propias recetas.*
    *   **Tabla `recipe_ingredients`:**
        *   `id` (uuid, primary key, default: `gen_random_uuid()`)
        *   `recipe_id` (uuid, foreign key a `recipes.id` on delete cascade, not null)
        *   `ingredient_name` (text, not null) - *Texto libre por ahora, sin normalización.*
        *   `quantity` (numeric, nullable)
        *   `unit` (text, nullable) - *Ej: "gr", "ml", "unidad", "cucharada".*
        *   *Asegurar RLS heredada de la tabla `recipes`.*

2.  **Estructura de Archivos (`src/features/recipes/`):**
    *   Crear directorio `src/features/recipes/`.
    *   Archivos principales:
        *   `RecipeListPage.tsx`: Página para listar las recetas del usuario.
        *   `RecipeDetailPage.tsx`: Página para ver los detalles de una receta específica.
        *   `AddEditRecipePage.tsx`: Formulario único para crear y editar recetas.
    *   Subdirectorio `components/`:
        *   `RecipeCard.tsx`: Componente visual para mostrar un resumen de la receta en la lista.
        *   `IngredientInputList.tsx`: Componente para gestionar dinámicamente la lista de ingredientes en el formulario (añadir/eliminar filas).
        *   `IngredientItem.tsx`: Representa una fila de ingrediente dentro de `IngredientInputList`.
    *   Archivos de lógica:
        *   `recipeService.ts`: Contiene todas las funciones asíncronas para interactuar con las tablas de Supabase (`recipes`, `recipe_ingredients`).
        *   `recipeTypes.ts`: Define las interfaces TypeScript (`Recipe`, `RecipeIngredient`).

3.  **Implementar `recipeTypes.ts`:**
    *   Definir `RecipeIngredient`: `id`, `recipe_id`, `ingredient_name`, `quantity`, `unit`.
    *   Definir `Recipe`: `id`, `user_id`, `title`, `description`, `instructions`, `created_at`, `ingredients?: RecipeIngredient[]` (opcional para cuando se cargan juntos).

4.  **Implementar `recipeService.ts`:**
    *   Importar `supabase` de `@/lib/supabaseClient`.
    *   `async function getRecipes(): Promise<Recipe[]>`: Obtiene todas las recetas del usuario actual (`select * from recipes where user_id = auth.uid()`).
    *   `async function getRecipeById(id: string): Promise<Recipe | null>`: Obtiene una receta específica y sus ingredientes asociados (`select *, recipe_ingredients(*) from recipes where id = :id`).
    *   `async function createRecipe(recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at'>, ingredientsData: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]): Promise<Recipe | null>`: Inserta la receta y luego sus ingredientes en una transacción o llamadas separadas. Devuelve la receta creada.
    *   `async function updateRecipe(recipeId: string, recipeData: Partial<Recipe>, ingredientsData: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]): Promise<boolean>`: Actualiza los datos de la receta. Elimina los ingredientes antiguos y re-inserta los nuevos (estrategia simple para MVP).
    *   `async function deleteRecipe(recipeId: string): Promise<boolean>`: Elimina la receta de la tabla `recipes` (los ingredientes se eliminan por `on delete cascade`).

5.  **Implementar Componentes UI:**
    *   `IngredientItem.tsx`: Campos controlados para nombre, cantidad, unidad. Botón para eliminar esta fila.
    *   `IngredientInputList.tsx`: Mantiene un estado con la lista de ingredientes. Renderiza `IngredientItem`s. Botón "Añadir Ingrediente".
    *   `RecipeCard.tsx`: Muestra `title`. Usa `<Link>` de `react-router-dom` para navegar a `RecipeDetailPage`.
    *   `AddEditRecipePage.tsx`:
        *   Obtiene `recipeId` de los parámetros de la URL (si es edición).
        *   Carga datos de la receta si es edición usando `recipeService.getRecipeById`.
        *   Formulario con campos para `title`, `description`, `instructions`.
        *   Usa `IngredientInputList` para gestionar ingredientes.
        *   Al enviar, llama a `recipeService.createRecipe` o `recipeService.updateRecipe`.
        *   Redirige a `RecipeDetailPage` o `RecipeListPage` al guardar.
        *   Usa componentes de `shadcn/ui` (Input, Textarea, Button, Card).
    *   `RecipeDetailPage.tsx`:
        *   Obtiene `recipeId` de los parámetros.
        *   Carga datos usando `recipeService.getRecipeById`.
        *   Muestra `title`, `description`, `instructions` y la lista de `ingredients`.
        *   Botón "Editar" que enlaza a `AddEditRecipePage` (modo edición).
        *   Botón "Eliminar" que llama a `recipeService.deleteRecipe` y redirige a `RecipeListPage`.
    *   `RecipeListPage.tsx`:
        *   Carga recetas usando `recipeService.getRecipes`.
        *   Muestra `RecipeCard` por cada receta.
        *   Muestra estado de carga/error.
        *   Botón "Añadir Receta" que enlaza a `AddEditRecipePage` (modo creación).

6.  **Añadir Rutas (`src/App.tsx`):**
    *   Importar las páginas creadas.
    *   Dentro del `<Route path="/app" element={<ProtectedRoute />}>`:
        *   `<Route path="recipes" element={<RecipeListPage />} />`
        *   `<Route path="recipes/new" element={<AddEditRecipePage />} />`
        *   `<Route path="recipes/:recipeId" element={<RecipeDetailPage />} />`
        *   `<Route path="recipes/:recipeId/edit" element={<AddEditRecipePage />} />`

7.  **Añadir Navegación (`src/components/sections/Navbar.tsx`):**
    *   Dentro de la sección que se muestra cuando `isAppPage && user` es verdadero:
        *   Añadir `<Link to="/app/recipes" ...>Recetas</Link>`.
    *   Añadir el enlace también al menú móvil para `isAppPage && user`.

## Diagrama Mermaid (Flujo Recetas)

```mermaid
graph TD
    subgraph Navbar
        N[Link Recetas] --> RLP(RecipeListPage);
    end

    subgraph RecipeListPage [/app/recipes]
        RLP -- Cargar --> RS(recipeService.getRecipes);
        RS --> RLP;
        RLP -- Mostrar --> RC(RecipeCard);
        RC -- Click --> RDP(RecipeDetailPage);
        RLP -- Click Añadir --> AERP(AddEditRecipePage - Crear);
    end

    subgraph RecipeDetailPage [/app/recipes/:id]
        RDP -- Cargar --> RS2(recipeService.getRecipeById);
        RS2 --> RDP;
        RDP -- Click Editar --> AERP2(AddEditRecipePage - Editar);
        RDP -- Click Eliminar --> RS3(recipeService.deleteRecipe);
        RS3 --> RLP;
    end

    subgraph AddEditRecipePage [/app/recipes/new | /app/recipes/:id/edit]
        AERP -- Cargar (si edita) --> RS2;
        AERP -- Guardar --> RS4(recipeService.create/updateRecipe);
        RS4 -- Éxito --> RDP;
    end

    subgraph recipeService.ts
        RS_GET[getRecipes] --> DB(Supabase SELECT recipes);
        RS_GETID[getRecipeById] --> DB2(Supabase SELECT recipes+ingredients);
        RS_CREATE[createRecipe] --> DB3(Supabase INSERT recipes+ingredients);
        RS_UPDATE[updateRecipe] --> DB4(Supabase UPDATE recipes+ingredients);
        RS_DELETE[deleteRecipe] --> DB5(Supabase DELETE recipes);
    end
```

## Próximos Pasos (Post-MVP Recetas)

*   Implementar el Planificador Semanal (Meal Planner) usando las recetas creadas.
*   Mejorar la gestión de ingredientes (normalización, autocompletado).
*   Filtrar/buscar recetas.