# Documentación Funcional: Aplicación "A Comerla"

Este documento describe las funcionalidades clave implementadas en la aplicación "A Comerla" y los archivos principales asociados a cada una. Sirve como referencia técnica y para prevenir regresiones.

## 1. Autenticación (`auth`)

*   **Descripción:** Maneja el inicio de sesión (Login) y registro (Signup) de usuarios utilizando Supabase Auth. Proporciona un contexto (`AuthContext`) para gestionar el estado de autenticación (usuario, sesión, carga) y las funciones relacionadas (login, signup, logout) en toda la aplicación. Protege rutas que requieren autenticación.
*   **Archivos Clave:**
    *   `src/features/auth/Login.tsx`: Componente de formulario para inicio de sesión.
    *   `src/features/auth/Signup.tsx`: Componente de formulario para registro de nuevos usuarios.
    *   `src/features/auth/AuthContext.tsx`: Contexto React que utiliza `supabase.auth` para proveer estado y funciones de autenticación.
    *   `src/lib/supabaseClient.ts`: Cliente de Supabase configurado.
    *   `src/components/ProtectedRoute.tsx`: Componente HOC o wrapper para proteger rutas que requieren un usuario autenticado.
    *   `src/App.tsx`: Probablemente configura el `AuthProvider` y las rutas públicas/privadas.

## 2. Dashboard (`dashboard`)

*   **Descripción:** Página principal después del login. Muestra un resumen de información relevante de otras secciones a través de widgets y ofrece una sugerencia de receta diaria ("¿Qué cocino hoy?") generada por IA.
*   **Archivos Clave:**
    *   `src/features/dashboard/DashboardPage.tsx`: Componente principal de la página. Orquesta la carga de datos de diferentes stores/servicios y renderiza los widgets.
    *   **Widgets (en `src/features/dashboard/components/`):**
        *   `TodayPlanWidget.tsx`: Muestra las comidas planificadas para el día actual. (Depende de `planningService`).
        *   `ShoppingListWidget.tsx`: Muestra un resumen de la lista de compras. (Depende de `shoppingListStore`).
        *   `FavoriteRecipesWidget.tsx`: Muestra recetas favoritas (actualmente con datos placeholder). (Dependería de `recipeStore` o servicio de recetas).
        *   `LowStockWidget.tsx`: Muestra ítems con bajo stock en la despensa (funcionalidad pendiente). (Depende de `pantryStore`).
    *   **Servicios Relacionados:**
        *   `src/features/planning/planningService.ts`: (`getPlannedMeals`)
        *   `src/features/recipes/generationService.ts`: (`generateSingleRecipe`)
    *   **Stores Relacionados:**
        *   `src/stores/pantryStore.ts`
        *   `src/stores/shoppingListStore.ts`
        *   `src/stores/recipeStore.ts` (Potencialmente)
    *   **Contexto:** `src/features/auth/AuthContext.tsx` (para obtener `user` y `profile`).
    *   **Animaciones:** `framer-motion` (para animar la carga de la página y widgets).

## 3. Ingredientes (`ingredients`)

*   **Descripción:** Funcionalidad de backend/servicio para gestionar la tabla maestra de ingredientes. No posee UI propia. Se encarga de normalizar nombres (singular/plural, capitalización) y asegurar que cada ingrediente exista una única vez en la base de datos (`findOrCreateIngredient`). Es utilizado por otras features (Despensa, Recetas) al añadir nuevos elementos.
*   **Archivos Clave:**
    *   `src/features/ingredients/ingredientService.ts`: Contiene la lógica de normalización (`normalizeIngredientName`), búsqueda (`searchIngredients`, `findIngredientByExactName`) y creación (`createIngredient`, `findOrCreateIngredient`).
    *   `src/types/ingredientTypes.ts`: (Asumiendo que existe o se moverá desde `pantry/types.ts`).
    *   **Tabla BD:** `ingredients`

## 4. Despensa (`pantry`)

