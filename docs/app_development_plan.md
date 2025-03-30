# Plan de Desarrollo Detallado de Aplicación

## 1. Resumen y Objetivos

**Aplicación:** Sistema de gestión de cocina (recetas, despensa, planificación de comidas).
**Objetivo Principal:** Establecer una base tecnológica sólida para la aplicación, priorizando una interfaz de usuario moderna, interactiva y con animaciones fluidas, seguida por la implementación de un backend robusto.

## 2. Stack Tecnológico Propuesto

### 2.1. Frontend
*   **Framework:** React (con Vite)
*   **Lenguaje:** TypeScript
*   **UI Kit:** Shadcn UI (sobre Radix UI y Tailwind CSS)
*   **Gestión de Estado:**
    *   **Estado Global UI:** Zustand (simple, minimalista)
    *   **Estado del Servidor:** TanStack Query (React Query v5) (cacheo, sincronización, mutaciones)
*   **Animaciones:** Framer Motion
*   **Routing:** React Router DOM
*   **Estilos:** Tailwind CSS
*   **Formularios:** React Hook Form (opcional, para formularios complejos)
*   **Linting/Formatting:** ESLint, Prettier

### 2.2. Backend
*   **Opción 1 (Recomendada para empezar):** Supabase (BaaS)
    *   **Base de Datos:** PostgreSQL (gestionada por Supabase)
    *   **Autenticación:** Supabase Auth
    *   **API:** API REST y/o GraphQL autogenerada por Supabase, Supabase Edge Functions (para lógica custom)
*   **Opción 2 (Mayor Control):** Backend Custom
    *   **Runtime:** Node.js
    *   **Framework:** Fastify (preferido por rendimiento) o Express
    *   **Lenguaje:** TypeScript
    *   **ORM:** Prisma (preferido por seguridad de tipos y migraciones) o TypeORM
    *   **Base de Datos:** PostgreSQL (auto-hosteada o servicio gestionado)
    *   **Autenticación:** JWT o manejo de sesiones

### 2.3. Base de Datos
*   **Tipo:** PostgreSQL

## 3. Arquitectura

### 3.1. Frontend
*   **Estructura:** Basada en Features/Módulos (`src/features/auth`, `src/features/pantry`, etc.).
*   **Componentes Reutilizables:** `src/components/ui` (generados por Shadcn), `src/components/common` (propios).
*   **Layout:** `src/components/layout` (`AppLayout`, `Sidebar`, etc.).
*   **Hooks:** `src/hooks` (hooks personalizados, ej: `useDebounce`).
*   **Servicios/API:** Dentro de cada feature o en `src/services`. Lógica de fetching encapsulada usando React Query.
*   **Estado Global:** Stores de Zustand para estado UI compartido (ej: tema, estado de sidebar).
*   **Tipos:** `src/types` o dentro de cada feature.

### 3.2. Backend (Opción Custom)
*   **Estructura:** Arquitectura en Capas o Hexagonal.
    *   **Controllers/Routes:** Manejan peticiones HTTP, validan entrada, llaman a servicios.
    *   **Services:** Contienen la lógica de negocio principal.
    *   **Repositories/DAL:** Encapsulan el acceso a la base de datos (usando el ORM).
*   **API:** RESTful siguiendo convenciones estándar. Documentación con OpenAPI/Swagger.

### 3.3. Comunicación
*   **Protocolo:** HTTPS.
*   **Formato:** JSON.
*   **API:** REST (preferido por simplicidad inicial) o GraphQL (si la complejidad de las queries lo justifica).

## 4. Fase 1: Desarrollo Frontend (UI y Lógica Base)

### 4.1. Setup del Proyecto
*   Confirmar/configurar Vite, TypeScript, Tailwind CSS, Shadcn UI.
*   Instalar dependencias: `react-router-dom`, `zustand`, `@tanstack/react-query`, `framer-motion`, `react-hook-form` (opcional), `axios` (opcional).
*   Configurar ESLint y Prettier.

