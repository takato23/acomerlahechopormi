# Plan de Rediseño Estético - Planificador Semanal

Este documento describe el plan seguido para rediseñar la interfaz del planificador semanal, buscando una estética más suave, pastel, amigable y modular.

## Objetivos del Rediseño

*   **Estilo General:** Suave, pastel, amigable, modular.
*   **Componentes:** Cards redondeadas (`rounded-2xl`), sombras suaves, padding generoso.
*   **Tipografía:** Títulos grandes y amigables (`text-xl`, `text-2xl`).
*   **Elementos Visuales:** Emojis/íconos grandes, ilustraciones sutiles (opcional).
*   **Detalles:** Toques cálidos, botones redondeados/minimalistas.
*   **Responsividad:** Adaptación a móvil (vertical/scroll).
*   **Tecnología:** Shadcn UI, Tailwind CSS.

## Análisis Inicial

1.  **`tailwind.config.js`:**
    *   Colores definidos mediante variables CSS (`hsl(var(--...))`).
    *   Fuente 'Poppins' ya en uso.
    *   `--radius` base es `0.5rem` (`rounded-lg`).
2.  **`src/index.css`:**
    *   Paleta inicial basada en `slate` y `emerald`.
    *   Variables CSS definidas en `:root` y `.dark`.

## Plan de Implementación por Capas

### 1. Paleta de Colores Pastel

*   **Acción:** Modificar las variables CSS en `src/index.css` para `:root` (modo claro) y `.dark` (modo oscuro) con tonos pastel y suaves.
*   **Resultado:** Se aplicó una nueva paleta basada en HSL con colores como cian pálido para cards, verde menta suave como primario y grises suaves para textos y fondos.

### 2. Estilo de Cards y Contenedores

*   **Acción:** Modificar `MealCard.tsx` y `PlanningPage.tsx`.
    *   Aplicar `rounded-2xl`.
    *   Usar sombras suaves (`shadow-md`, `shadow-lg`) con colores tenues.
    *   Incrementar padding (`p-4`, `p-6`).
    *   Utilizar las nuevas variables de color (`bg-card`, `bg-muted`, etc.).
    *   Añadir efectos `backdrop-blur` y gradientes sutiles.
    *   Incluir transiciones suaves (`transition-all duration-300`).
*   **Resultado:** Las cards y el contenedor principal ahora tienen un aspecto más suave, redondeado y con efectos visuales modernos.

### 3. Tipografía y Emojis/Iconos

*   **Acción:** Ajustar clases de tamaño y peso en `MealCard.tsx` y `PlanningPage.tsx`.
    *   Títulos: `text-lg`, `text-xl`, `text-2xl`, `font-semibold`.
    *   Emojis/Iconos: `text-2xl`, `text-3xl`.
*   **Resultado:** Mejor jerarquía visual y aspecto más amigable.

### 4. Header y Navegación (`PlanningPage.tsx`)

*   **Acción:** Rediseñar el título, la navegación semanal y el botón de IA.
    *   Aplicar fondos con `backdrop-blur` y gradientes suaves.
    *   Usar `rounded-full` y `rounded-2xl`.
    *   Estilizar botones con variantes `ghost` y colores del nuevo tema.
*   **Resultado:** El encabezado ahora es coherente con el nuevo diseño general.

### 5. Resaltado Día Actual (`PlanningPage.tsx`)

*   **Acción:** Mejorar el estilo del día actual en el header y la columna correspondiente.
    *   Usar un diseño tipo "badge" redondeado para el número del día.
    *   Aplicar un fondo sutil (`bg-primary/5`, `bg-primary/10`) a la columna y header del día actual.
*   **Resultado:** El día actual se destaca de forma elegante y clara.

### 6. Botones y Placeholders (`MealCard.tsx`)

*   **Acción:** Refinar el estilo del botón "Añadir" y el placeholder "Sin comidas planificadas".
    *   Aplicar `rounded-lg`.
    *   Usar colores y bordes del nuevo tema.
    *   Ajustar texto y espaciado.
*   **Resultado:** Los elementos interactivos son coherentes con el diseño general.

### 7. Animaciones y Transiciones

*   **Acción:** Revisar y simplificar animaciones (eliminando efectos exagerados).
    *   Usar `transition-all`, `duration-300`, `hover:scale-105`, `hover:-translate-y-[Xpx]`.
*   **Resultado:** Interacciones suaves y profesionales.

## Diagrama Conceptual

```mermaid
graph TD
    A[Inicio: Rediseño Estético Pastel] --> B{Análisis Tema Actual};
    B --> C[tailwind.config.js: Variables OK, Fuente OK, Radius=0.5rem];
    B --> D[src/index.css: Paleta Slate/Emerald];

    subgraph Plan [Plan de Implementación]
        direction LR
        D1[1. Modificar Variables CSS en src/index.css] --> P1(Definir Paleta Pastel);
        P1 --> P2[Aplicar a --background, --foreground, --card, --primary, --border, etc.];

        A --> D2[2. Modificar Estilos de Cards];
        D2 --> C1[MealCard.tsx];
        D2 --> C2[PlanningPage.tsx];
        C1 & C2 --> S1[Usar rounded-2xl];
        C1 & C2 --> S2[Definir/Usar shadow-soft o shadow-primary/10];
        C1 & C2 --> S3[Aumentar padding: p-4, p-6];
        C1 & C2 --> S4[Usar bg-card (nuevo color pastel)];

        A --> D3[3. Ajustar Tipografía/Iconos];
        D3 --> T1[Aumentar text-xl/2xl en títulos];
        D3 --> T2[Aumentar text-3xl/4xl en emojis];

        A --> D4[4. Añadir Ilustraciones (Opcional)];
        D4 --> I1[Buscar SVGs sutiles];
        I1 --> I2[Aplicar como background-image];

        A --> D5[5. Estilizar Botones];
        D5 --> B1[Usar rounded-full/xl];
        D5 --> B2[Usar variantes ghost/outline];
        B2 --> B3[Aplicar colores pastel];

        A --> D6[6. Validar Responsividad];
    end

    Plan --> Z[Resultado: Diseño Suave, Pastel y Modular];