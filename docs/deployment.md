# Pipeline de despliegue

Este documento describe el flujo completo de despliegue para **A comerla**, desde la integración continua hasta la publicación automática en Vercel. Incluye los requisitos de infraestructura, las variables de entorno necesarias y los puntos de monitoreo que acompañan a cada despliegue.

## Arquitectura general

1. **Integración continua (CI)** a través de GitHub Actions ejecuta pruebas básicas y el script `health_check.sh` para validar el estado de los servicios críticos.
2. **Despliegue continuo (CD)** mediante Vercel, que construye y publica la aplicación web cada vez que la rama principal pasa todas las verificaciones de CI.
3. **Monitoreo y telemetría** con PostHog proporciona métricas clave (errores de JavaScript, tiempos de carga y eventos personalizados) visibles desde el panel de PostHog.

La siguiente imagen resume el flujo:

```
Git push ➜ GitHub Actions (CI) ➜ Reporte de salud + build de Vercel ➜ PostHog (telemetría en producción)
```

## Configuración de Vercel

1. **Crear o seleccionar un proyecto** en Vercel y vincular el repositorio de GitHub.
2. **Elegir la rama de producción** (`main` por defecto) y habilitar las _Preview Deployments_ para otras ramas.
3. **Definir el comando de build** (Vercel detecta Vite automáticamente, pero puede fijarse a `npm run build`).
4. **Configurar variables de entorno** (ver tabla inferior). Estas variables deben añadirse tanto en el entorno `Production` como en `Preview` si se desea paridad.

### Variables de entorno requeridas

| Variable                                      | Alcance              | Descripción                                                                                                                       |
| --------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`                           | Cliente web (Vite)   | URL del proyecto Supabase.                                                                                                        |
| `VITE_SUPABASE_ANON_KEY`                      | Cliente web (Vite)   | Clave anónima de Supabase.                                                                                                        |
| `VITE_POSTHOG_KEY`                            | Cliente web (Vite)   | Clave pública del proyecto PostHog.                                                                                               |
| `VITE_POSTHOG_HOST`                           | Cliente web (Vite)   | Host del colector PostHog. Usar `https://app.posthog.com` u otro si se emplea región UE/US.                                       |
| `VITE_ANALYTICS_DISABLED`                     | Cliente web (Vite)   | Opcional. Establecer a `true` para desactivar la telemetría en despliegues temporales.                                            |
| `SUPABASE_URL`                                | Backend/Health check | Endpoint base usado por `health_check.sh` para validar disponibilidad (puede coincidir con `VITE_SUPABASE_URL`).                  |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `PGPASSWORD` | Backend/Health check | Credenciales de lectura para el chequeo de base de datos PostgreSQL. Opcional: si faltan, el script reporta el paso como omitido. |
| `HEALTHCHECK_BACKUP_PATH`                     | Backend/Health check | Opcional. Directorio raíz donde se ubican los respaldos; si no existe, se mostrará advertencia.                                   |

> **Nota:** cuando se utilice Supabase, `DB_HOST`, `DB_NAME`, `DB_USER` y `PGPASSWORD` pueden obtenerse desde la sección _Project Settings → Database_ y deben crearse usuarios dedicados de solo lectura.

### Enlaces y dominios

- **Dominio de producción:** configurar en Vercel (p. ej. `app.acomerla.com`).
- **Cabeceras de seguridad:** añadir en `vercel.json` o en la configuración de Vercel si se requieren encabezados personalizados.
- **Rutas protegidas:** asegurarse de que las variables de entorno sensibles se manejen únicamente en el servidor; nunca se exponen claves secretas a Vite.

## Integración continua y chequeos de salud

El workflow `.github/workflows/ci.yml` ejecuta:

1. Instalación de dependencias con `npm ci`.
2. Ejecución de `npm run build` para validar que el proyecto compila.
3. Ejecución de `health_check.sh`, que genera un reporte en `health_reports/latest.md`.
4. Publicación del reporte en el panel de GitHub Actions (Job Summary) para consulta rápida.

Para habilitar los chequeos remotos:

- Añade las variables indicadas en la sección anterior como **GitHub Secrets** (`DB_HOST`, `DB_NAME`, `DB_USER`, `PGPASSWORD`, `SUPABASE_URL`).
- Crea un secreto `POSTHOG_API_KEY` si deseas inyectarlo como `VITE_POSTHOG_KEY` durante pruebas de preview (opcional).

El workflow fallará si `health_check.sh` detecta errores críticos. Las advertencias no interrumpen el despliegue pero quedan registradas.

## Despliegues automáticos

- Al hacer push a `main`, GitHub Actions ejecuta el workflow. Si todos los pasos finalizan con éxito, Vercel realiza el build y despliegue automático.
- Para ramas feature, se crean deployments de preview. Estos despliegues también ejecutan la telemetría PostHog (puedes desactivarla estableciendo `VITE_ANALYTICS_DISABLED=true` en el entorno `Preview`).
- Se recomienda habilitar _Required Checks_ en GitHub para que la rama `main` solo acepte merges cuando el workflow `CI` haya finalizado correctamente.

## Monitoreo post-despliegue

- **PostHog:** revisa eventos `app_loaded`, `js_error` y `performance_metrics` para conocer errores de JavaScript y tiempos de carga. Puedes crear dashboards específicos para estas métricas.
- **GitHub Actions:** consulta el reporte de salud en el resumen del job para verificar disponibilidad de servicios y estado de backups.
- **Alertas:** configura en PostHog notificaciones sobre eventos `js_error` o tiempos de carga superiores al umbral definido (ver README para detalles).

## Resolución de problemas

| Síntoma                                    | Posible causa                                                 | Acción sugerida                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Vercel falla el build                      | Variables `VITE_SUPABASE_*` o dependencias faltantes          | Verifica el panel de _Environment Variables_ y ejecuta `npm run build` localmente.                     |
| `health_check.sh` finaliza con error en CI | Falta de credenciales de base de datos o endpoint inaccesible | Confirma que los secretos estén configurados y que el runner pueda alcanzar la base de datos/Supabase. |
| No aparecen métricas en PostHog            | Clave o host incorrectos, analítica desactivada               | Comprueba `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` y que `VITE_ANALYTICS_DISABLED` no esté en `true`.   |

## Próximos pasos sugeridos

- Añadir pruebas end-to-end (Playwright o Cypress) para validar flujos críticos antes de desplegar.
- Conectar Vercel a un _Webhook_ que notifique a Slack/Teams cuando un despliegue termine.
- Automatizar la rotación de backups y validar su integridad desde el pipeline de CI.
