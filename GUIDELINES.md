# Guías de Código y Convenciones para "A comerla"

Este documento describe las convenciones de código, patrones de diseño y buenas prácticas específicas adoptadas en el proyecto "A comerla". El objetivo es mantener la consistencia, legibilidad y mantenibilidad del código.

*(Este documento se irá completando a medida que avance el desarrollo).*

## 1. Nomenclatura

*   **Componentes React:** PascalCase (ej. `PantryItem`, `RecipeCard`). Nombrar archivos `.tsx` igual que el componente principal que exportan.
*   **Hooks React:** camelCase, prefijo `use` (ej. `usePantryItems`, `useFormInput`).
*   **Variables y Funciones:** camelCase (ej. `itemName`, `calculateTotal`).
*   **Constantes:** UPPER_SNAKE_CASE (ej. `MAX_ITEMS`, `API_ENDPOINT`).
*   **Tipos e Interfaces TypeScript:** PascalCase (ej. `Recipe`, `PantryItemProps`).
*   **Funciones Supabase (si se crean):** snake_case (siguiendo convenciones SQL/Postgres).

## 2. Estructura de Carpetas (Propuesta Inicial)

```
/src
|-- /assets         # Imágenes, fuentes, etc.
|-- /components     # Componentes UI reutilizables (genéricos)
|   |-- /ui         # Componentes Shadcn/UI (si se personalizan o envuelven)
|   |-- /common     # Componentes comunes propios (botones, inputs, etc.)
|-- /features       # Módulos funcionales principales
|   |-- /auth
|   |-- /pantry
|   |-- /recipes
|   |-- /planning
|   |-- /shopping-list
|   |-- ... (cada feature con sus componentes, hooks, utils, etc.)
|-- /hooks          # Hooks globales o compartidos entre features
|-- /lib            # Funciones de utilidad generales, cliente Supabase
|-- /pages          # Componentes que representan rutas/páginas completas (si aplica)
|-- /providers      # Context Providers de React
|-- /routes         # Configuración de rutas (si se usa react-router-dom)
|-- /services       # Lógica de interacción con APIs (Supabase)
|-- /store          # Estado global (si se usa Zustand, Redux, etc.)
|-- /styles         # Estilos globales, configuración Tailwind
|-- /types          # Definiciones de tipos globales/compartidos
|-- App.tsx         # Componente raíz de la aplicación
|-- main.tsx        # Punto de entrada de la aplicación
```
*(Esta estructura puede evolucionar).*

## 3. Gestión del Estado

*   **Estado Local:** Usar `useState` para estado simple dentro de componentes.
*   **Estado Complejo Local:** Considerar `useReducer` si la lógica de estado es compleja.
*   **Estado Global:** Evaluar necesidad. Si es necesario, considerar Zustand o React Context API para casos simples. Evitar prop drilling excesivo.

## 4. Interacción con Supabase

*   Centralizar la configuración del cliente Supabase en `/lib/supabaseClient.ts`.
*   Crear funciones específicas en `/services` para interactuar con las tablas/API de Supabase (ej. `getPantryItems()`, `addRecipe()`). No llamar directamente a `supabase.from(...)` desde los componentes UI.
*   Manejar errores de las llamadas a Supabase adecuadamente (try/catch, mostrar feedback al usuario).

## 5. Estilo y Formato

*   Seguir las reglas definidas en la configuración de ESLint y Prettier.
*   Utilizar clases de Tailwind CSS para estilizar. Evitar CSS en línea o archivos CSS separados excepto para estilos muy globales o complejos.
*   Mantener componentes pequeños y enfocados en una sola responsabilidad.

## 6. Comentarios

*   Comentar código complejo o lógica no obvia.
*   Utilizar JSDoc para describir props de componentes, tipos y funciones importantes.

## 7. Documentación del Proyecto

*   La visión estratégica general del producto se encuentra en `PRODUCT_VISION.md`.
*   Las decisiones de diseño y requisitos para funcionalidades específicas se documentan en Project Design Records (PDRs) dentro del directorio `docs/pdr/` (crear este directorio si aún no existe).
*   Consulta `CONTRIBUTING.md` para más detalles sobre el proceso de diseño y desarrollo.

*(Se añadirán más guías según sea necesario).*