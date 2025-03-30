# Plan de Desarrollo: A Comerla App

Este documento describe el plan para implementar las funcionalidades principales de la aplicación "A Comerla". Las prioridades se detallan a continuación.

## Prioridad 1: Funcionalidad de Recetas (CRUD Completo)

**Objetivo General:** Permitir a los usuarios crear, ver, listar, actualizar y eliminar sus propias recetas.

### 1. Implementar Lista de Recetas (`RecipeListPage.tsx`)
   - **Objetivo:** Mostrar una lista de las recetas del usuario.
   - **Tareas:**
        - Crear estado para almacenar recetas (`useState<Recipe[]>([])`).
        - Usar `useEffect` para llamar a `recipeService.getRecipes()` al montar.
        - Actualizar estado con recetas obtenidas.
        - Iterar y renderizar `RecipeCard` para cada receta.
        - `RecipeCard` debe mostrar info básica y enlazar a detalle (`/app/recipes/:recipeId`).
        - Añadir botón/enlace a "Añadir Nueva Receta" (`/app/recipes/new`).
        - Manejar estados de carga y error.

### 2. Implementar Página de Detalle de Receta (`RecipeDetailPage.tsx`)
   - **Objetivo:** Mostrar información completa de una receta (ingredientes, instrucciones).
   - **Tareas:**
        - Obtener `recipeId` de `useParams`.
        - Crear estado para la receta (`useState<Recipe | null>(null)`).
        - Usar `useEffect` para llamar a `recipeService.getRecipeById(recipeId)`.
        - Actualizar estado con la receta obtenida.
        - Mostrar nombre, descripción, tiempo, etc.
        - Mostrar lista de ingredientes (`recipe.recipe_ingredients`).
        - Mostrar instrucciones (campo `instructions` en tabla `recipes`).
        - Añadir botón "Editar" (navega a `/app/recipes/:recipeId/edit`).
        - Añadir botón "Eliminar" (llama a `recipeService.deleteRecipe(recipeId)` y redirige a `/app/recipes`).
        - Manejar estados de carga y error/no encontrado.

### 3. Implementar Página de Añadir/Editar Receta (`AddEditRecipePage.tsx`)
   - **Objetivo:** Formulario para crear o modificar recetas.
   - **Tareas:**
        - Determinar modo "añadir" vs "editar" (por `recipeId` en `useParams`).
        - Si es modo "editar", cargar datos existentes con `recipeService.getRecipeById(recipeId)`.
        - Crear estados para campos del formulario (nombre, descripción, etc.) y lista de ingredientes.
        - Usar `IngredientInputList` para gestionar ingredientes dinámicamente.
        - Implementar `handleSubmit`:
            - Recopilar datos del formulario e ingredientes.
            - Llamar a `recipeService.createRecipe` (añadir) o `recipeService.updateRecipe` (editar).
            - Navegar a detalle tras éxito o mostrar error.
        - Manejar estado de envío (loading) y errores.

### Servicios y Base de Datos (Recetas)
   - **`recipeService.ts`:** Encapsula llamadas a Supabase para CRUD de recetas e ingredientes. Incluye ingredientes relacionados en `getRecipes`.
   - **Supabase - Tabla `recipes`:** Columnas: `id`, `user_id`, `name`, `description`, `instructions`, `prep_time`, `created_at`, etc.
   - **Supabase - Tabla `recipe_ingredients`:** Columnas: `id`, `recipe_id`, `ingredient_name`, `quantity`, `unit`. (Relación con `recipes`).
   - **RLS:** Asegurar que los usuarios solo accedan a sus propias recetas.

## Prioridad 2: Funcionalidad de Despensa (Pantry)

**Objetivo General:** Permitir a los usuarios gestionar un inventario de los ingredientes que poseen.

### 1. Crear Recursos de Base de Datos y Servicio
   - **Supabase - Tabla `pantry_items`:** Crear tabla con columnas: `id`, `user_id`, `ingredient_name`, `quantity`, `unit`, `created_at`. Configurar RLS.
   - **Crear Servicio (`pantryService.ts`):** Implementar funciones CRUD: `getPantryItems()`, `addPantryItem()`, `updatePantryItem()`, `deletePantryItem()` interactuando con la tabla `pantry_items`.

### 2. Implementar Página de Despensa (`PantryPage.tsx`)
   - **Objetivo:** Interfaz para ver, añadir y eliminar items de la despensa.
   - **Tareas:**
        - Añadir ruta `/app/pantry` en `App.tsx`.
        - Usar `useEffect` para llamar a `pantryService.getPantryItems()` al montar.
        - Mostrar lista de items usando `PantryList.tsx`.
        - Incluir `AddPantryItemForm.tsx` para añadir/editar items (llama a `pantryService`).
        - Implementar funcionalidad para eliminar items (llama a `pantryService.deletePantryItem()`).
        - Manejar estados de carga y error.

