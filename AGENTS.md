# Repository Guidelines

## Project Structure & Module Organization
- The single-page app lives under `src/`, with domain modules in `features/*` (pantry, planning, shopping-list, user), shared UI in `components/`, global context in `context/`, Zustand stores in `stores/`, utilities and the Supabase client in `lib/`, and cross-cutting types in `types/`. Tests sit beside their subjects as `.test.ts` or `.test.tsx` files. Static assets resolve from `public/`, while production bundles land in `dist/`. Server-side helpers for Edge Functions stay in `api/`, and Supabase migrations/configuration are versioned in `supabase/`. Product plans and UX specs reside in `docs/` and the roadmap documents at the repo root—consult them before proposing major changes.

## Build, Test, and Development Commands
- `npm run dev` launches Vite with fast refresh at `http://localhost:5173`.
- `npm run build` type-checks (`tsc`) and emits an optimized bundle in `dist/`.
- `npm run preview` serves the built output for manual smoke tests.
- `npm run test`, `npm run test:watch`, and `npm run test:coverage` drive the Jest suite; keep coverage above the current baseline for critical services and components.

## Coding Style & Naming Conventions
- Use TypeScript functional components, lean on composition, and surface reusable pieces via named exports. Honor the ruleset in `eslint.config.js`; auto-fix with `npx eslint . --fix`. Stick to 2-space indentation. Components follow PascalCase filenames, hooks are camelCase with a `use` prefix, Zustand stores end with `Store`, and constants stay in `UPPER_SNAKE_CASE`. Tailwind utility classes belong in JSX; avoid ad-hoc inline styles unless dynamically computed. Cross-check nuanced patterns with `GUIDELINES.md` to stay aligned with legacy decisions.

## Testing Guidelines
- Jest runs in a jsdom environment with React Testing Library and `@testing-library/jest-dom` set up via `jest.setup.js`. New logic should ship with colocated `*.test.ts(x)` coverage that exercises edge cases, async flows, and store behaviors. Mock Supabase or external services via the existing `__mocks__/` helpers. Execute `npm run test:coverage` before submitting to confirm regressions are caught early.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat(scope): summary`) as established in history (`feat(app): …`, `fix(recipes): …`). Keep subject lines imperative and under ~60 characters, flag breaking changes with `!`, and describe rationale plus testing notes in the body. Pull requests should link related roadmap items or issues, outline manual/automated checks, call out Supabase migration impacts (including `run_migrations.sh` usage), and attach UI screenshots or short clips when visuals change. Tag appropriate reviewers for feature domains to speed feedback.