*   **Descripción:** Permite a los usuarios gestionar los ítems que tienen en su despensa. Incluye añadir, editar, eliminar ítems, agruparlos por categorías colapsables, marcarlos como favoritos, filtrarlos y buscarlos. También ofrece una vista rápida de favoritos y la opción de vaciar toda la despensa.
*   **Archivos Clave:**
    *   **Página Principal:** `src/features/pantry/PantryPage.tsx`
    *   **Servicios:** `src/features/pantry/pantryService.ts` (interacción con Supabase: get, add, update, delete, toggleFavorite, clear)
    *   **Estado Global:** `src/stores/pantryStore.ts` (Zustand: maneja items, carga, errores, acciones)
    *   **Tipos:** `src/features/pantry/types.ts` (interfaces `PantryItem`, `Category`, etc.)
    *   **Migraciones BD:** `supabase/migrations/` (ej: `020_add_pantry_item_favorite_flag.sql`)
    *   **Componentes UI:**
        *   `src/features/pantry/components/PantryItemsView.tsx` (Vista principal con acordeón)
        *   `src/features/pantry/components/PantryGrid.tsx` (Vista de cuadrícula)
        *   `src/features/pantry/PantryList.tsx` (Vista de lista)
        *   `src/features/pantry/components/PantryItemCard.tsx` (Tarjeta de ítem - Grid)
        *   `src/features/pantry/components/PantryListItemRow.tsx` (Fila de ítem - Lista)
        *   `src/features/pantry/components/UnifiedPantryInput.tsx` (Input rápido para añadir)
        *   `src/features/pantry/components/PantryFiltersSection.tsx` (Sección de filtros y búsqueda)
        *   `src/features/pantry/components/FavoriteTags.tsx` (Tags de favoritos)
        *   `src/features/pantry/components/CategorySelect.tsx` (Selector de categorías)
        *   `src/features/pantry/components/ClearPantryDialog.tsx` (Diálogo para vaciar despensa)
        *   `src/features/pantry/components/FavoriteItemsSheet.tsx` (Panel lateral de favoritos)
    *   **Layout (Integración Favoritos):**
        *   `src/components/layout/Sidebar.tsx` (Botón para abrir sheet)
        *   `src/components/layout/AppLayout.tsx` (Manejo de estado del sheet)

## 5. Planificación (`planning`)

*   **Descripción:** Permite a los usuarios planificar sus comidas (desayuno, almuerzo, merienda, cena) para cada día en una vista semanal (escritorio) o diaria (móvil). Se pueden añadir comidas personalizadas o (futuro) vincular recetas. Incluye una función de "Autocompletar Semana" basada en IA para sugerir cenas.
*   **Archivos Clave:**
    *   `src/features/planning/PlanningPage.tsx`: Componente principal, maneja la lógica de navegación semanal/diaria, carga de datos, estado del modal y la función de autocompletar.
    *   `src/features/planning/planningService.ts`: Contiene funciones para interactuar con Supabase (`getPlannedMeals`, `upsertPlannedMeal`, `deletePlannedMeal`).
    *   `src/features/planning/types.ts`: Define las interfaces (`PlannedMeal`, `MealType`, etc.).
    *   **Componentes UI (en `src/features/planning/components/`):**
        *   `MealFormModal.tsx`: Modal para añadir/editar comidas planificadas.
        *   `WeekDaySelector.tsx`: Selector de días para la vista móvil.
        *   `PlanningDayView.tsx`: Vista detallada de las comidas de un día (móvil).
        *   `MealCard.tsx`: Tarjeta que representa un slot de comida (ej: Cena del Lunes) en la vista semanal de escritorio.
    *   **Servicios Relacionados:**
        *   `src/features/recipes/generationService.ts`: (`generateRecipesFromPantry` para autocompletar).
        *   `src/features/suggestions/suggestionService.ts`: (`getMealAlternatives`, placeholder).
    *   **Contexto:** `src/features/auth/AuthContext.tsx` (para `user`).
    *   **Utilidades:** `date-fns` (para manejo de fechas).

## 6. Recetas (`recipes`)

*   **Descripción:** Permite a los usuarios ver, crear, editar y eliminar sus recetas. Incluye una vista de lista/cuadrícula, una vista de detalle y un formulario de edición/creación. Ofrece la posibilidad de generar recetas automáticamente usando IA (Google Gemini) basado en una descripción y/o los ingredientes disponibles en la despensa. También permite marcar recetas como favoritas.
*   **Archivos Clave:**
    *   **Páginas (en `src/features/recipes/pages/`):**
        *   `RecipeListPage.tsx`: Muestra la lista de recetas, permite filtrar por favoritas, iniciar la generación IA y navegar a la creación manual.
        *   `RecipeDetailPage.tsx`: Muestra los detalles de una receta (ingredientes, instrucciones, etc.).
        *   `AddEditRecipePage.tsx`: Formulario para crear o editar recetas manualmente (puede pre-rellenarse con datos de la generación IA).
    *   **Componentes UI (en `src/features/recipes/components/`):**
        *   `RecipeCard.tsx`: Tarjeta para mostrar un resumen de la receta en la lista.
        *   (Posiblemente otros componentes para el formulario o detalles).
    *   **Servicios (en `src/features/recipes/services/`):**
        *   (Probablemente `recipeService.ts`): Funciones CRUD para interactuar con la tabla `recipes` de Supabase (get, add, update, delete, toggleFavorite).
    *   **Generación IA:**
        *   `src/features/recipes/generationService.ts`: Contiene `generateSingleRecipe` y `generateRecipesFromPantry` que interactúan con la API de Gemini.
        *   `RecipeListPage.tsx`: Contiene la lógica para construir el prompt (`buildRecipePrompt`), llamar a la API y procesar la respuesta (`extractAndParseRecipe`).
    *   **Estado Global:** `src/stores/recipeStore.ts`: (Zustand) Maneja la lista de recetas, estado de carga, errores y acciones CRUD + toggleFavorite.
    *   **Tipos:** `src/types/recipeTypes.ts` (Define `Recipe`, `GeneratedRecipeData`, etc.).
    *   **Contexto:** `src/features/auth/AuthContext.tsx` (para `user` y `profile` -> API Key/Preferencias).
    *   **Servicios Relacionados:** `src/features/pantry/pantryService.ts` (para obtener ingredientes al generar con IA).

