# Estrategia de pruebas

Este proyecto utiliza [Vitest](https://vitest.dev/) como _test runner_ junto a `@testing-library/react` para pruebas de componentes. La configuración vive en [`vitest.config.ts`](../vitest.config.ts) y reutiliza las opciones de Vite, incluyendo los alias de rutas.

## Organización de las suites

- Las pruebas unitarias por _feature_ residen en directorios `__tests__` dentro de `src/features/**/`.
- Los componentes compartidos y _stores_ mantienen sus suites junto a la implementación.

El patrón de descubrimiento configurado en Vitest es `src/features/**/__tests__/**/*.{test,spec}.{ts,tsx}` más cualquier archivo `*.test.ts(x)` o `*.spec.ts(x)` dentro de `src/`.

## Comandos disponibles

```bash
npm test          # Ejecuta las pruebas una sola vez
npm run test:watch # Ejecuta Vitest en modo watch
npm run test:coverage # Ejecuta las pruebas y genera reportes de cobertura
npm run lint      # Analiza el código con ESLint
npm run format    # Formatea el código con Prettier
```

### Cobertura

Los reportes se generan en el directorio `coverage/` con formatos `text`, `html` y `lcov`. El HTML puede abrirse desde `coverage/index.html` tras ejecutar `npm run test:coverage`.

## Hook pre-commit

Se integró `husky` + `lint-staged` para ejecutar ESLint y Prettier sobre los archivos en `git add`:

```bash
npx husky install    # (automático via script `prepare`)
```

Al crear un _commit_, Husky invoca `npm run lint-staged`, que a su vez ejecuta:

- `eslint --max-warnings=0` sobre archivos TypeScript/JavaScript
- `prettier --write` sobre código y archivos de marcado/configuración

## Ejecución en CI

El pipeline de GitHub Actions (`.github/workflows/ci.yml`) instala dependencias y delega en `./run_tests.sh --ci`, el cual:

1. Lanza `npm run lint`
2. Construye el proyecto con `npm run build`
3. Ejecuta `npm run test:ci` (Vitest + cobertura)

Los reportes de cobertura se publican como artefacto llamado `coverage-report` en cada ejecución.

## Script `run_tests.sh`

Para reproducir localmente el flujo de CI basta con:

```bash
./run_tests.sh --ci
```

El script original para pruebas de integración/sistemas permanece disponible sin argumentos.
