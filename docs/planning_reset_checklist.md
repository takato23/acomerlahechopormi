# Planning Reset Checklist

## Objetivo
Dejar la base de datos en Supabase lista para la nueva arquitectura de planificación semanal (_meal plans_) tras un reset completo del proyecto online.

## Pasos imprescindibles antes del reset
- [ ] Exportar tablas críticas (`meal_plan_entries`, `recipes`, `shopping_list_items`, etc.) desde el panel de Supabase si se necesitan respaldos.
- [ ] Revisar `supabase/migrations` y confirmar el orden deseado de ejecución.
- [ ] Guardar variables de entorno sensibles (`anon`, `service_role`, claves PostHog) por si se regeneran.

## Reset de la base (Supabase Dashboard)
1. Ir a **Project Settings → General**.
2. Localizar la sección **Reset Project Database**.
3. Confirmar la acción (tarda varios minutos y es irreversible).
4. Esperar a que el dashboard muestre la base nuevamente disponible.

> Alternativa manual (avanzada): ejecutar en el SQL Editor  
> ```sql
> drop schema public cascade;
> create schema public;
> ```  
> Después hay que reprocesar todas las migraciones manualmente.

## Reaplicar migraciones
1. Actualizar credenciales en `.env` si algo cambió.
2. Ejecutar desde la raíz del repo:
   ```bash
   supabase migration up --db-url "<POSTGRES_URL>"
   ```
   - El `POSTGRES_URL` aparece en **Project Settings → Database → Connection string**.
   - Verificar que cada migración figure como aplicada en el resumen del CLI.
3. Si alguna migración falla por dependencias (ej. `handle_updated_at`), ejecutar primero:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_updated_at()
   RETURNS trigger AS $$
   BEGIN
     NEW.updated_at = timezone('utc'::text, now());
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
   y relanzar `supabase migration up`.

## Verificación post-migración
- [ ] Revisar en **Table Editor** que existan `meal_plans`, `meal_plan_entries`, `planning_templates`.
- [ ] Ejecutar en SQL Editor:
  ```sql
  select count(*) from meal_plans;
  select table_name from information_schema.columns
   where table_schema = 'public' and column_name = 'meal_plan_id';
  ```
- [ ] Comprobar que la app (`npm run dev`) ya no queda cargando en la página de planificación.
- [ ] Verificar logs en `supabase/migrations/.journal` (si está habilitado).

## Checklist adicional
- [ ] Restaurar datos semilla ejecutando el script preparado (ver `sql/seed_meal_plans.sql` una vez creado).
- [ ] Reconfigurar políticas RLS personalizadas si hiciera falta.
- [ ] Confirmar que las claves analíticas (`posthog`) siguen activas tras el reset.
- [ ] Actualizar este documento con cualquier hallazgo o edge case.

