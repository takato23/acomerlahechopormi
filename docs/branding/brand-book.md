# A Comerla Food Studio — Brand Book (v1.0, 17 Oct 2025)

> Propósito: posicionar A Comerla como un estudio gastronómico digital premium, donde la curaduría culinaria se combina con automatización inteligente.

## 1. Personalidad de Marca
- **Esencia:** Studio gastronómico boutique, cálido, meticuloso y orientado a servicio profesional.
- **Valores guía:** Mise en place impecable, curaduría de temporada, datos accionables, hospitalidad empática.
- **Arquetipo:** *The Creator* con matices de *The Sage* (expertise) y *The Caregiver* (acompañamiento continuo).

## 2. Paleta Cromática Maestro Mise en Place
| Token | Hex | Uso principal | Notas de contraste |
| --- | --- | --- | --- |
| `--color-crudo-claro` | `#FEF8F3` | Fondos hero, secciones aireadas | Contraste AA con texto `#2E1B17`
| `--color-paprika` | `#E85C43` | CTA primario, highlights demo | Contraste AAA con `#FEF8F3`
| `--color-merlot` | `#5D2A42` | Headlines, marcas de sección | Usar en 60% de headings
| `--color-salvia` | `#8A9A5B` | Etiquetas de estado, badges sostenibles | Complementario a `paprika`
| `--color-trufa` | `#2E1B17` | Texto principal | Usar 80% de body copy
| `--color-neblina` | `#D8CFC4` | Bordes suaves, tarjetas ghost | Mantener 1px o 2px máximo
| `--color-miel` | `#F3A48A` | Elementos interactivos secundarios | Ideal para gradientes

**Gradiente hero sugerido:** `linear-gradient(135deg, #FEF8F3 0%, #F3A48A 45%, #5D2A42 100%)` con overlay en `rgba(46,27,23,0.35)`.

## 3. Sistema Tipográfico
| Rol | Fuente | Peso | Tracking | Aplicación |
| --- | --- | --- | --- | --- |
| Display / Hero | "Playfair Display" | 600-700 | -0.03em | Titulares hero, claims clave |
| Titulares sección | "Fraunces" | 600 | -0.01em | Sub-headings de storytelling |
| Body copy | "Inter" | 400-500 | 0em | Párrafos, UI copy |
| Datos / UI densa | "Manrope" | 500 | 0.02em | Cards, labels, tablas |

**Fallback stack:** `"Playfair Display", "Fraunces", "Manrope", "Inter", "system-ui", sans-serif`.

## 4. Componentes UI Hero & Storytelling
- **Hero Dinámico:** overlay de video loop o imagen editorial (`public/branding/hero-chef-aurora.webp`), claim en 2 líneas y KPI badges ("Mise en place ahorrada", "Curadurías automáticas"). CTA doble: `Solicita una degustación guiada` (primario) + `Explora demo interactiva` (ghost).
- **Catálogo Visual:** grid masonry 3 columnas con tarjetas `CardStudio` (cover + etiqueta `colección` + botón `Ver set`). Animación hover: `scale-105` + shadow `shadow-[0_18px_40px_rgba(45,27,23,0.18)]`.
- **Testimonios:** carrusel `AutoPlayCarousel` con tarjetas dark (`bg-merlot`) y cita tipografía display, avatar circular `48px`. Añadir sello `Studio Verified`.
- **CTA Demo Interactiva:** bloque dividided 2 columnas: preview mini app y checklist de beneficios con iconografía lucide `sparkles, chef-hat, workflow`.
- **Micro-interacciones:** Border radius 18px, transiciones `duration-300`, usar `framer-motion` para fade + parallax suave.

## 5. Guía Fotográfica Editorial
- **Moodboard:** bodegones editoriales, fondos textiles, luz lateral suave. Referencia: revistas `Kinfolk`, `Cereal`, `Apartamento Comedor`.
- **Composición:** plano 45°, foco manual, textura visible (maderas, cerámicas, lino). Integrar manos en acción (mise en place) para transmitir dinamismo.
- **Paleta fotográfica:** tonos cálidos desaturados (paprika, miel, trufa). Evitar saturación digital, preferir grano ligero.
- **Variedad:** 40% platos finales, 30% procesos, 20% ingredientes, 10% backstage (equipo). Incluir mínimo 1 foto vertical para mobile hero.

## 6. Iconografía y Motivos
- Iconos `lucide-react` custom con traza 1.5px, color `--color-trufa` y fondo `--color-crudo-claro`. Agregar ilustraciones abstractas de utensilios lineales.
- Motivo repetido: patrón de círculos concéntricos suave (`texture-mise-en-place.png`) para secciones de transición.

## 7. Voz y Mensajes Clave
- **Tagline principal:** "Food studio-as-a-service para marcas y chefs visionarios".
- **Promesa:** "Curaduría gastronómica asistida por IA + operación lista para escalar".
- **CTA estándar:** "Agenda una degustación guiada".
- **Tonality:** Verbos sensoriales, léxico culinario profesional (mise en place, curaduría, maridaje de datos). Evitar diminutivos.

## 8. Implementación Técnica
- Tokens CSS centralizados en `src/styles/tokens.css` (crear si no existe) o `tailwind.config.js` → `theme.extend.colors`.
- Componentes shadcn ampliar variantes: `Button` (`variant="studio"`), `Badge` (`tone="salvia"`), `Card` (`elevated`).
- Incorporar `prefers-reduced-motion` para desactivar animaciones hero.

## 9. Checklist de Lanzamiento Branding
- [ ] Actualizar `src/App.tsx` y secciones asociadas con layout Food Studio.
- [ ] Regenerar assets base (`public/branding/*`).
- [ ] Actualizar `docs/content-guidelines.md` acorde al tono (dependencia con stream UX Premium).
- [ ] Emitir `docs/branding/assets.md` con especificaciones y uso.
- [ ] Integrar nuevos tokens en `tailwind.config.js`.

## 10. Próximas Iteraciones (Hipótesis)
- Explorar motion reel hero (Lottie en `hero-motion.json`).
- Shooting real con Chef Aurora (pendiente de budget).
- Integrar sistema de iconos custom (pendiente vector).

