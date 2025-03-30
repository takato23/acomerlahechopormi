# Diseño: Sistema de Categorización Inteligente por Keywords

## 1. Objetivo

Implementar un sistema que asigne automáticamente una categoría probable a los ítems añadidos a la lista de compras, basándose en palabras clave (keywords) presentes en el nombre del ítem. Esto mejorará la organización de la lista y reducirá la necesidad de categorización manual por parte del usuario.

## 2. Arquitectura Propuesta

```mermaid
graph TD
    A[Input Usuario (SmartInput)] --> B{Parse Input};
    B --> C[Nombre Limpio];
    C --> D[Función inferCategory];
    D --> E{Buscar Keywords};
    E --> F[Base de Conocimiento (DB/JSON)];
    F --> E;
    E --> G{Calcular Score/Prioridad};
    G -- Empate --> H[Devolver Null (Sin Categoría)];
    G -- Score > Umbral --> I[Categoría Inferida];
    I --> K[Asignar Categoría al Ítem];
    H --> L[Marcar como "Sin Categoría"];
    K --> M[Guardar Ítem];
    L --> M;
    N[ShoppingListPage] --> A;
    N --> K;
    N --> L;
    O[Usuario Corrige Categoría] --> P{Registrar Corrección};
    P --> Q[Tabla user_category_corrections];
```

## 3. Estructura de Datos

Se propone utilizar tablas en Supabase para mayor flexibilidad y facilidad de actualización.

### 3.1 Tabla `categories` (Ya existente)
*   `id` (uuid, PK)
*   `name` (text, unique)
*   `order` (integer)
*   `icon` (text, nullable)
*   `color` (text, nullable)
*   `is_default` (boolean)

### 3.2 Nueva Tabla `category_keywords`
*   `id` (uuid, PK, default: `gen_random_uuid()`)
*   `category_id` (uuid, FK references `categories.id` ON DELETE CASCADE)
*   `keyword` (text, not null) - Almacenar en minúsculas y sin acentos/plurales si se aplica normalización.
*   `priority` (integer, default: 0) - Mayor prioridad indica más peso en el score y desempate.
*   `created_at` (timestamptz, default: `now()`)

**Índices:**
*   Índice en `category_id`.
*   Índice en `keyword` (`text_pattern_ops` si se usa `LIKE`, o índice GIN/GIST si se usa full-text search).
*   Índice compuesto `(keyword, priority DESC)`.

**Restricción:** `UNIQUE (category_id, keyword)` para evitar duplicados.

### 3.3 Nueva Tabla `user_category_corrections` (Para Aprendizaje Futuro)
*   `id` (uuid, PK, default: `gen_random_uuid()`)
*   `user_id` (uuid, FK references `auth.users(id)` ON DELETE CASCADE)
*   `item_name` (text, not null) - Nombre original del ítem ingresado.
*   `original_category_id` (uuid, FK references `categories.id` ON DELETE SET NULL, nullable) - Categoría inferida (o null si no se infirió).
*   `corrected_category_id` (uuid, FK references `categories.id` ON DELETE CASCADE, not null) - Categoría seleccionada por el usuario.
*   `timestamp` (timestamptz, default: `now()`)

**Índices:**
*   Índice en `user_id`.
*   Índice en `item_name` (posiblemente `text_pattern_ops`).
*   Índice en `corrected_category_id`.

## 4. Base de Conocimiento Inicial (Ejemplos)

Se poblará la tabla `category_keywords` con keywords en minúsculas. Se incluirán plurales y sinónimos comunes como entradas separadas apuntando a la misma categoría.

