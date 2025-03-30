# Guía de Contribución para "A comerla"

¡Gracias por tu interés en contribuir a "A comerla"!

## Configuración del Entorno de Desarrollo

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO_CUANDO_EXISTA>
    cd a-comerla # O el nombre final del directorio
    ```

2.  **Instalar Dependencias:**
    Asegúrate de tener Node.js (v18+) y npm/yarn/pnpm instalados.
    ```bash
    npm install
    # o
    # yarn install
    # o
    # pnpm install
    ```

3.  **Configurar Supabase:**
    *   Crea un proyecto en [Supabase](https://supabase.com/).
    *   Ve a la configuración de tu proyecto -> API.
    *   Crea un archivo `.env.local` en la raíz del proyecto.
    *   Añade tus credenciales de Supabase al archivo `.env.local`:
        ```env
        VITE_SUPABASE_URL=TU_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
        ```
    *   Ejecuta los scripts SQL necesarios para crear las tablas iniciales (se proporcionarán en el futuro, posiblemente en un directorio `supabase/migrations`).

4.  **Ejecutar la Aplicación:**
    ```bash
    npm run dev
    # o
    # yarn dev
    # o
    # pnpm dev
    ```
    La aplicación debería estar disponible en `http://localhost:5173` (o el puerto que indique Vite).

## Proceso de Diseño y Desarrollo

Antes de empezar a trabajar en una nueva funcionalidad significativa, es importante entender la visión general del producto:
*   Consulta la **[Visión del Producto](./PRODUCT_VISION.md)** para entender los objetivos estratégicos y el público objetivo.
*   Revisa el **[Roadmap](./ROADMAP.md)** para ver las prioridades actuales.

Para funcionalidades nuevas o cambios importantes, seguimos un proceso que incluye la creación o actualización de un **Project Design Record (PDR)** específico para esa feature (ubicados en `docs/pdr/`). Este documento captura los requisitos, decisiones de diseño (UX/UI y técnico) y el razonamiento detrás de ellos. Consulta con el equipo si no estás seguro si un PDR es necesario para tu contribución.

## Flujo de Trabajo con Git

Utilizamos un flujo de trabajo basado en ramas (feature branches) y Pull Requests (PRs).

1.  **Crear una Rama:** Antes de empezar a trabajar en una nueva funcionalidad o corrección, crea una nueva rama desde `main` (o la rama de desarrollo principal):
    ```bash
    git checkout main
    git pull origin main
    git checkout -b tipo/nombre-corto-descriptivo
    ```
    *   `tipo`: Puede ser `feat` (nueva funcionalidad), `fix` (corrección de bug), `docs` (documentación), `refactor`, `chore` (tareas de mantenimiento).
    *   Ejemplo: `git checkout -b feat/gestion-despensa`

2.  **Realizar Cambios y Commits:** Haz tus cambios y realiza commits atómicos y descriptivos.
    ```bash
    git add .
    git commit -m "feat: Añade formulario para agregar ítems a la despensa"
    ```
    *(Intenta seguir la convención de [Conventional Commits](https://www.conventionalcommits.org/) si es posible).*

3.  **Enviar Cambios (Push):** Sube tu rama al repositorio remoto.
    ```bash
    git push -u origin feat/gestion-despensa
    ```

4.  **Crear un Pull Request (PR):** Ve a la interfaz de GitHub (o similar) y crea un Pull Request desde tu rama hacia `main`.
    *   Asegúrate de que el título y la descripción del PR sean claros.
    *   Si el PR resuelve un issue existente, menciónalo (ej. `Closes #123`).
    *   Si aplica, enlaza al PDR correspondiente.

5.  **Revisión y Fusión:** El PR será revisado. Una vez aprobado, se fusionará (merge) en `main`.

## Guías de Estilo de Código

*   Utilizamos **ESLint** y **Prettier** para mantener un estilo de código consistente.
*   Asegúrate de tener las extensiones correspondientes en tu editor (VS Code recomendado) para formatear automáticamente al guardar.
*   Ejecuta `npm run lint` y `npm run format` (o comandos yarn/pnpm equivalentes) antes de hacer commit si no tienes el formateo automático.
*   Consulta el archivo `GUIDELINES.md` para convenciones específicas del proyecto.

## Reportar Bugs o Sugerir Mejoras

Utiliza la sección de "Issues" del repositorio para reportar bugs detallados o proponer nuevas funcionalidades. Si propones una funcionalidad nueva, considera si requerirá la creación de un PDR y discútelo en el issue.