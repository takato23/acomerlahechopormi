# Comandos Útiles - Guía Rápida

Referencia rápida de comandos para "A comerla"

---

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Desarrollo con puerto específico
npm run dev -- --port 3000

# Abrir automáticamente en navegador
npm run dev -- --open
```

**URL:** http://localhost:5173 (puerto por defecto Vite)

---

## 🏗️ Build

```bash
# Build de producción
npm run build

# Preview del build
npm run preview

# Build con análisis de bundle
npm run build
# Luego abrir: bundle-stats.html

# Limpiar build
rm -rf dist
```

---

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests de un archivo específico
npm test -- pantryService.test.ts

# Tests que matchean patrón
npm test -- --testNamePattern="pantry"

# Re-run solo tests que fallaron
npm test -- --onlyFailures
```

**Coverage report:** `coverage/lcov-report/index.html`

### Tests E2E

```bash
# Ejecutar tests E2E (Playwright)
npm run test:e2e

# Modo UI interactivo
npx playwright test --ui

# Solo en Chrome
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generar reporte
npx playwright show-report
```

---

## 🔍 Linting y Formatting

```bash
# Ejecutar ESLint
npm run lint

# Auto-fix issues
npx eslint . --fix

# Lint solo archivos staged
npm run lint:staged

# Verificar TypeScript
npx tsc --noEmit

# Ver todos los errores (no parar en primero)
npx tsc --noEmit --skipLibCheck
```

---

## 📦 Dependencias

```bash
# Instalar dependencias
npm install

# Instalar y añadir a dependencies
npm install <package>

# Instalar y añadir a devDependencies
npm install -D <package>

# Actualizar dependencia específica
npm update <package>

# Ver dependencias outdated
npm outdated

# Audit de seguridad
npm audit

# Fix vulnerabilidades automáticamente
npm audit fix

# Fix incluyendo breaking changes
npm audit fix --force

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🗄️ Supabase

### Migraciones

```bash
# Ejecutar todas las migraciones
./run_migrations.sh

# O alternativamente
./apply_migrations.sh

# Generar tipos TypeScript desde DB
npm run generate:types
```

### Backfill de Datos

```bash
# Backfill de profiles
npm run backfill:profiles
```

---

## 🔎 Búsqueda y Análisis

### Buscar en el Código

```bash
# Buscar texto en todos los archivos
grep -r "searchTerm" src/

# Buscar con número de línea
grep -rn "searchTerm" src/

# Buscar solo en archivos .tsx
grep -r "searchTerm" src/ --include="*.tsx"

# Buscar TODOs y FIXMEs
grep -rn "TODO\|FIXME\|XXX\|HACK" src/

# Buscar imports de un módulo
grep -r "from.*zustand" src/

# Contar ocurrencias
grep -rc "useState" src/ | grep -v ":0"
```

### Análisis de Código

```bash
# Contar líneas de código (excluir node_modules)
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Ver archivos más grandes
find src -type f -exec du -h {} + | sort -rh | head -20

# Contar archivos por tipo
find src -type f | sed 's/.*\.//' | sort | uniq -c

# Ver imports circulares (requiere madge)
npx madge --circular src/main.tsx
```

---

## 🐛 Debugging

### Console Logs

```bash
# Buscar console.log olvidados
grep -rn "console\\.log" src/ --include="*.ts" --include="*.tsx"

# Buscar debuggers olvidados
grep -rn "debugger" src/
```

### Performance

```bash
# Analizar bundle
npm run build
# Abrir bundle-stats.html

# Source map explorer (si está configurado)
npx source-map-explorer dist/**/*.js

# Lighthouse en local
npx lighthouse http://localhost:5173 --view

# Lighthouse solo performance
npx lighthouse http://localhost:5173 --only-categories=performance --view
```

---

## 🎨 UI y Componentes

### Shadcn/UI

```bash
# Añadir un componente de shadcn
npx shadcn-ui@latest add button

# Ver componentes disponibles
npx shadcn-ui@latest list

# Actualizar todos los componentes
npx shadcn-ui@latest update
```

---

## 📸 Screenshots y Testing Visual

```bash
# Tomar screenshots con Playwright
npx playwright test --headed --screenshot=on

# Tomar screenshot de una URL
npx playwright screenshot https://localhost:5173 screenshot.png
```

---

## 🔄 Git

### Workflow Básico

```bash
# Ver estado
git status

# Ver branches
git branch

# Crear y cambiar a nueva branch
git checkout -b feat/nueva-feature

# Staging
git add .
git add src/features/pantry/

# Commit (seguir Conventional Commits)
git commit -m "feat(pantry): añadir filtro por categoría"

# Push
git push origin feat/nueva-feature

