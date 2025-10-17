# Planning Dashboard – Glassmorphic Responsive Spec

**Last updated:** 2025-10-16  
**Owner:** Product Design / Planning Feature Squad

## Goals
- Deliver a responsive planning dashboard that reinforces continuity between pantry, planning, and shopping flows while embracing the iOS 16 glassmorphism aesthetic requested for “A comerla”.
- Provide implementation-ready guidance for engineering, covering desktop weekly scheduling and mobile daily agenda experiences.
- Ensure the UI communicates drag-and-drop affordances, state clarity, and actionable nutrition insights without sacrificing performance or accessibility.

## Scope & Dependencies
- Applies to `PlanningDashboardPage` (`src/features/planning/pages`) and shared shells (`src/components/layout/*`).
- Reuses the global mesh background layer introduced in `LIQUID_GLASS_REDESIGN.md`.
- Navigation icons reference Lucide icon set already bundled under `src/components/icons`.
- Drag-and-drop leverages the existing DnD provider (`src/features/planning/context/PlanningDnDContext.tsx`). Update hit areas to align with the new card geometry.

## Global Canvas
- **Background:** Full viewport gradient from `#0F172A` (top-left) to `#1E293B` (bottom-right) applied via CSS custom property `--planning-surface`.
- **Glass panels:** Use `rgba(255, 255, 255, 0.22)` overlay, `backdrop-filter: blur(20px) saturate(160%)`, border `1px solid rgba(255, 255, 255, 0.16)`, inset highlight `rgba(255, 255, 255, 0.18)` on the top edge, and drop shadow `0 20px 40px rgba(15, 23, 42, 0.35)`.
- **Typography:** Continue using the global font pairing (display: `Inter 600`, body: `Inter 400/500`). Primary text `#F8FAFC`, secondary text `rgba(248, 250, 252, 0.75)`. All numeric tokens align with `docs/ui-patterns.md`.
- **Spacing tokens:** Retain 8px base grid. Key gutters: 24px outer padding, 16px internal content spacing on cards, 12px between controls in dense toolbars.

## Desktop Layout (≥ 1024px)

### Frosted Header (fixed, height 72px)
- **Structure:** 24px top padding above scrollable content. Header spans full width, pinned with `position: sticky; top: 0; z-index: 60`.
- **Content zones:**
  1. **Logo cluster (left):** 40px width reserved, compact logomark with subtle glow (`box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25), 0 10px 20px rgba(79, 142, 247, 0.3)`).
  2. **Contextual search:** `Button`-sized input (height 44px) with leading `Search` icon, placeholder “Buscar recetas, ingredientes o planes”. Glass surface intensifies on focus (`backdrop-filter: blur(24px)`, border gradient accent `linear-gradient(120deg,rgba(79,142,247,0.7),rgba(52,211,153,0.4))`).
  3. **Week/Day toggle pill:** Segmented control (width 168px) with slider indicator. Selected state `background: rgba(79, 142, 247, 0.4)`, label `Inter 500`. Hover reveals soft outer glow `0 8px 16px rgba(79,142,247,0.35)`.
  4. **Utility icons (right):** Notification bell (badge accent `#F87171` when alerts), profile avatar with ring highlight `linear-gradient(140deg,#4F8EF7,#34D399)`. Provide 12px spacing.
- **Behavior:** Scroll compress reduces header height to 64px, scales logo to 32px, and condenses search input width by 12%.

### Translucent Sidebar (width 248px)
- **Navigation stack:** Vertical list with section title “Planificación” (uppercase, letter-spacing 0.12em). Items use pill hover highlight `rgba(79, 142, 247, 0.25)` and active indicator bar (`2px` accent line).
- **Quick actions block:** Glass card pinned under nav with buttons:
  - `Crear plan` (primary, `buttonVariants('gradient')`)
  - `Duplicar semana` (outline variant with accent glow on hover)
  - `Generar lista de compras` (glass variant, icon `ShoppingCart`)
- **Secondary actions:** Provide microtext links (e.g., “Ver historial”) using `Button variant="link"`.
- **Responsive behavior:** Collapse to icon-only rail (72px) between 1024px–1280px. Hover/tooltip reveals labels.

