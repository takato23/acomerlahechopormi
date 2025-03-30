# Visión del Producto: "A comerla"

*Última Actualización: [Fecha]*

Este documento describe la visión estratégica, objetivos, público objetivo y principios rectores para la aplicación "A comerla". Sirve como guía para el desarrollo y la toma de decisiones del producto.

## 1. Visión y Misión

*   **Visión:** Convertirse en la herramienta indispensable y amigable para la planificación de comidas caseras, ayudando a las personas a organizar su cocina, reducir el desperdicio de alimentos y disfrutar más del proceso de cocinar y comer.
*   **Misión:** Simplificar la planificación de comidas semanales, la gestión de recetas y despensa, y la creación de listas de compras inteligentes, todo en una interfaz intuitiva y agradable.

## 2. Objetivos del Producto

*   **Objetivos a Corto Plazo (Próximos 3-6 meses):**
    *   [ ] Lanzar versión MVP con funcionalidades core estables (Planificador, Recetas básicas, Despensa básica, Lista Compras básica).
    *   [ ] Alcanzar [Número] usuarios activos iniciales.
    *   [ ] Recopilar feedback temprano para guiar próximas iteraciones.
    *   [ ] Refinar la experiencia de usuario del planificador semanal.
*   **Objetivos a Largo Plazo (1-2 años):**
    *   [ ] Implementar funcionalidades avanzadas (Importación recetas, Análisis nutricional, Sugerencias IA, **Price Scraping**).
    *   [ ] Ayudar a los usuarios a **ahorrar dinero** en sus compras (vinculado a Price Scraping).
    *   [ ] Explorar e implementar modelo de monetización sostenible.
    *   [ ] Construir una comunidad de usuarios (si aplica).
    *   [ ] Convertirse en una app de referencia en la categoría de planificación de comidas.

## 3. Público Objetivo (User Personas)

*   **Persona Principal:** [Nombre Persona 1]
    *   *Descripción:* (Ej: Profesional ocupado/a, familia joven, estudiante, persona interesada en comer más sano, etc.)
    *   *Necesidades:* (Ej: Ahorrar tiempo, reducir estrés de "¿qué comemos hoy?", comer más variado/saludable, controlar presupuesto, evitar desperdicio).
    *   *Frustraciones Actuales:* (Ej: Falta de organización, compras impulsivas, comidas repetitivas, dificultad para encontrar/guardar recetas).
*   **Persona Secundaria (Opcional):** [Nombre Persona 2]
    *   *Descripción:* ...
    *   *Necesidades:* ...
    *   *Frustraciones:* ...

*(Esta sección requiere desarrollo detallado)*

## 4. Funcionalidades Principales (Épicas)

*   **Planificador Semanal:** Vista de calendario, asignación de recetas/comidas a días/tipos, navegación entre semanas.
*   **Gestión de Recetas:** Crear, editar, importar (futuro), buscar, filtrar recetas. Detalles de ingredientes e instrucciones.
*   **Gestión de Despensa:** Listado de ingredientes disponibles, cantidades, fechas de caducidad (futuro).
*   **Lista de Compras Inteligente:** Generación automática, comparación con despensa, agrupación, precios estimados (vía Price Scraping).
*   **Perfil de Usuario:** Preferencias dietéticas, configuración, gestión de cuenta.
*   **(Futuro) Price Scraping (Argentina):** Obtención de precios de supermercados para mostrar en listas de compras y potencialmente comparar.
*   **(Futuro) Sugerencias IA:** Recomendaciones de recetas basadas en despensa, preferencias, historial.
*   **(Futuro) Funciones Sociales:** Compartir recetas/planes (si aplica).

## 5. Estrategia de Monetización (Hipótesis Inicial)

*   **Modelo Propuesto:** Freemium.
    *   *Gratuito:* Funcionalidades básicas (Planificador limitado, número X de recetas, despensa manual).
    *   *Premium (Suscripción):*
        *   Planificación ilimitada.
        *   Importación de recetas desde URLs.
        *   Sugerencias IA avanzadas.
        *   Análisis nutricional detallado.
        *   Gestión avanzada de despensa (alertas caducidad).
        *   Sin anuncios (si se consideraran en el futuro).
        *   Compartir planes/recetas con otros usuarios premium.
*   **Alternativas Consideradas:** Pago único, modelo basado en anuncios (desaconsejado inicialmente por impacto en UX).

*(Esta sección requiere validación y desarrollo detallado)*

## 6. Principios Rectores

*   **Diseño:**
    *   Intuitivo y Fácil de Usar.
    *   Estética Suave, Amigable y Moderna (Paleta Pastel).
    *   Consistente y Coherente visualmente.
    *   Accesible (WCAG AA).
    *   Responsivo (Mobile-first considerado).
*   **Técnicos:**
    *   Rendimiento Optimizado (carga rápida, interacciones fluidas).
    *   Código Mantenible y Escalable.
    *   Seguridad de los Datos del Usuario.
    *   Uso eficiente de recursos (API calls, etc.).

## 7. Pila Tecnológica Principal

*   **Frontend:** React, Vite, TypeScript
*   **UI:** Tailwind CSS, Shadcn UI
*   **Backend/DB:** Supabase
*   **Estado (Potencial):** Zustand, Context API
*   **Otros:** Lucide Icons, date-fns

## 8. Roadmap

*   Ver [ROADMAP.md](./ROADMAP.md) para el plan detallado de desarrollo y lanzamientos.