## Prioridad 3: Mejoras en Perfil de Usuario (`UserProfilePage.tsx`)

**Objetivo General:** Completar la funcionalidad básica del perfil.

### 1. Implementar Funcionalidad Completa
   - **Tareas:**
        - Usar `useAuth` para obtener `user` y `profile`.
        - Mostrar `profile.email` en `ProfileInfo`.
        - Conectar `DietaryPreferences` para mostrar `profile.dietary_preference` y llamar a `handleUpdatePreference` (que usa `userService.updateUserProfile`) al cambiar la selección.
        - Asegurar manejo de estados de carga y error en la página.

### Servicios y Base de Datos (Perfil)
   - **`userService.ts`:** Funciones `getUserProfile` y `updateUserProfile`.
   - **Supabase - Tabla `profiles`:** Columnas: `id`, `username` (opcional), `dietary_preference`, etc. (Relación con `auth.users`).

## Prioridad 4: Planificación Semanal (Manual)

**Objetivo General:** Permitir a los usuarios asignar recetas o comidas personalizadas a días específicos de la semana.

### 1. Crear Estructura y Tipos
   - Crear carpeta `src/features/planning/`.
   - Definir tipo `PlannedMeal` en `src/features/planning/types.ts`: { id, date, mealType ('breakfast' | 'lunch' | 'dinner'), recipeId (nullable), customMealText (nullable), userId }.

### 2. Crear Tabla Supabase
   - Crear tabla `planned_meals` con columnas basadas en `PlannedMeal`. Configurar RLS por `userId`.

### 3. Crear Servicio (`planningService.ts`)
   - Implementar funciones CRUD: `getPlannedMeals(startDate, endDate)`, `addPlannedMeal()`, `updatePlannedMeal()`, `deletePlannedMeal()`.

### 4. Implementar UI (`PlanningPage.tsx`)
   - Añadir ruta `/app/planning` en `App.tsx`.
   - **Componente Calendario:** Vista semanal básica (cuadrícula).
   - **Mostrar Comidas:** Obtener y mostrar `planned_meals` en el calendario.
   - **Añadir/Editar Comida:** Modal/Formulario para seleccionar receta existente (usando `recipeService.getRecipes`) o escribir texto libre. Guardar con `planningService`.
   - **Eliminar Comida:** Botón para eliminar usando `planningService`.
   - **Navegación Semanal:** Botones para cambiar de semana.

## Prioridad 5: Lista de Compras (Básica)

**Objetivo General:** Generar una lista de ingredientes basada en las comidas planificadas.

### 1. Crear Estructura y Tipos
   - Crear carpeta `src/features/shopping-list/`.
   - Definir tipo `ShoppingListItem` en `src/features/shopping-list/types.ts`: { ingredientName, quantity, unit, recipeSource (opcional) }.
   - *(Opcional - Si se persiste)* Tabla `shopping_list_items` en Supabase.

### 2. Crear Servicio (`shoppingListService.ts`)
   - Implementar `generateShoppingList(startDate, endDate)`:
      - Obtiene `planned_meals` (usando `planningService`).
      - Obtiene detalles de las recetas asociadas (usando `recipeService`).
      - Extrae, agrupa y suma ingredientes.
      - Devuelve array de `ShoppingListItem`.
   - *(Opcional - Si se persiste)* Implementar CRUD para `shopping_list_items`.

### 3. Implementar UI (`ShoppingListPage.tsx`)
   - Añadir ruta `/app/shopping-list` en `App.tsx`.
   - *(Opcional)* Selector de rango de fechas.
   - Botón "Generar Lista" que llama a `generateShoppingList`.
   - Mostrar la lista agrupada de `ShoppingListItem`.
   - *(Opcional - Si se persiste)* Permitir marcar/desmarcar items, limpiar lista.

## Optimización/Refactorización Potencial

*   **Estado Global:** Considerar mover listas de recetas y despensa a Context/Zustand.
*   **Componentes Reutilizables:** Extraer modales, selectores de fecha, etc.
*   **Manejo de Errores:** Estandarizar feedback al usuario.

## Diagrama de Flujo General (Actualizado)

