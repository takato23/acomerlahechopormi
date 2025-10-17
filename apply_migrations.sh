#!/bin/bash
echo "Ingresa la contraseña de la base de datos de Supabase (del dashboard):"
read -s DB_PASSWORD
echo ""
echo "Aplicando migraciones a: kzvaebxqfzrogjkszijd"
echo "Ejecutando: supabase db push --db-url 'postgresql://postgres.kzvaebxqfzrogjkszijd:$DB_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'"
supabase db push --db-url "postgresql://postgres.kzvaebxqfzrogjkszijd:$DB_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
