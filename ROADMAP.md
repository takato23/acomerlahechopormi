# Roadmap de "A comerla"

*Este roadmap se basa en la [Visión del Producto](./PRODUCT_VISION.md)*

## Visión General

Convertirse en la herramienta indispensable y amigable para la planificación de comidas caseras, ayudando a las personas a organizar su cocina, reducir el desperdicio de alimentos y disfrutar más del proceso de cocinar y comer. Simplificar la planificación de comidas semanales, la gestión de recetas y despensa, y la creación de listas de compras inteligentes, todo en una interfaz intuitiva y agradable.

## Fase 1: Lanzamiento Inicial (MVP)

El objetivo inicial es lanzar una versión funcional con las características esenciales para la gestión básica de la cocina.

**Funcionalidades Incluidas:**

1.  **Gestión de Despensa (Básica):**
    *   Añadir/Editar/Eliminar ítems (nombre, cantidad, unidad).
    *   Visualización del inventario.
2.  **Gestión de Recetas (Básica):**
    *   Añadir/Editar/Eliminar recetas (título, descripción, instrucciones, ingredientes vinculados).
3.  **Planificación Semanal (Manual):**
    *   Calendario visual semanal.
    *   Asignar recetas o comidas personalizadas (texto libre) a días/tipos de comida.
4.  **Lista de Compras (Básica):**
    *   Generación automática basada en recetas planificadas (rango de fechas).
    *   Agrupación simple de duplicados.
    *   Visualización de la lista.

**Tecnologías:** React (Vite), TypeScript, Shadcn/UI, Tailwind CSS, Supabase.

## Próximos Pasos (Post-MVP / Fases Futuras)

Una vez establecido el MVP, se priorizarán las siguientes mejoras y funcionalidades (el orden puede variar según feedback y estrategia):

1.  **Sugerencias Inteligentes "¿Qué Cocino?" (IA):**
    *   Integración con modelo de lenguaje (ej. Google Gemini).
    *   Sugerencias basadas en ingredientes de la despensa y perfil básico.
2.  **Mejoras en Lista de Compras:**
    *   Comparación inteligente con la despensa (añadir solo lo necesario).
    *   Agrupación avanzada por categoría/pasillo.
    *   Marcar ítems como comprados (persistente).
    *   Añadir ítems manualmente (persistente).
3.  **Price Scraping (Argentina):**
    *   Implementación inicial para 1-2 supermercados principales.
    *   Mostrar precios estimados en la lista de compras.
    *   (Futuro) Comparación de precios.
4.  **Normalización Avanzada de Ingredientes:**
    *   Sugerencias/Autocompletado.
    *   Gestión de unidades y conversiones.
5.  **Perfil de Usuario Avanzado:**
    *   Preferencias dietéticas, alergias, objetivos.
    *   Filtrado de recetas y sugerencias basado en perfil.
6.  **Mejoras UI/UX:**
    *   Refinamiento continuo basado en feedback y la visión de diseño.
7.  **Aplicaciones Móviles / PWA:**
    *   Explorar desarrollo nativo o PWA para mejor experiencia móvil.

## Ideas a Futuro / Wishlist

*   Análisis nutricional detallado.
*   Importación avanzada de recetas (URL, fotos).
*   Integración directa con carritos de compra online.
*   Funciones sociales (compartir).
*   Alertas de caducidad.
*   Soporte multi-idioma.
*   Historial de precios y alertas de ofertas.