### Weekly Calendar Grid
- **Structure:** 7 columns (Mon–Sun by locale) with column headers pinned under header via secondary sticky row for quick scanning. Each column width fluid within remaining space after sidebar (min 160px). Rows: Morning, Lunch, Dinner, Snack (row height 142px on desktop).
- **Grid styling:** Each cell is a glass tile with subtle border; empty cells display dotted outline `1px dashed rgba(248,250,252,0.25)` and “Arrastra una receta” helper text.
- **Meal cards:** Draggable cards (padding 16px, corner radius 24px) include:
  - Title (text-ellipsis; max two lines)
  - Category icon pill (16px icon + label)
  - Nutrition badges (calories, protein, carbs) using `Badge` component with translucent background `rgba(79,142,247,0.2)`; completed state flips to `rgba(52,211,153,0.24)` with icon `CheckCircle`.
  - Status chip top-right:
    - Planned: text `Programado`, border `rgba(79,142,247,0.6)`
    - Cooking: gradient accent background, animated pulse ring.
    - Completed: solid `#34D399`, icon `Check`.
  - Drag handle icon aligned right.
- **States:**
  - **Hover:** Elevation `0 12px 30px rgba(15,23,42,0.45)` plus scale `1.02`.
  - **Drag start:** Increase blur to `24px`, add accent outline `2px dotted rgba(79,142,247,0.6)`.
  - **Drop target active:** Cell background transitions to `rgba(79,142,247,0.18)` with animated gradient border.
  - **Disabled (locked meal):** Desaturate card to `rgba(248,250,252,0.35)`, disable drag handle, show lock icon tooltip.

### Meal Plans & Details Drawer
- **Plan cards:** Horizontal carousel below grid showcasing saved plan templates. Each card width 320px, glass surface with highlight accent. Include plan name, timeframe tags, and quick menu (`…`).
- **Details drawer:** Slides in from right (width 360px) with layered blur (24px). Contains:
  - Recipe hero image with glass mask.
  - Macro summary grid (calories, protein, carbs, fats) using pill badges.
  - Ingredients preview list with action icons.
  - `Agregar a lista de compras` CTA as gradient button.
  - Tabs for “Notas”, “Sustituciones” using underlined segmented control.
- **Behavior:** Drawer anchors to selected meal card; transitions with `120ms` ease onwards. On wide monitors (≥1440px) drawer stays docked; on narrower widths it overlays with dimmed scrim (`rgba(15, 23, 42, 0.55)`).

### Footer Bar
- Minimal bar (height 56px), pinned bottom with same glass palette. Shows weekly nutrition summary (calories trend, protein, carbs, fats) using inline sparkline and badge statuses (green when goals met). Right-aligned link “Ir a compras” styled as gradient ghost button with arrow icon. On scroll, bar gains subtle top border glow.

## Mobile Layout (≤ 768px)

### Header
- Collapse into 56px top bar: logo + condensed search icon that opens modal search (full-screen glass overlay). Week/day toggle becomes segmented control inside toolbar below header.