### 4.2. Layout y Routing Base
*   Implementar `AppLayout` (con Sidebar/Navbar si aplica).
*   Configurar rutas principales usando React Router (`/`, `/login`, `/pantry`, `/recipes`, etc.).
*   Implementar `ProtectedRoute` para rutas que requieren autenticación.

### 4.3. Componentes UI Core y Estilo
*   Generar/personalizar componentes necesarios de Shadcn UI (Button, Input, Card, Dialog, Popover, Command, etc.).
*   Definir paleta de colores, tipografía y tema base en `tailwind.config.js` y `globals.css`.
*   Crear componentes comunes reutilizables (`EmptyState`, `Spinner`, etc.).

### 4.4. Gestión de Estado Inicial
*   Crear store de Zustand para estado global simple (ej: `useAuthStore` para info del usuario).
*   Configurar `QueryClientProvider` de React Query en el nivel raíz de la aplicación.

### 4.5. Implementación de Animaciones Base
*   **Transiciones de Página:**
    *   Envolver `Outlet` de React Router con `AnimatePresence` de Framer Motion.
    *   Aplicar variantes `initial`, `animate`, `exit` a las páginas/layouts para efectos de fade o slide.
    ```jsx
    // Ejemplo en AppLayout.tsx
    import { AnimatePresence, motion } from 'framer-motion';
    import { useLocation } from 'react-router-dom';

    // ...
    const location = useLocation();
    // ...
    <main>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname} // Clave única para detectar cambio de ruta
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </main>
    ```
*   **Microinteracciones (Botones/Inputs):**
    *   Usar props `whileHover` y `whileTap` de `motion.button` o `motion.div`.
    *   Ejemplo: `whileHover={{ scale: 1.05 }}` `whileTap={{ scale: 0.95 }}`.
    *   Utilizar transiciones CSS de Tailwind para efectos hover en elementos no animados con Framer Motion.
*   **Indicadores de Carga:**
    *   Usar componente `Spinner`.
    *   Para Skeletons: divs con `animate-pulse` de Tailwind o animaciones personalizadas con Framer Motion.
*   **Aparición de Elementos (Listas, Modales):**
    *   Envolver elementos dinámicos (ej: items de lista, contenido de modal) con `motion.div` y definir `initial`, `animate`, `exit`.
    *   Usar `AnimatePresence` si los elementos se añaden/eliminan de una lista.
    *   Utilizar `staggerChildren` en el contenedor padre para animar listas de forma escalonada.
    ```jsx
    // Ejemplo en Lista
    const listVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 } // Animar hijos con retraso
      }
    };
    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    };
    // ...
    <motion.ul variants={listVariants} initial="hidden" animate="visible">
      {items.map(item => (
        <motion.li key={item.id} variants={itemVariants}>
          {/* Contenido del item */}
        </motion.li>
      ))}
    </motion.ul>
    ```

## 5. Fase 2: Desarrollo Backend (API y Base de Datos)

### 5.1. Modelo de Datos Detallado
*   Definir tablas y relaciones en PostgreSQL (Usuarios, Ingredientes, Items Despensa, Recetas, Pasos Receta, Ingredientes Receta, Planes Comida, etc.).
*   Establecer claves primarias, foráneas, índices y constraints.

### 5.2. Setup Backend
*   **Supabase:**
    *   Crear tablas usando el editor SQL o la UI.
    *   Configurar relaciones (Foreign Keys).
    *   Habilitar RLS y definir políticas de seguridad para cada tabla.
    *   Configurar Supabase Auth (providers, email templates).
    *   Crear Edge Functions si se necesita lógica compleja que no exponga secretos.
*   **Custom:**
    *   Inicializar proyecto Node.js/TypeScript.
    *   Instalar Fastify/Express, Prisma, `pg` (driver de Postgres).
    *   Configurar Prisma (`schema.prisma`, generar cliente, ejecutar migraciones).
    *   Estructurar carpetas (routes, services, repositories, utils, config).
    *   Implementar middleware para CORS, logging, manejo de errores.