```mermaid
graph TD
    subgraph Autenticación
        Login --> AuthContext[AuthContext verifica/establece sesión]
    end

    subgraph App Principal [/app]
        AuthContext -- Usuario Autenticado --> ProtectedRoute
        ProtectedRoute --> AppLayout[AppLayout con Sidebar]
        AppLayout --> Outlet[Renderiza Rutas Hijas]
    end

    subgraph Rutas Hijas
        Outlet --> Dashboard[/app]
        Outlet --> UserProfile[/app/profile]
        Outlet --> Pantry[/app/pantry]
        Outlet --> Planning[/app/planning] // Nueva ruta
        Outlet --> ShoppingList[/app/shopping-list] // Nueva ruta
        Outlet --> RecipeList[/app/recipes]
        Outlet --> RecipeDetail[/app/recipes/:id]
        Outlet --> AddEditRecipe[/app/recipes/new | /app/recipes/:id/edit]
    end

    subgraph Perfil
        UserProfile -- Lee/Escribe --> UserService[userService.ts]
        UserService -- interactúa --> SupabaseProfiles[Supabase: profiles]
    end

    subgraph Despensa
        Pantry -- Lee/Crea/Elimina --> PantryService[pantryService.ts]
        PantryService -- interactúa --> SupabasePantry[Supabase: pantry_items]
    end

     subgraph Planificación
        Planning -- CRUD --> PlanningService[planningService.ts]
        PlanningService -- CRUD --> SupabasePlanning[Supabase: planned_meals]
        Planning -- Lee Recetas --> RecipeService
    end

    subgraph Lista Compras
        ShoppingList -- Genera/Lee --> ShoppingListService[shoppingListService.ts]
        ShoppingListService -- Lee Plan --> PlanningService
        ShoppingListService -- Lee Recetas --> RecipeService
        %% Si persiste
        ShoppingListService -- CRUD --> SupabaseShopping[Supabase: shopping_list_items]
    end

    subgraph Recetas
        RecipeList -- Lee --> RecipeService[recipeService.ts]
        RecipeDetail -- Lee/Elimina --> RecipeService
        AddEditRecipe -- Crea/Actualiza --> RecipeService
        RecipeService -- interactúa --> SupabaseRecipes[Supabase: recipes, recipe_ingredients]
    end

    AuthContext -- Lee Perfil --> UserService
```

## Refinamiento UI - RecipeListPage Fase 1

**Objetivo:** Mejorar la apariencia visual y experiencia de usuario de la página de lista de recetas.

### 1. Ajustar Layout de Controles
   - **Tarea:** Modificar JSX para envolver `Input` (búsqueda) y `AnimatedTabs` (vistas) en un `div` con `flex justify-between items-center mb-6`.
   - **Detalle:** Ajustar `className` del `Input` a `max-w-xs` (o similar).

### 2. Crear Componente `EmptyState`
   - **Tarea:** Crear archivo `src/components/common/EmptyState.tsx`.
   - **Props:** `icon?` (ReactNode), `title` (string), `description?` (string), `action?` (ReactNode).
   - **Estilo Base:** `flex flex-col items-center text-center gap-4 py-16 px-4`. Usar `text-muted-foreground` y ajustar tamaño de icono/tipografía.

### 3. Integrar `EmptyState`
   - **Tarea:** En `RecipeListPage.tsx`, importar `EmptyState` y iconos (`ClipboardList`, `SearchX`).
   - **Reemplazar:** Sustituir los `div`s actuales para estados vacíos/sin resultados.
   - **Contenido:**
      - Si `recipes.length === 0`: Usar icono `ClipboardList`, título "Aún no has añadido ninguna receta", descripción "¡Empieza creando una!", y pasar `<Link to="/app/recipes/new"><Button>Añadir Receta</Button></Link>` como `action`.
      - Si `filteredRecipes.length === 0`: Usar icono `SearchX`, título y descripción condicionales basados en `activeView` y `searchTerm`.

## Refinamiento UI - PlanningPage

**Objetivo:** Aplicar un diseño visual más claro y atractivo a la página de planificación semanal, inspirado en los ejemplos proporcionados.

### 1. Layout General y Encabezado
   - **Tarea:** Asegurar que la página use el padding estándar del `AppLayout`.
   - **Tarea:** Implementar el encabezado de semana con título centrado y botones `ghost` para navegación.

### 2. Botón Placeholder IA
   - **Tarea:** Añadir botón "Generar Plan con IA" centrado debajo del encabezado (deshabilitado).

### 3. Estructura del Calendario
   - **Tarea:** Mantener el grid actual de 7 columnas (días).
   - **Tarea:** Dentro de cada celda de día, mostrar verticalmente las secciones de Desayuno, Almuerzo y Cena.

### 4. Celdas de Comida
   - **Tarea:** Dentro de cada sección de tipo de comida (Desayuno, etc.):
      - Si hay comidas planificadas, mostrarlas usando `Card` pequeñas (clase `p-1.5 text-xs`) con el nombre y un botón de eliminar (`Trash2`) que aparece al hacer hover (`group-hover:opacity-100`). La `Card` completa debe ser clickeable para editar (`onClick` llama a `handleOpenEditModal`).
      - Mostrar *siempre* un botón "+ Añadir" (estilo `outline` o `ghost`, tamaño pequeño `h-auto p-1 text-xs`) al final de la sección para abrir el modal (`onClick` llama a `handleOpenAddModal`).
   - **Estilo:** Ajustar padding y bordes internos de las celdas para claridad.