### Day Carousel
- Horizontal scrollable pill group showing three days simultaneously. Center day uses accent highlight (#4F8EF7), outer pills semi-transparent. Provide `snap` behavior and drop shadow `0 8px 18px rgba(15,23,42,0.45)`.

### Daily Timeline
- Vertical timeline with time anchors (Morning, Lunch, Dinner, Snack). Each entry uses card variant with left progress stem:
  - Planned: translucent stem.
  - Cooking: animated gradient pulse along stem.
  - Completed: stem `#34D399`.
- Card content matches desktop but reorganized: icon + title stacked, macros collapsed into chips row. Swipe left reveals contextual actions (mark completed, swap meal). Swipe right opens quick notes.

### Interactions
- **Swipe gestures:** Reveal action buttons with gradient backgrounds; keep haptics note for mobile.
- **Long press:** Enter drag mode; meal ghost card follows finger with depth shadow. Provide haptic pointer instructions in tooltip once per session.
- **Floating action button:** Circular glass FAB bottom-right with “+”. Tap reveals radial sheet (semi-transparent) offering `Crear`, `Duplicar semana`, `Generar lista`. Each option uses icon + label button.
- **Details drawer:** Full-height modal sliding from bottom, same content as desktop drawer but uses collapsible ingredient sections.

### Footer
- Convert weekly nutrition summary into collapsible bottom sheet accessible via “Resumen semanal” chip. Tapping opens glass panel with stat bars and CTA linking to shopping module.

## Interaction States & Feedback
- **Hover (desktop):** All interactive glass surfaces increase brightness by 6%, add soft inner glow.
- **Focus:** Provide 2px focus ring `rgba(79,142,247,0.8)` offset by 2px to satisfy WCAG. For dark background, include drop shadow `0 0 0 4px rgba(15,23,42,0.85)`.
- **Active/Pressed:** Compress scale to `0.98`, reduce blur to `16px` to simulate press depth.
- **Selected:** Maintain accent border and persistent glow until unselected.
- **Alerts:** Use `#F87171` for warning badges (e.g., missing macros). Pair with info tooltip.
- **Loading:** For generative operations (e.g., Generate list) show inline spinner plus shimmering gradient across button (refer to `docs/ui-patterns.md`).

## Component Inventory
- **Header:** Convert existing `PlanningToolbar` into `PlanningHeader` to host search, toggle, bells, and profile.
- **Navigation:** Extend `src/components/layout/AppSidebar.tsx` with new quick-action block.
- **Calendar grid:** New component `PlanningCalendarGrid` (glassy variant) reusing existing logic but updated styling tokens.
- **Meal card:** Extend `PlanningMealCard` to accept `status`, `macros`, and `badges` props.
- **Details drawer:** Build under `src/features/planning/components/MealDetailsDrawer.tsx`, using `Dialog` from `@headlessui/react` or the existing sheet component.
- **Mobile timeline:** Introduce `DailyAgenda` component with `useSwipeable` hook (reuse from shopping list if available).

## Responsive Breakpoints
- **≥1440px:** Sidebar expanded, drawer docked, grid center-aligned with max width 1320px.
- **1280–1439px:** Sidebar collapsed to icon rail, drawer overlays with scrim.
- **1024–1279px:** Grid reduces row height to 120px, macros within cards compress to icons-only.
- **768–1023px:** Switch to hybrid layout: header sticky, sidebar transforms into bottom navigation sheet; weekly grid available via horizontal scroll.
- **≤767px:** Mobile agenda default; weekly grid accessible via “Ver semana” action that opens horizontal scroll view.

## Accessibility & Performance
- Maintain 4.5:1 contrast for text on glass surfaces; lighten overlay when necessary.
- Ensure keyboard navigation: arrow keys to traverse grid, `Enter` to open drawer, `Space` to pick up meal, `Esc` to cancel drag.
- Provide ARIA live region updates for drag-and-drop actions (“Almuerzo del martes movido al miércoles”).
- Use GPU-friendly blur (`backdrop-filter`) but guard with fallback solid surfaces for browsers without support.
- Lazy-load recipe preview imagery and cap blur radius on low-power devices (`prefers-reduced-transparency` media query).

## Linked Experiences
- Quick action “Generar lista de compras” routes to `shopping-list` module with selected week context (`?source=planning` query).
- “Ir a compras” footer action should trigger cross-module analytics event `planning_to_shopping`.
- Maintain shared iconography and badge styles to reinforce connection with pantry alerts (use same `AlertBadge` component where possible).

## Deliverables & Next Steps
1. Wire desktop and mobile flows in Figma using these specifications; attach prototypes in `docs/design-system`.
2. Update Tailwind theme tokens (`tailwind.config.js`) to include `glass-accent` gradient and `planning-dark` background.
3. Partner with engineering to create storybook entries for `PlanningMealCard`, `PlanningCalendarGrid`, and `DailyAgenda`.
4. Validate interactions with usability testing focusing on drag discoverability and nutrition comprehension.