### 5.3. Implementación API RESTful
*   Crear endpoints CRUD para cada recurso principal (ej: `/api/pantry-items`, `/api/recipes`).
*   Validar datos de entrada (ej: usando Zod).
*   Implementar lógica de negocio en los servicios (ej: calcular stock, validar datos).
*   Interactuar con la base de datos a través del ORM (Prisma) en los repositorios.
*   Devolver respuestas JSON consistentes con códigos de estado HTTP apropiados.

### 5.4. Autenticación y Autorización
*   **Supabase:** Utilizar `supabase.auth.signUp`, `signInWithPassword`, `getUser`, etc. RLS maneja la autorización a nivel de base de datos.
*   **Custom:** Implementar endpoints de registro/login. Generar JWTs al hacer login. Validar JWTs en middleware para proteger rutas. Implementar lógica de autorización en servicios o middleware.

## 6. Fase 3: Integración Frontend-Backend

### 6.1. Lógica de Fetching con React Query
*   Crear hooks personalizados que encapsulen las queries y mutaciones de React Query (ej: `usePantryItems`, `useAddPantryItem`).
*   Usar `queryKey` para identificar los datos.
*   Implementar `queryFn` (llamando a las funciones del servicio frontend que usan `axios` o `fetch` para hablar con la API).
*   Implementar `mutationFn` para operaciones CUD.
*   Configurar `staleTime` y `cacheTime` apropiados.

### 6.2. Conexión UI con Datos
*   Usar los hooks de React Query en los componentes para obtener datos y estados de carga/error.
*   Llamar a las funciones de mutación (ej: `addPantryItemMutation.mutate(...)`) al enviar formularios o realizar acciones.

### 6.3. Actualizaciones Optimistas y Animaciones
*   Para operaciones rápidas (ej: marcar como comprado, eliminar, ajustar cantidad), considerar **actualizaciones optimistas** con React Query:
    *   Actualizar el estado local inmediatamente.
    *   Realizar la mutación en segundo plano.
    *   Revertir el estado local si la mutación falla.
    *   Invalidar la query para re-sincronizar.
*   Usar `AnimatePresence` para animar la eliminación de ítems de listas.
*   Mostrar feedback visual animado (ej: un toast, un cambio de estado temporal) al completar mutaciones.

## 7. Consideraciones Adicionales

*   **Testing:**
    *   **Unit Tests (Vitest):** Para funciones utilitarias, parsers, lógica de estado simple.
    *   **Integration Tests (Vitest + React Testing Library):** Para componentes y hooks, simulando interacciones y llamadas API (usando MSW - Mock Service Worker).
    *   **E2E Tests (Playwright/Cypress):** Para flujos críticos de usuario a través de la aplicación completa.
*   **Performance:**
    *   **Bundling:** Analizar tamaño del bundle (ej: `vite-plugin-visualizer`).
    *   **Lazy Loading:** Cargar rutas y componentes pesados de forma diferida (`React.lazy`).
    *   **Memoización:** Usar `React.memo`, `useMemo`, `useCallback` para evitar re-renders innecesarios.
    *   **Optimización de Imágenes:** Usar formatos modernos (WebP, AVIF), tamaños adecuados, carga diferida.
    *   **Backend:** Optimizar queries SQL, añadir índices, considerar caching (Redis).
*   **Accesibilidad (A11y):**
    *   Usar HTML semántico.
    *   Asegurar contraste de color adecuado.
    *   Proveer alternativas de texto para imágenes.
    *   Gestionar foco correctamente, especialmente en modales y elementos interactivos.
    *   Testear con lectores de pantalla y navegación por teclado.
*   **Despliegue y CI/CD:**
    *   **Frontend:** Vercel o Netlify (integración fácil con Git, previews de despliegue).
    *   **Backend Custom:** Fly.io, Render, Railway (buenas opciones con planes gratuitos/económicos).
    *   **Base de Datos:** Supabase (incluida) o servicio gestionado (Neon, Aiven).
    *   **CI/CD:** GitHub Actions para automatizar builds, tests y despliegues en cada push/merge.

Este plan proporciona una hoja de ruta detallada. Podemos ajustarlo y priorizar secciones según tus necesidades específicas para la aplicación.