| category_id (Nombre) | keyword         | priority |
|----------------------|-----------------|----------|
| Lácteos/Huevos       | leche           | 1        |
| Lácteos/Huevos       | leches          | 1        |
| Lácteos/Huevos       | queso           | 1        |
| Lácteos/Huevos       | quesos          | 1        |
| Lácteos/Huevos       | yogur           | 1        |
| Lácteos/Huevos       | yogures         | 1        |
| Lácteos/Huevos       | manteca         | 1        |
| Lácteos/Huevos       | crema           | 1        |
| Lácteos/Huevos       | huevo           | 2        |
| Lácteos/Huevos       | huevos          | 2        |
| Bebidas              | agua            | 1        |
| Bebidas              | aguas           | 1        |
| Bebidas              | gaseosa         | 1        |
| Bebidas              | gaseosas        | 1        |
| Bebidas              | jugo            | 1        |
| Bebidas              | jugos           | 1        |
| Bebidas              | coca            | 2        |
| Bebidas              | sprite          | 2        |
| Bebidas              | cerveza         | 1        |
| Bebidas              | cervezas        | 1        |
| Carnes               | pollo           | 1        |
| Carnes               | pollos          | 1        |
| Carnes               | suprema         | 1        | <!-- Sinónimo -->
| Carnes               | supremas        | 1        |
| Carnes               | carne           | 1        |
| Carnes               | carnes          | 1        |
| Carnes               | vacuna          | 1        | <!-- Sinónimo -->
| Carnes               | bife            | 1        |
| Carnes               | picada          | 1        |
| Carnes               | milanesa        | 1        |
| Carnes               | milanesas       | 1        |
| Carnes               | pescado         | 1        |
| Carnes               | merluza         | 2        |
| Congelados           | patita          | 3        | <!-- Singular -->
| Congelados           | patitas         | 3        | <!-- Plural, Mayor prioridad -->
| Congelados           | medallon        | 2        |
| Congelados           | medallones      | 2        |
| Congelados           | helado          | 1        |
| Congelados           | pizza           | 1        |
| ...                  | ...             | ...      |

*Nota: Esta lista es inicial y debe expandirse considerablemente.*

## 5. Lógica de Inferencia (`inferCategory`)

```typescript
// Ubicación: src/features/shopping-list/lib/categoryInference.ts

interface KeywordMatch {
  categoryId: string;
  priority: number;
}

// Cargar keywords (idealmente desde un caché o estado global)
// async function loadKeywords(): Promise<Map<string, KeywordMatch[]>> { ... }

async function inferCategory(itemName: string): Promise<string | null> {
  if (!itemName) return null;

  // 1. Limpiar nombre: minúsculas, quitar acentos (opcional), quitar plurals simples (opcional)
  const cleanedName = itemName.toLowerCase()
                           // .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                           // Quitar 's' o 'es' final simple (mejorar con stemming si es necesario)
                           .replace(/(es|s)$/, ''); 

  // 2. Tokenizar: Separar en palabras
  const words = cleanedName.split(/\s+/).filter(Boolean); // Filtrar vacíos

  // 3. Cargar/Obtener Keywords (desde caché/estado global/DB)
  // const keywordMap = await loadKeywords(); // Map<keyword, {categoryId, priority}[]>
  const keywordMap = getKeywordsFromSomewhere(); // Asumir que tenemos las keywords

  // 4. Buscar coincidencias y calcular score por categoría
  const categoryScores = new Map<string, { score: number; maxPriority: number }>();

  for (const word of words) {
    if (keywordMap.has(word)) {
      const matches = keywordMap.get(word)!;
      for (const match of matches) {
        const current = categoryScores.get(match.categoryId) || { score: 0, maxPriority: -1 };
        current.score += (match.priority + 1); // Score acumulado
        current.maxPriority = Math.max(current.maxPriority, match.priority); // Guardar prioridad máxima
        categoryScores.set(match.categoryId, current);
      }
    }
  }

  // 5. Encontrar la(s) categoría(s) con el mayor score
  let bestCategoryId: string | null = null;
  let maxScore = 0;
  let maxPriorityInBest = -1;
  let tie = false;

  for (const [categoryId, scores] of categoryScores.entries()) {
    if (scores.score > maxScore) {
      maxScore = scores.score;
      bestCategoryId = categoryId;
      maxPriorityInBest = scores.maxPriority;
      tie = false;
    } else if (scores.score === maxScore && maxScore > 0) {
      // Empate: desempatar por prioridad máxima de keywords coincidentes
      if (scores.maxPriority > maxPriorityInBest) {
        bestCategoryId = categoryId;
        maxPriorityInBest = scores.maxPriority;
        tie = false; // Se resolvió el empate por prioridad
      } else if (scores.maxPriority === maxPriorityInBest) {
        tie = true; // Empate persiste incluso con prioridad
      }
    }
  }

  // 6. Devolver resultado
  const MIN_SCORE_THRESHOLD = 1; // Necesita al menos una keyword con prioridad 0 o más
  if (!tie && bestCategoryId && maxScore >= MIN_SCORE_THRESHOLD) {
    return bestCategoryId;
  }

  return null; // No se encontró categoría o hubo empate irresoluble
}
```

