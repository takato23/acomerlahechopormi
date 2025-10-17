# A comerla - Tu Asistente Inteligente de Planificación de Comidas

🍳🥗🌙 ¡Organiza tus comidas, simplifica tus compras y disfruta más cocinando!

"A comerla" es una aplicación web diseñada para ayudarte a planificar tus comidas semanales de forma fácil e intuitiva, gestionar tus recetas favoritas, controlar tu despensa y generar listas de compras inteligentes.

**Estado actual:** MVP avanzado - 8/9 módulos core implementados  
**Próximo hito:** Beta privada (3 meses)

## ✨ Características Principales

### ✅ Implementadas

*   **Planificador Semanal Visual:** Organiza desayunos, almuerzos y cenas con drag & drop
*   **Gestión de Recetas:** Crea, edita y organiza tus recetas. Generación con IA (Google Gemini)
*   **Gestión de Despensa:** Control completo de inventario con categorías, favoritos y búsqueda
*   **Lista de Compras Inteligente:** Generación automática con integración de precios (BuscaPrecios, Precios Claros)
*   **Perfil de Usuario:** Preferencias dietéticas, alergias, equipamiento
*   **Sugerencias IA:** Recetas personalizadas basadas en tu despensa y preferencias
*   **Análisis Nutricional:** Tracking de calorías y macronutrientes
*   **Sistema de Plantillas:** Guarda y reutiliza planes semanales

### 🚧 En Desarrollo

*   Importación de recetas desde URL
*   Notificaciones in-app
*   PWA (instalable)
*   Optimizaciones de performance

## 📚 Documentación

### 🚀 Empezar Aquí

*   **[⚡ Next Actions](./NEXT_ACTIONS.md)** - **START HERE** - Qué hacer ahora mismo
*   **[✅ Quick Wins Checklist](./QUICK_WINS_CHECKLIST.md)** - Tareas de 2 semanas con alto impacto
*   **[💻 Comandos Útiles](./COMANDOS.md)** - Referencia rápida de comandos

### 📊 Estado y Planificación

*   **[📊 Estado General](./estado-general-aplicaci-n.plan.md)** - Análisis completo del estado actual
*   **[🎯 Plan de Optimización](./PLAN_OPTIMIZACION_COMPLETO.md)** - Roadmap detallado hacia producción (7 fases)
*   **[📋 Resumen Ejecutivo](./RESUMEN_EJECUTIVO_PLAN.md)** - Plan de 3 meses para beta
*   **[📚 Índice de Documentación](./INDICE_DOCUMENTACION.md)** - Navegación completa de docs

### 👨‍💻 Para Desarrolladores

*   **[📏 Guías de Código](./GUIDELINES.md)** - Convenciones y mejores prácticas
*   **[🤝 Contribución](./CONTRIBUTING.md)** - Cómo contribuir al proyecto
*   **[📝 Changelog](./CHANGELOG.md)** - Historial de cambios

### 🎨 Visión y Estrategia

*   **[📄 Visión del Producto](./PRODUCT_VISION.md)** - Objetivos estratégicos y público objetivo
*   **[🗺️ Roadmap](./ROADMAP.md)** - Plan de desarrollo a largo plazo

## 🛠️ Pila Tecnológica

*   **Frontend:** React, Vite, TypeScript
*   **UI:** Tailwind CSS, Shadcn UI
*   **Backend & DB:** Supabase
*   **Iconos:** Lucide Icons

## ⚙️ Configuración y Desarrollo Local

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd [NOMBRE_DEL_DIRECTORIO]
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    # o yarn install o pnpm install
    ```
3.  **Configurar variables de entorno:**
    *   Crea un archivo `.env.local` en la raíz del proyecto.
    *   Añade tus claves de API de Supabase (obtenidas desde tu proyecto en Supabase):
        ```env
        VITE_SUPABASE_URL=TU_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
        VITE_POSTHOG_KEY=TU_CLAVE_POSTHOG # opcional para métricas
        VITE_LAUNCHDARKLY_CLIENT_KEY=TU_CLIENT_SIDE_ID # opcional para flags
        VITE_USE_MOCK_AUTH=true # habilita datos mock en dev/e2e
        ```
    *   Si instrumentas el edge function, define en Supabase `POSTHOG_API_KEY`, `POSTHOG_HOST`, `VISION_STORAGE_BUCKET` y `VISION_STORAGE_TTL_DAYS`.
4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    # o yarn dev o pnpm dev
    ```
5.  Abre tu navegador en `http://localhost:5173` (o el puerto que indique Vite).

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, revisa nuestras guías:

*   **[📜 Guía de Contribución](./CONTRIBUTING.md)**
*   **[📏 Guías de Código y Estilo](./GUIDELINES.md)**

## 📄 Licencia

[Especificar tipo de licencia, ej: MIT]

---

*Hecho con ❤️ para simplificar tu cocina.*
