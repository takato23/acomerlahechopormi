# Configuración local de Supabase

Esta guía describe cómo levantar Supabase en Docker utilizando la CLI oficial y cómo sincronizar las variables necesarias en `.env.local` para que la aplicación web utilice la instancia local.

## Requisitos previos

- [Supabase CLI](https://supabase.com/docs/guides/cli) instalada (v1.152 o superior).
  - macOS/Linux: `brew install supabase/tap/supabase`
  - Windows: `scoop install supabase`
- Docker Desktop o motor Docker en ejecución.
- Node.js instalado para ejecutar la aplicación (ver `README.md`).

## 1. Inicializar el proyecto

La carpeta `supabase/` contiene la configuración del proyecto (`config.toml`), migraciones y seeds. Para preparar el entorno local:

```bash
# Inicia los contenedores de Supabase (PostgreSQL, Kong, Studio, etc.)
supabase start
```

Al finalizar, la CLI mostrará las URL y claves generadas para la instancia. Mantén la terminal abierta o copia estos valores.

## 2. Aplicar migraciones y seeds

Con los contenedores activos puedes aplicar todas las migraciones y el seed inicial:

```bash
# Limpia la base de datos, ejecuta migraciones y carga `supabase/seed.sql`
supabase db reset --use-migra --seed supabase/seed.sql
```

Este comando reconstruye el esquema utilizando los archivos de `supabase/migrations` y pobla datos de referencia (categorías, unidades y recetas de ejemplo).

Si solo quieres aplicar migraciones sin borrar datos existentes, usa:

```bash
supabase db push --seed supabase/seed.sql
```

## 3. Sincronizar `.env.local`

La aplicación (Vite/React) lee las credenciales de Supabase desde `.env.local`. Después de ejecutar `supabase start` puedes obtener los valores vigentes con:

```bash
supabase status --json | jq '.services.db' # opcional para ver detalles
supabase status
```

Crea o edita `.env.local` en la raíz del proyecto con las variables mínimas:

```ini
VITE_SUPABASE_URL=<API URL>
VITE_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

- `API URL` y `anon key` aparecen en la salida de `supabase start`/`status`.
- `service_role key` es útil para scripts backend o ejecución de seeds personalizados.

Cada vez que reinicies `supabase start`, verifica si cambiaron estas claves y actualiza `.env.local` para mantener la aplicación conectada.

## 4. Ejecutar la aplicación

Con Supabase y las variables configuradas:

```bash
npm install
npm run dev
```

La app usará automáticamente la instancia local gracias a los valores definidos en `.env.local`.

## 5. Apagar los contenedores

Cuando termines, detén los servicios para liberar recursos:

```bash
supabase stop
```

Si quieres eliminar los contenedores e imágenes creados por la CLI, ejecuta:

```bash
supabase stop --destroy
```

## Notas adicionales

- Los seeds utilizan el primer usuario existente en `auth.users` para asignar las recetas de ejemplo. Crea un usuario desde Supabase Studio o con `supabase auth signups create` antes de correr los seeds si la tabla está vacía.
- El archivo `supabase/seed.sql` es idempotente: puedes re-ejecutarlo sin duplicar datos gracias a `ON CONFLICT` y comprobaciones internas.
- Si modificas las migraciones, recuerda ejecutar `supabase db reset` para reconstruir el entorno local y validar los cambios.
