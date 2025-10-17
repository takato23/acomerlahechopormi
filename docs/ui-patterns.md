# UI Patterns

This document inventories the UI primitives already present in the codebase and defines a consistent system for actions and visual feedback (toasts, loaders, and empty states). Source paths are provided so the team can trace every pattern back to its implementation.

## Buttons

The canonical button component lives in `src/components/ui/button.tsx`, exporting `Button` and `buttonVariants` via class-variance-authority. Prefer this implementation for any clickable action and avoid duplicating styles per feature.

### Variant Inventory

| Variant name | Visual summary | Intended use | Notes |
| --- | --- | --- | --- |
| `default` | Gradient primary background, white text, glow/scale hover | Primary call-to-action | Default selection when no `variant` prop is passed. |
| `gradient` | Secondary gradient background, white text, glow | Alternate highlight action | Use to differentiate a secondary hero action from the primary while keeping emphasis. |
| `secondary` | Neutral secondary background, high-contrast text | Secondary actions within a flow | Good for "Cancel", "Editar", or softer confirmations. |
| `outline` | Translucent glass card w/ subtle border that intensifies on hover | Low-emphasis actions in high-density layouts | Works well on dashboard cards and toolbars. |
| `glass` | Glassmorphism border + backdrop blur | Decorative actions over imagery or gradients | Avoid on plain backgrounds to keep contrast. |
| `ghost` | No fill, hover accent background | Inline or icon + text actions where layout already draws attention | Gets paired with destructive icons in tables. |
| `destructive` | Solid destructive color, white text | Irreversible or high-risk actions | Always confirm critical flows with a modal. |
| `link` | Text-only, underline on hover | Inline links that still behave as buttons | Do not use for navigation within paragraphs—prefer `<Link>`. |

### Size Tokens

- `sm`: `h-8`, tight padding, 12px text—use inside dense forms and list rows.
- `default`: `h-10`, standard padding—ideal baseline for most pages.
- `lg`: `h-12`, 16px text—use for hero actions or onboarding steps.
- `icon`: Square footprint—pair with Lucide icons or the `Spinner` for async affordances.

### Usage Guidelines

- Import from `@/components/ui/button` and pass `variant`/`size` rather than custom Tailwind strings.
- Wrap links with `Button` via the `asChild` prop (`Button asChild` + `<Link>`), as done in `src/components/common/RoutePlaceholder.tsx`.
- Inject inline loaders by rendering `<Spinner size="sm" />` inside the button and flipping the label to a past-tense confirmation after success.
- File `src/components/ui/button-variants.ts` still exports an older rounded-md scale. Treat it as **legacy**; migrate remaining callers to `button.tsx` before removal.

## Visual Feedback System

Feedback should transition through three layers: anticipatory (loaders), transactional (toasts), and persistent (empty states). Align messages to the tone defined in `docs/pantry_input_redesign_plan.md` and related UX specs.

### Toast Notifications

- **Infrastructure:** `src/App.tsx` mounts Sonner's `<Toaster>` with top-right positioning, system theme, and a neutral glass surface.
- **Helpers:** Llama siempre a los wrappers de `src/lib/notifications.ts` (`notifySuccess`, `notifyError`, `notifyInfo`, `notifyWarning`, `notifyAsync`). Estos aplican opciones consistentes (duración, botón de cierre, clases) y permiten `description`, `actionLabel`, `onActionClick` sin repetir configuración.
- **Intents disponibles:** `success`, `info`, `error`, `warning`. Usa `warning` solo para evitar acciones peligrosas; `info` cubre mensajes neutrales o guidance.
- **Patrón de copy:** Frases en voice & tone cercanas, verbo al inicio y modo indicativo. Ejemplos:
  - Éxito: `notifySuccess('Lista actualizada a partir de tu planificación semanal.')`
  - Error: `notifyError('No pudimos añadir los ingredientes. Inténtalo nuevamente.')`
  - Info: `notifyInfo('No se hallaron coincidencias de precios para los ítems actuales.')`
- **Acciones:** Prefiere una única acción inline cuando el follow-up es inmediato (`notifySuccess('...', { actionLabel: 'Ver', onActionClick })`). Evita múltiples botones.
- **Flujos async:** Usa `notifyAsync(promise, { loading, success, error })` o combina `notifyInfo` + spinner en UI para operaciones >1.5 s. Cancela/dismiss en los handlers de éxito/error para evitar toasts colgados.

### Loading Patterns

- **Global/page blocking:** Reuse the local `PageLoader` pattern from `src/App.tsx`—a centered `<Spinner size="lg" />` inside a full-height flex wrapper—for Suspense fallbacks or auth gating states.
- **Section-level:** Wrap cards or panels with a neutral container and center `<Spinner />`, e.g., `DashboardPage` widgets render `<Spinner />` while fetching aggregates.
- **Inline/controls:** Place `<Spinner size="sm" className="mr-2" />` inside buttons (`UserProfilePage.tsx:493`) or next to status text. When disabling a control, ensure the spinner inherits the text color for readability.
- **Skeletons:** `MapSkeleton` in `ShoppingMapPanel.tsx` offers a lightweight example (bordered block with copy). Use this pattern when data layout changes significantly compared with the loaded state; otherwise stick to spinners.

### Empty & Placeholder States

- **Reusable component:** `src/components/common/EmptyState.tsx` accepts `icon`, `title`, `description`, and optional `action`. Apply it for zero-data results (Pantry low stock widget, Recipe list).
- **Guidelines:** Always include a meaningful action (button or link) if the user can resolve the empty state immediately. Icons should be semantic and sized before passing—`EmptyState` does not enforce dimensions.
- **Route/feature placeholders:** `RoutePlaceholder` (same directory) communicates "en construcción" or "no encontrado" statuses with status badges and gradient actions. Keep using it for roadmap items not yet implemented.
- **Loading-to-empty transitions:** Sequence loader → empty state by checking the data array length after the async effect settles, as seen in `PantryItemsView.tsx`.

### Pattern Matrix

| Context | UI surface | Components | Notes |
| --- | --- | --- | --- |
| Page navigation | Full viewport | `PageLoader` (`Spinner size="lg"`) | Trigger during route-level Suspense or auth gating. |
| Form submission | Button row | `Button` + inline `Spinner` + toast | Disable button while loading; show success/error toast on completion. |
| Data absence | Card or page body | `EmptyState` (+ optional `Button`) | Swap in when data array is empty and no filters apply. |
| Background sync | Floating alert | `toast.info` or `toast.success` | Keep messages short; avoid blocking UI. |
| Deferred feature | Full page | `RoutePlaceholder` | Choose `status="under-construction"` or `"not-found"` per scenario. |

## Next Steps

1. Migrate any remaining callers of `button-variants.ts` to the canonical `Button` component and remove the duplicate file once the diff is clean.
2. Add a shared `toast.loading` helper (wrapper around Sonner) to standardize long-running operations.
3. Introduce a lightweight `Skeleton` component under `src/components/ui/` if future designs require shimmering placeholders beyond the existing map skeleton.
