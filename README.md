# A comerla - Tu Asistente Inteligente de Planificación de Comidas

🍳🥗🌙 ¡Organiza tus comidas, simplifica tus compras y disfruta más cocinando!

"A comerla" es una aplicación web diseñada para ayudarte a planificar tus comidas semanales de forma fácil e intuitiva, gestionar tus recetas favoritas, controlar tu despensa y generar listas de compras inteligentes.

## ✨ Características Principales (Actuales y Futuras)

*   **Planificador Semanal Visual:** Organiza desayunos, almuerzos y cenas para toda la semana.
*   **Gestión de Recetas:** Guarda y organiza tus propias recetas. (Próximamente: Importación desde URL).
*   **Gestión de Despensa:** Lleva un registro de los ingredientes que tienes en casa. (Funcionalidad básica actual).
*   **Lista de Compras Inteligente:** Genera automáticamente lo que necesitas comprar. (Próximamente).
*   **Perfil de Usuario:** Configura tus preferencias.
*   **(Futuro) Sugerencias IA:** Recibe recomendaciones personalizadas.

## 🚀 Visión y Roadmap

Nuestra visión a largo plazo y los objetivos estratégicos del producto están detallados en nuestro documento de visión:

*   **[📄 Visión del Producto](./PRODUCT_VISION.md)**

El plan de desarrollo y las próximas funcionalidades se encuentran en nuestro roadmap:

*   **[🗺️ Roadmap](./ROADMAP.md)**

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
        VITE_POSTHOG_KEY=TU_CLAVE_DE_POSTHOG # Opcional, habilita telemetría
        VITE_POSTHOG_HOST=https://app.posthog.com # Cambia según tu región/self-hosting
        VITE_ANALYTICS_DISABLED=false
        ```
4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    # o yarn dev o pnpm dev
    ```
5.  Abre tu navegador en `http://localhost:5173` (o el puerto que indique Vite).

## 📈 Observabilidad y Métricas

![Health Check Status](https://img.shields.io/github/actions/workflow/status/<OWNER>/acomerlahechopormi/ci.yml?label=Health%20Check&logo=github)

> Sustituye `<OWNER>` por el usuario u organización de GitHub que aloja el repositorio para que el badge muestre el estado real.

- **Health check automatizado:** el workflow [`CI`](.github/workflows/ci.yml) ejecuta `health_check.sh`, genera el reporte `health_reports/latest.md` y lo expone en el resumen del job de GitHub Actions.
- **Telemetría ligera con PostHog:** `src/utils/analytics.ts` inicializa PostHog y captura eventos clave: `app_loaded`, `js_error`, `promise_rejection`, `performance_metrics` y `first_contentful_paint`.
- **Alertas recomendadas:** en PostHog crea acciones que notifiquen cuando `js_error` supere un umbral o cuando `performance_metrics.loadTime` exceda tus objetivos de SLA.
- **Paneles sugeridos:** combina métricas de errores y tiempos de carga con el estado del health check para tener una vista rápida de salud del sistema.

Para más detalles de despliegue y observabilidad revisa [`docs/deployment.md`](./docs/deployment.md).

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, revisa nuestras guías:

*   **[📜 Guía de Contribución](./CONTRIBUTING.md)**
*   **[📏 Guías de Código y Estilo](./GUIDELINES.md)**

## 📄 Licencia

[Especificar tipo de licencia, ej: MIT]

---

*Hecho con ❤️ para simplificar tu cocina.*