# Pull con rebase
git pull --rebase origin main

# Ver log bonito
git log --oneline --graph --all --decorate
```

### Cleanup

```bash
# Ver branches mergeadas
git branch --merged

# Eliminar branch local
git branch -d nombre-branch

# Eliminar branch remoto
git push origin --delete nombre-branch

# Limpiar branches remotos eliminados
git fetch --prune
```

### Deshacer Cambios

```bash
# Deshacer cambios en archivo (no staged)
git checkout -- archivo.ts

# Deshacer todos los cambios no staged
git checkout -- .

# Deshacer git add (unstage)
git reset HEAD archivo.ts

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (descartar cambios)
git reset --hard HEAD~1

# Volver a commit específico
git reset --hard <commit-hash>
```

---

## 🚢 Deployment

```bash
# Build de producción
npm run build

# Verificar build localmente
npm run preview

# Deploy a Vercel (si está configurado)
vercel

# Deploy a Vercel producción
vercel --prod
```

---

## 🧹 Limpieza

```bash
# Limpiar build artifacts
rm -rf dist coverage

# Limpiar node_modules
rm -rf node_modules

# Limpiar todo y reinstalar
rm -rf node_modules dist coverage package-lock.json
npm install

# Limpiar caché de npm
npm cache clean --force

# Limpiar caché de Vite
rm -rf node_modules/.vite
```

---

## 📊 Métricas y Análisis

### Bundle Analysis

```bash
# Generar estadísticas del bundle
npm run build

# Visualizar bundle (si está configurado)
npm run analyze
```

### Coverage

```bash
# Generar coverage
npm run test:coverage

# Abrir reporte HTML
open coverage/lcov-report/index.html
# O en Linux/WSL
xdg-open coverage/lcov-report/index.html
```

---

## 🔐 Seguridad

```bash
# Audit completo
npm audit

# Ver solo vulnerabilidades críticas
npm audit --production

# Generar reporte en JSON
npm audit --json > audit-report.json

# Ver dependencias con licencias
npx license-checker --summary
```

---

## 💡 Utilidades

### Documentación

```bash
# Generar documentación (si está configurado)
npx typedoc

# Servir documentación
npx serve docs
```

### Variables de Entorno

```bash
# Ver variables disponibles en tiempo de build
env | grep VITE_

# Verificar si variable está definida
echo $VITE_SUPABASE_URL
```

### JSON y Datos

```bash
# Formatear JSON
cat data.json | jq '.'

# Extraer campo de JSON
cat package.json | jq '.version'

# Comparar dos JSON
diff <(jq -S . file1.json) <(jq -S . file2.json)
```

---

## 🆘 Solución de Problemas

### Puerto ocupado

```bash
# Ver qué proceso usa el puerto 5173
lsof -i :5173

# Matar proceso en puerto 5173
kill -9 $(lsof -t -i:5173)
```

### Problemas de caché

```bash
# Limpiar todo
rm -rf node_modules/.vite dist
npm run dev
```

### TypeScript lento

```bash
# Ver qué está compilando
npx tsc --noEmit --listFiles

# Compilar con trace
npx tsc --noEmit --generateTrace trace
# Analizar trace en edge://tracing
```

---

## 📚 Comandos de Documentación

```bash
# Ver tamaño de carpetas docs
du -sh docs/*

# Contar palabras en docs
find docs -name "*.md" -exec wc -w {} + | tail -1

# Buscar en docs
grep -r "search term" docs/

# Generar índice de docs (TOC)
npx markdown-toc -i README.md
```

---

## 🎯 Aliases Útiles

Añadir a `.bashrc` o `.zshrc`:

```bash
# Aliases para desarrollo
alias dev="npm run dev"
alias build="npm run build"
alias test="npm run test"
alias tw="npm run test:watch"
alias lint="npm run lint"

# Aliases de git
alias gs="git status"
alias gc="git commit"
alias gp="git push"
alias gl="git log --oneline --graph --all"
alias gd="git diff"

# Aliases de limpieza
alias clean="rm -rf node_modules dist coverage"
alias fresh="clean && npm install"
```

---

## 📝 Scripts Personalizados

Añadir a `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "preview": "vite preview",
    "generate:types": "supabase gen types typescript --schema public > src/lib/database.types.ts",
    
    "// Adicionales útiles": "",
    "clean": "rm -rf dist coverage node_modules/.vite",
    "check": "tsc --noEmit",
    "check:watch": "tsc --noEmit --watch",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "analyze": "npm run build && open bundle-stats.html"
  }
}
```

---

## 🔗 Links Rápidos

- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Playwright Docs](https://playwright.dev/docs/intro)

---

**Tip:** Guarda este archivo en bookmarks para referencia rápida durante desarrollo.

