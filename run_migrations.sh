#!/bin/bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: supabase CLI no está instalado o no está en el PATH." >&2
  exit 1
fi

DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
  echo "Ingresa tu contraseña de base de datos de Supabase:"
  read -s DB_PASSWORD
  echo ""
fi

echo "Ejecutando migraciones pendientes (incluyendo vision_insights)..."
supabase db push -p "$DB_PASSWORD"

echo "Migraciones aplicadas correctamente."
