# Sistema de diseño

Esta guía documenta los patrones base del layout interno de la aplicación y los tokens de diseño que los sustentan. Utiliza esta referencia para mantener coherencia visual al crear o actualizar pantallas.

## Tokens compartidos

Los tokens están centralizados en [`design-tokens.js`](../design-tokens.js) y expuestos en TypeScript mediante [`src/config/theme.ts`](../src/config/theme.ts). Además, los tokens se inyectan en Tailwind a través de `tailwind.config.js`, por lo que puedes usarlos directamente como utilidades (`px-page-inline`, `gap-section`, etc.).

### Espaciados

| Token Tailwind | Variable CSS            | Uso recomendado                           |
| -------------- | ----------------------- | ----------------------------------------- |
| `page-inline`  | `--spacing-page-inline` | Sangría horizontal general del layout     |
| `page-block`   | `--spacing-page-block`  | Separación vertical entre áreas de página |
| `section-sm`   | `--spacing-section-sm`  | Gaps compactos dentro de tarjetas         |
| `section`      | `--spacing-section`     | Distancia estándar entre bloques          |
| `section-lg`   | `--spacing-section-lg`  | Secciones destacadas o bloques amplios    |

### Colores semánticos

Todos los colores se exponen como `hsl(var(--token))` para soportar temas claro/oscuro. Usa las claves de `theme.colors` para extender utilidades cuando se necesite personalización específica.

## Patrones de layout

### `PageLayout`

Componente principal para páginas internas. Envuelve el contenido con el padding estándar, alinea el header con icono y acciones, y limita el ancho máximo (`maxWidth` por defecto `page`).

```tsx
<PageLayout
  title="Mi Despensa"
  description="Gestiona tus ingredientes y favoritos."
  icon={<ShoppingBasket className="h-6 w-6" />}
  actions={<Button>Acción</Button>}
>
  {/* Secciones de contenido */}
</PageLayout>
```

Usa `maxWidth="full"` cuando una pantalla deba ocupar todo el ancho (por ejemplo, layout con mapa o grids extensos).

### `PageSection`

Tarjeta elevada con border y fondo (`bg-card`) alineada al diseño. Integra automáticamente `PageHeader` cuando recibe `title`, `description` o `icon`, y expone `actions` para controles locales.

```tsx
<PageSection
  title="Resumen semanal"
  description="Estado de comidas planificadas."
  actions={<Button variant="outline">Exportar</Button>}
>
  <DashboardCards />
</PageSection>
```

Utiliza `padded={false}` + `contentClassName="p-0"` cuando un bloque hijo gestione su propio padding (por ejemplo, layouts responsivos o tablas con scroll).

### `PageHeader`

Componente de cabecera reutilizable que ahora admite iconos, descripción y clases personalizadas. Evita crear cabeceras manuales; usa este componente dentro de `PageLayout` o `PageSection` para mantener tipografía y espaciados consistentes.

## Historias visuales

Los componentes de layout disponen de historias en `src/components/stories` para validar regresiones visuales con Storybook/Chromatic:

- `PageLayout.stories.tsx`
- `PageSection.stories.tsx`

Al añadir nuevos patrones, crea historias equivalentes para facilitar pruebas visuales automáticas.

## Buenas prácticas

1. **Componentes de página** (`PantryPage`, `RecipesPage`, `PlanningPage`, `ShoppingListPage`) deben renderizarse dentro de `PageLayout` y dividir su contenido mediante `PageSection`.
2. **Tokens primero**: evita valores mágicos en clases Tailwind; recurre a los tokens extendidos (`gap-section`, `px-page-inline`, etc.).
3. **Documentación sincronizada**: cuando introduzcas un nuevo patrón o token, actualiza este documento y exporta los cambios en `design-tokens.js` / `theme.ts`.
