#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[SECURITY]${NC} $1"; }
success() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Verificar permisos de archivos críticos
check_file_permissions() {
  log "Verificando permisos de archivos..."
  
  local problems=0
  
  # Archivos que deben ser ejecutables
  local executables=(
    "recipe_system.sh"
    "monitor_system.sh"
    "health_check.sh"
  )
  
  # Archivos que deben ser solo lectura
  local readonly_files=(
    ".env"
    "SISTEMA_COMPLETO.md"
    "IMPLEMENTACION.md"
  )
  
  # Verificar ejecutables
  for file in "${executables[@]}"; do
    if [ -f "$file" ]; then
      if [ ! -x "$file" ]; then
        error "Falta permiso de ejecución: $file"
        ((problems++))
      fi
    else
      warn "Archivo no encontrado: $file"
      ((problems++))
    fi
  done
  
  # Verificar solo lectura
  for file in "${readonly_files[@]}"; do
    if [ -f "$file" ]; then
      if [ -w "$(stat -f "%Su" "$file")" ]; then
        error "Archivo modificable por otros usuarios: $file"
        ((problems++))
      fi
    else
      warn "Archivo no encontrado: $file"
      ((problems++))
    fi
  done
  
  return $problems
}

# Verificar configuración de base de datos
check_database_security() {
  log "Verificando seguridad de base de datos..."
  
  local problems=0
  
  # Verificar políticas RLS
  local policies=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('recipes', 'recipe_ingredients');
  ")
  
  if [ "$policies" -eq 0 ]; then
    error "No hay políticas RLS configuradas"
    ((problems++))
  else
    success "Políticas RLS activas: $policies"
  fi
  
  # Verificar roles y permisos
  local insecure_tables=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('recipes', 'recipe_ingredients')
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = table_name
    );
  ")
  
  if [ ! -z "$insecure_tables" ]; then
    error "Tablas sin políticas RLS: $insecure_tables"
    ((problems++))
  fi
  
  return $problems
}

# Verificar variables sensibles
check_sensitive_vars() {
  log "Verificando variables sensibles..."
  
  local problems=0
  
  # Variables requeridas
  local required_vars=(
    "SUPABASE_URL"
    "SUPABASE_KEY"
    "DB_HOST"
    "DB_USER"
    "DB_NAME"
  )
  
  # Verificar existencia y protección
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      error "Variable no configurada: $var"
      ((problems++))
    else
      # Verificar si la variable está en archivo de ambiente
      if grep -q "^$var=" .env 2>/dev/null; then
        if [ "$(stat -f "%OLp" .env)" != "600" ]; then
          error "Archivo .env con permisos inseguros"
          ((problems++))
        fi
      fi
    fi
  done
  
  return $problems
}

# Verificar configuración de monitoreo
check_monitoring_security() {
  log "Verificando seguridad del monitoreo..."
  
  local problems=0
  
  # Verificar acceso al dashboard
  if [ -f "/var/www/recipe-monitor/index.html" ]; then
    if [ "$(stat -f "%OLp" /var/www/recipe-monitor/index.html)" != "644" ]; then
      error "Permisos incorrectos en dashboard"
      ((problems++))
    fi
  fi
  
  # Verificar scripts de monitoreo
  local monitor_scripts=(
    "/usr/local/bin/collect-metrics"
    "/usr/local/bin/recipe-alert"
  )
  
  for script in "${monitor_scripts[@]}"; do
    if [ -f "$script" ]; then
      if [ "$(stat -f "%OLp" "$script")" != "700" ]; then
        error "Permisos inseguros en script: $script"
        ((problems++))
      fi
    else
      warn "Script de monitoreo no encontrado: $script"
      ((problems++))
    fi
  done
  
  return $problems
}

# Generar reporte de seguridad
generate_security_report() {
  local report_file="security_reports/security_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p security_reports
  
  {
    echo "# Reporte de Seguridad"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Resumen"
    echo "- Archivos verificados: $(find . -type f | wc -l)"
    echo "- Políticas RLS: $policies"
    echo "- Variables sensibles: ${#required_vars[@]}"
    echo "- Scripts de monitoreo: ${#monitor_scripts[@]}"
    echo
    echo "## Problemas Encontrados"
    if [ $total_problems -eq 0 ]; then
      echo "✓ No se encontraron problemas de seguridad"
    else
      echo "⚠️ Se encontraron $total_problems problemas"
      
      [ $file_problems -gt 0 ] && echo "- Problemas de permisos: $file_problems"
      [ $db_problems -gt 0 ] && echo "- Problemas de base de datos: $db_problems"
      [ $var_problems -gt 0 ] && echo "- Problemas con variables: $var_problems"
      [ $monitor_problems -gt 0 ] && echo "- Problemas de monitoreo: $monitor_problems"
    fi
    echo
    echo "## Recomendaciones"
    [ $file_problems -gt 0 ] && echo "1. Corregir permisos de archivos"
    [ $db_problems -gt 0 ] && echo "2. Revisar políticas RLS"
    [ $var_problems -gt 0 ] && echo "3. Proteger variables sensibles"
    [ $monitor_problems -gt 0 ] && echo "4. Asegurar scripts de monitoreo"
  } > "$report_file"
  
  success "Reporte generado: $report_file"
}

# Función principal
main() {
  log "Iniciando verificación de seguridad..."
  echo "----------------------------------------"
  
  # Variables para conteo de problemas
  local total_problems=0
  local file_problems=0
  local db_problems=0
  local var_problems=0
  local monitor_problems=0
  
  # 1. Verificar permisos
  check_file_permissions
  file_problems=$?
  ((total_problems+=file_problems))
  echo "----------------------------------------"
  
  # 2. Verificar base de datos
  check_database_security
  db_problems=$?
  ((total_problems+=db_problems))
  echo "----------------------------------------"
  
  # 3. Verificar variables
  check_sensitive_vars
  var_problems=$?
  ((total_problems+=var_problems))
  echo "----------------------------------------"
  
  # 4. Verificar monitoreo
  check_monitoring_security
  monitor_problems=$?
  ((total_problems+=monitor_problems))
  echo "----------------------------------------"
  
  # Generar reporte
  generate_security_report
  
  # Resumen final
  if [ $total_problems -eq 0 ]; then
    success "✅ Sistema seguro"
  else
    warn "⚠️ Se encontraron $total_problems problemas de seguridad"
  fi
  
  cat << EOF

${BLUE}Estadísticas:${NC}
- Problemas de permisos: $file_problems
- Problemas de base de datos: $db_problems
- Problemas con variables: $var_problems
- Problemas de monitoreo: $monitor_problems

${BLUE}Próximos pasos:${NC}
1. Revisar el reporte detallado
2. Corregir los problemas encontrados
3. Ejecutar nuevamente la verificación

${BLUE}Para más información:${NC}
$ cat security_reports/latest.md
EOF
}

# Crear directorio para logs
mkdir -p security_logs

# Ejecutar verificación
LOG_FILE="security_logs/security_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Crear enlace al último reporte
ln -sf "$(ls -t security_reports/security_*.md | head -1)" security_reports/latest.md

exit ${PIPESTATUS[0]}