## 6. Integración

*   **`ShoppingListPage.tsx` -> `handleAddItem`:**
    *   Después de parsear el input (`parseShoppingInput`).
    *   Si `newItemCategoryId` es `null`:
        *   `const inferredCategoryId = await inferCategory(parsed.name);`
        *   Si `inferredCategoryId` no es `null`, usarlo en `itemData`.
*   **`ShoppingListPage.tsx` -> `handleSuggestionSelected`:**
    *   Si `suggestion.category` es `null` o `undefined`:
        *   `const inferredCategoryId = await inferCategory(parsed.name);`
        *   Si `inferredCategoryId` no es `null`, usarlo para `setNewItemCategoryId`.
*   **UI de Corrección:** Añadir un botón/menú en cada ítem de la lista que permita al usuario cambiar la categoría. Al cambiarla, registrar la corrección en la tabla `user_category_corrections`.

## 7. Manejo de Casos Borde

*   **Ítems Desconocidos:** `inferCategory` devolverá `null`. El ítem se guardará sin categoría o con una categoría por defecto ("Otros"). La UI debe facilitar la asignación manual.
*   **Ambigüedad (Empate Irresoluble):** `inferCategory` devolverá `null`.

## 8. UI de Administración de Keywords (Diseño Básico)

*   **Ruta:** `/admin/keywords` (protegida).
*   **Componentes:**
    *   Selector/Lista de Categorías.
    *   Tabla de Keywords para la categoría seleccionada (Columnas: Keyword, Prioridad, Acciones).
    *   Formulario para añadir nueva keyword (Input Keyword, Input Prioridad, Botón Añadir).
    *   Dialog/Modal para editar/eliminar keywords.
*   **Lógica:** Fetch de categorías y keywords desde Supabase. Operaciones CRUD en la tabla `category_keywords`.

## 9. Consideraciones

*   **Performance:** Cargar y buscar en las keywords debe ser eficiente. El caché es importante. Considerar índices adecuados en la DB.
*   **Mantenimiento:** La UI de administración es clave para mantener la base de conocimiento actualizada.
*   **Precisión:** Mejorará con una base de keywords más completa y con el aprendizaje futuro.
*   **Normalización de Texto:** Decidir el nivel de normalización (acentos, plurales) a aplicar consistentemente al guardar keywords y al limpiar el input del usuario.

## 10. Mejoras Futuras

*   **Aprendizaje Automático:** Implementar el proceso batch que analiza `user_category_corrections` para sugerir/añadir keywords o ajustar prioridades.
*   **Procesamiento de Lenguaje Natural (NLP):** Usar stemming/lemmatization para mejorar la coincidencia de keywords.
*   **Feedback Activo:** Preguntar explícitamente al usuario la categoría para ítems no reconocidos.

Este diseño actualizado incorpora las soluciones a tus preguntas, haciendo el sistema más robusto y preparado para futuras mejoras.