## 7. Lista de Compras (`shopping-list`)

*   **Descripción:** Permite generar una lista de compras basada en el plan semanal y el estado de la despensa. Muestra los ítems necesarios, permite marcarlos como comprados y busca precios en servicios externos (BuscaPrecios, Precios Claros). Integra un mapa para visualizar tiendas cercanas y marcar favoritas. El layout se adapta a diferentes tamaños de pantalla.
*   **Archivos Clave:**
    *   `src/features/shopping-list/ShoppingListPage.tsx`: Componente principal, integra todas las sub-funcionalidades (generación, lista, búsqueda de precios, mapa).
    *   `src/features/shopping-list/shoppingListService.ts`: Contiene la lógica principal para generar la lista (`generateShoppingList`).
    *   `src/features/shopping-list/types.ts`: Define la interfaz `ShoppingListItem`.
    *   **Componentes UI (en `src/features/shopping-list/components/`):**
        *   `AddItemForm.tsx`: Formulario para añadir ítems manualmente a la lista.
        *   `PriceResultsDisplay.tsx`: Muestra los resultados de la búsqueda de precios.
        *   `SearchPanel/SearchPanel.tsx`: Panel para iniciar la búsqueda de precios (posiblemente también para añadir ítems).
        *   `Map/ShoppingMap.tsx`: Componente de mapa interactivo (probablemente Leaflet) para mostrar tiendas.
        *   `Map/FavoriteStoresInfo.tsx`: Muestra información resumida de tiendas favoritas.
        *   `Layout/DesktopLayout.tsx`, `TabletLayout.tsx`, `MobileLayout.tsx`: Componentes para adaptar la disposición de los elementos según el breakpoint.
    *   **Servicios Externos (en `src/features/shopping-list/services/`):**
        *   `buscaPreciosService.ts`: Interactúa con la API de BuscaPrecios.
        *   `preciosClarosService.ts`: Interactúa con la API de Precios Claros.
    *   **Estado Global:** `src/stores/shoppingListStore.ts`: (Zustand) Maneja el estado de los ítems de la lista.
    *   **Hooks:** `src/features/shopping-list/hooks/` (Posiblemente hooks personalizados para mapa o servicios).
    *   **Utilidades:** `src/features/shopping-list/lib/` (Posiblemente funciones auxiliares).

## 8. Sugerencias (`suggestions`)

*   **Descripción:** Servicio backend que utiliza la API de Google Gemini para generar sugerencias contextuales, principalmente alternativas de comidas para la sección de Planificación.
*   **Archivos Clave:**
    *   `src/features/suggestions/suggestionService.ts`: Contiene la función `getMealAlternatives` que construye el prompt (considerando preferencias del usuario) y llama a la API de Gemini.
    *   `src/features/planning/types.ts`: Define los tipos relacionados (`MealAlternativeRequestContext`, `MealAlternative`).
    *   `src/features/user/userTypes.ts`: Define `UserProfile` (usado para obtener preferencias).
    *   **Dependencias:** `@google/generative-ai`.

## 9. Perfil de Usuario (`user`)

*   **Descripción:** Permite al usuario ver y editar la información de su perfil, incluyendo nombre de usuario, avatar, preferencias dietéticas, alergias, dificultad preferida para cocinar, tiempo máximo de preparación, ingredientes excluidos, equipamiento disponible y su clave API de Google Gemini.
*   **Archivos Clave:**
    *   `src/features/user/UserProfilePage.tsx`: Componente principal de la página, muestra la información y coordina las actualizaciones.
    *   `src/features/user/userService.ts`: Contiene las funciones `getUserProfile` y `updateUserProfile` para interactuar con la tabla `profiles` de Supabase.
    *   `src/features/user/userTypes.ts`: Define la interfaz `UserProfile` y los enums/tipos relacionados (ej: `DietaryPreference`).
    *   **Componentes UI (en `src/features/user/components/`):**
        *   `AvatarUpload.tsx`: Gestiona la subida y actualización del avatar.
        *   `DietaryPreferences.tsx`: Componente para seleccionar la preferencia dietética.
        *   `DifficultyPreference.tsx`: Componente para seleccionar la dificultad.
        *   `TimePreference.tsx`: Componente para establecer el tiempo máximo de preparación.
        *   `AllergiesInput.tsx`: Campo de texto para alergias/restricciones.
        *   `TagsInput.tsx`: Componente para gestionar la lista de ingredientes excluidos.
        *   `EquipmentCheckboxes.tsx`: Checkboxes para seleccionar el equipamiento disponible.
    *   **Contexto:** `src/features/auth/AuthContext.tsx` (para obtener `user`).
    *   **Tabla BD:** `profiles`

---
*Documento finalizado.*