#!/bin/bash
set -euo pipefail

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[HEALTH]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_banner() {
  echo -e "${BLUE}"
  echo "Health Check - Sistema de Recetas"
  echo "================================"
  echo -e "${NC}"
  date '+%Y-%m-%d %H:%M:%S'
  echo
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

record_summary() {
  local name="$1"
  local status="$2"
  local details="$3"
  details=${details//$'\n'/ }
  SUMMARY_ROWS+=("| ${name} | ${status} | ${details} |")
}

# Variables globales utilizadas en el reporte
SUMMARY_ROWS=()
TOTAL_ERRORS=0
DISK_USED_PERCENT=""
DISK_FREE_SPACE=""
DB_CONNECTED=0
DB_RECIPES_COUNT=""
DB_INGREDIENTS_COUNT=""
SUPABASE_STATUS="Omitido"
LOG_ERROR_COUNT=""
LATEST_BACKUP=""
BACKUP_AGE_DAYS=""
LAST_QUERY_TIME=""
REPORT_FILE=""

check_disk_space() {
  log "Verificando espacio en disco..."
  if ! command_exists df; then
    warn "Comando df no disponible"
    record_summary "Espacio en disco" "Omitido" "El comando df no está instalado"
    return 0
  fi

  local df_output
  if ! df_output=$(df -h . 2>/dev/null | awk 'NR==2'); then
    warn "No se pudo obtener el uso de disco"
    record_summary "Espacio en disco" "Advertencia" "No se pudo leer la información de df"
    return 0
  fi

  local free_space used_percent
  free_space=$(awk '{print $4}' <<<"$df_output")
  used_percent=$(awk '{print $5}' <<<"$df_output" | tr -d '%')

  DISK_FREE_SPACE="$free_space"
  DISK_USED_PERCENT="$used_percent"

  if [[ -z "$used_percent" ]]; then
    warn "Formato inesperado en salida de df"
    record_summary "Espacio en disco" "Advertencia" "Salida de df no interpretable"
    return 0
  fi

  if (( used_percent > 90 )); then
    error "Espacio crítico: $free_space libre (${used_percent}% usado)"
    record_summary "Espacio en disco" "Error" "Sólo $free_space libre (${used_percent}% usado)"
    return 1
  elif (( used_percent > 80 )); then
    warn "Espacio limitado: $free_space libre (${used_percent}% usado)"
    record_summary "Espacio en disco" "Advertencia" "Espacio limitado: $free_space libre"
    return 0
  else
    success "Espacio suficiente: $free_space libre (${used_percent}% usado)"
    record_summary "Espacio en disco" "OK" "Libre: $free_space (${used_percent}% usado)"
    return 0
  fi
}

check_database() {
  log "Verificando base de datos..."

  if [[ -z "${DB_HOST:-}" || -z "${DB_NAME:-}" || -z "${DB_USER:-}" ]]; then
    warn "Variables DB_* no configuradas. Paso omitido"
    record_summary "Base de datos" "Omitido" "Variables DB_* no configuradas"
    return 0
  fi

  if ! command_exists psql; then
    warn "psql no disponible en el entorno"
    record_summary "Base de datos" "Omitido" "psql no está instalado"
    return 0
  fi

  if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    error "No se puede conectar a la base de datos"
    record_summary "Base de datos" "Error" "Conexión fallida a $DB_HOST/$DB_NAME"
    return 1
  fi

  DB_CONNECTED=1
  local recipes_count ingredients_count
  recipes_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM recipes;" 2>/dev/null || echo "N/D")
  ingredients_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM recipe_ingredients;" 2>/dev/null || echo "N/D")

  DB_RECIPES_COUNT="$recipes_count"
  DB_INGREDIENTS_COUNT="$ingredients_count"

  success "Base de datos conectada"
  echo "- Recetas: $recipes_count"
  echo "- Ingredientes: $ingredients_count"
  record_summary "Base de datos" "OK" "Recetas: $recipes_count · Ingredientes: $ingredients_count"
  return 0
}

check_services() {
  log "Verificando servicios..."

  if [[ -z "${SUPABASE_URL:-}" ]]; then
    warn "SUPABASE_URL no configurada. Paso omitido"
    record_summary "Servicios externos" "Omitido" "SUPABASE_URL no definida"
    return 0
  fi

  if ! command_exists curl; then
    warn "curl no disponible en el entorno"
    record_summary "Servicios externos" "Omitido" "curl no está instalado"
    return 0
  fi

  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL%/}/rest/v1/" || true)
  SUPABASE_STATUS="HTTP ${status_code:-N/A}"

  if [[ "$status_code" == "200" || "$status_code" == "204" || "$status_code" == "401" ]]; then
    success "Supabase responde (HTTP $status_code)"
    record_summary "Servicios externos" "OK" "Supabase respondió con $status_code"
    return 0
  fi

  error "Supabase no responde (HTTP ${status_code:-sin respuesta})"
  record_summary "Servicios externos" "Error" "Respuesta HTTP ${status_code:-sin respuesta}"
  return 1
}

check_logs() {
  log "Verificando logs recientes..."
  local log_dir="${LOG_DIR:-logs}"

  if [[ ! -d "$log_dir" ]]; then
    warn "Directorio de logs no encontrado ($log_dir)"
    record_summary "Logs" "Advertencia" "No existe el directorio $log_dir"
    LOG_ERROR_COUNT="N/D"
    return 0
  fi

  local error_files
  error_files=$(find "$log_dir" -type f -mtime -1 -print0 2>/dev/null | xargs -0 -r grep -l "ERROR" 2>/dev/null | wc -l | tr -d ' ')
  LOG_ERROR_COUNT="$error_files"

  if [[ "$error_files" == "" ]]; then
    error_files=0
    LOG_ERROR_COUNT=0
  fi

  if (( error_files > 0 )); then
    warn "Se encontraron $error_files archivos con errores en las últimas 24h"
    record_summary "Logs" "Advertencia" "Archivos con errores en 24h: $error_files"
  else
    success "No se encontraron errores en las últimas 24h"
    record_summary "Logs" "OK" "Sin errores en las últimas 24h"
  fi

  if (( error_files > 10 )); then
    return 1
  fi

  return 0
}

check_backups() {
  log "Verificando backups..."
  local backup_root="${HEALTHCHECK_BACKUP_PATH:-backups}"

  if [[ ! -d "$backup_root" ]]; then
    warn "Directorio de backups no encontrado ($backup_root)"
    record_summary "Backups" "Advertencia" "Directorio $backup_root no existe"
    LATEST_BACKUP="N/D"
    BACKUP_AGE_DAYS="N/D"
    return 0
  fi

  local latest_backup
  latest_backup=$(ls -t "$backup_root"/*.tar.gz 2>/dev/null | head -1 || true)

  if [[ -z "$latest_backup" ]]; then
    warn "No se encontraron archivos de backup (*.tar.gz)"
    record_summary "Backups" "Advertencia" "Sin archivos de backup recientes"
    LATEST_BACKUP="N/D"
    BACKUP_AGE_DAYS="N/D"
    return 1
  fi

  local backup_age
  backup_age=$(( ( $(date +%s) - $(date -r "$latest_backup" +%s) ) / 86400 ))

  LATEST_BACKUP="$latest_backup"
  BACKUP_AGE_DAYS="$backup_age"

  if (( backup_age > 7 )); then
    warn "Backup más reciente tiene $backup_age días"
    record_summary "Backups" "Advertencia" "Último backup ($backup_age días)"
    return 1
  else
    success "Backup reciente disponible ($backup_age días)"
    record_summary "Backups" "OK" "Último backup hace $backup_age días"
    return 0
  fi
}

check_performance() {
  log "Verificando rendimiento..."

  if (( DB_CONNECTED == 0 )); then
    warn "Sin conexión de base de datos previa. Paso omitido"
    record_summary "Rendimiento BD" "Omitido" "Se requiere conexión a la base de datos"
    return 0
  fi

  if ! command_exists bc; then
    warn "bc no disponible, no se puede medir tiempo de consulta"
    record_summary "Rendimiento BD" "Omitido" "bc no está instalado"
    return 0
  fi

  local start_time end_time query_time
  start_time=$(date +%s.%N)
  if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM recipes;" >/dev/null 2>&1; then
    warn "No se pudo ejecutar la consulta de prueba"
    record_summary "Rendimiento BD" "Advertencia" "Consulta de rendimiento fallida"
    return 0
  fi
  end_time=$(date +%s.%N)
  query_time=$(echo "$end_time - $start_time" | bc)
  LAST_QUERY_TIME="$query_time"

  if (( $(echo "$query_time > 1.0" | bc -l) )); then
    warn "Query lenta: ${query_time}s"
    record_summary "Rendimiento BD" "Advertencia" "Consulta demoró ${query_time}s"
    return 1
  else
    success "Rendimiento aceptable: ${query_time}s"
    record_summary "Rendimiento BD" "OK" "Consulta en ${query_time}s"
    return 0
  fi
}

generate_health_report() {
  local timestamp
  timestamp=$(date '+%Y%m%d_%H%M%S')
  REPORT_FILE="health_reports/health_${timestamp}.md"
  mkdir -p health_reports

  {
    echo "# Reporte de Salud del Sistema"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Estado General"
    echo "- Uso de disco: ${DISK_USED_PERCENT:-N/D}% usado (${DISK_FREE_SPACE:-N/D} libres)"
    echo "- Base de datos: Recetas=${DB_RECIPES_COUNT:-N/D}, Ingredientes=${DB_INGREDIENTS_COUNT:-N/D}"
    echo "- Supabase: ${SUPABASE_STATUS:-N/D}"
    echo "- Errores en logs (24h): ${LOG_ERROR_COUNT:-N/D}"
    echo "- Último backup: ${LATEST_BACKUP:-N/D} (edad: ${BACKUP_AGE_DAYS:-N/D} días)"
    echo "- Tiempo de consulta: ${LAST_QUERY_TIME:-N/D}s"
    echo
    echo "## Resumen de verificaciones"
    echo "| Verificación | Estado | Detalles |"
    echo "| --- | --- | --- |"
    for row in "${SUMMARY_ROWS[@]}"; do
      echo "$row"
    done
    echo
    echo "## Recomendaciones"
    if [[ -n "$DISK_USED_PERCENT" && $DISK_USED_PERCENT -gt 80 ]]; then
      echo "- Considera liberar espacio en disco."
    fi
    if [[ -n "$LOG_ERROR_COUNT" && "$LOG_ERROR_COUNT" != "N/D" && $LOG_ERROR_COUNT -gt 0 ]]; then
      echo "- Revisa los archivos de log con errores recientes."
    fi
    if [[ -n "$BACKUP_AGE_DAYS" && "$BACKUP_AGE_DAYS" != "N/D" && $BACKUP_AGE_DAYS -gt 7 ]]; then
      echo "- Genera un nuevo backup para reducir el riesgo de pérdida de datos."
    fi
    if [[ -n "$LAST_QUERY_TIME" ]]; then
      echo "- Optimiza las consultas de base de datos si el tiempo supera 1s de forma consistente."
    fi
  } > "$REPORT_FILE"

  ln -sf "$(basename "$REPORT_FILE")" health_reports/latest.md
  success "Reporte generado: $REPORT_FILE"
}

print_next_steps() {
  printf "%bPróximos pasos:%b\n" "$BLUE" "$NC"
  printf "1. Revisar el reporte detallado\n"
  printf "2. Solucionar problemas encontrados\n"
  printf "3. Programar mantenimiento si es necesario\n\n"
  printf "%bPara más información:%b\n" "$BLUE" "$NC"
  printf "$ cat health_reports/latest.md\n"
}

run_check() {
  local name="$1"
  shift
  if ! "$@"; then
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
  fi
  echo "----------------------------------------"
}

main() {
  show_banner

  run_check "Espacio en disco" check_disk_space
  run_check "Base de datos" check_database
  run_check "Servicios" check_services
  run_check "Logs" check_logs
  run_check "Backups" check_backups
  run_check "Rendimiento" check_performance

  generate_health_report

  if (( TOTAL_ERRORS == 0 )); then
    success "✨ Sistema saludable"
  else
    warn "⚠️ Se encontraron $TOTAL_ERRORS problemas"
  fi

  print_next_steps

  if (( TOTAL_ERRORS > 0 )); then
    return 1
  fi
  return 0
}

mkdir -p health_logs
LOG_FILE="health_logs/health_$(date '+%Y%m%d_%H%M%S').log"

set +e
main 2>&1 | tee "$LOG_FILE"
exit_code=${PIPESTATUS[0]}
set -e

if [[ -n "$REPORT_FILE" && -f "$REPORT_FILE" ]]; then
  ln -sf "$(basename "$REPORT_FILE")" health_reports/latest.md
fi

exit $exit_code
