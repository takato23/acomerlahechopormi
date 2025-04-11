#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[HEALTH]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Banner
show_banner() {
  echo -e "${BLUE}"
  echo "Health Check - Sistema de Recetas"
  echo "================================"
  echo -e "${NC}"
  date '+%Y-%m-%d %H:%M:%S'
  echo
}

# Verificar espacio en disco
check_disk_space() {
  log "Verificando espacio en disco..."
  
  local free_space=$(df -h . | awk 'NR==2 {print $4}')
  local used_percent=$(df -h . | awk 'NR==2 {print $5}' | tr -d '%')
  
  if [ "$used_percent" -gt 90 ]; then
    error "Espacio crítico: $free_space libre ($used_percent% usado)"
    return 1
  elif [ "$used_percent" -gt 80 ]; then
    warn "Espacio limitado: $free_space libre ($used_percent% usado)"
    return 0
  else
    success "Espacio suficiente: $free_space libre ($used_percent% usado)"
    return 0
  fi
}

# Verificar base de datos
check_database() {
  log "Verificando base de datos..."
  
  if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    error "No se puede conectar a la base de datos"
    return 1
  fi
  
  # Verificar tablas principales
  local recipes_count=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM recipes;")
  local ingredients_count=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM recipe_ingredients;")
  
  success "Base de datos conectada"
  echo "- Recetas: $recipes_count"
  echo "- Ingredientes: $ingredients_count"
  return 0
}

# Verificar servicios
check_services() {
  log "Verificando servicios..."
  
  # Verificar Supabase
  if ! curl -s "$SUPABASE_URL" >/dev/null; then
    error "Supabase no responde"
    return 1
  fi
  
  success "Servicios operativos"
  return 0
}

# Verificar logs
check_logs() {
  log "Verificando logs recientes..."
  
  local error_count=0
  if [ -d "logs" ]; then
    error_count=$(find ./logs -type f -mtime -1 -exec grep -l "ERROR" {} \; | wc -l)
    if [ "$error_count" -gt 0 ]; then
      warn "Se encontraron $error_count archivos con errores en las últimas 24h"
    else
      success "No se encontraron errores en las últimas 24h"
    fi
  else
    warn "Directorio de logs no encontrado"
  fi
  
  return $(( error_count > 10 ))
}

# Verificar backups
check_backups() {
  log "Verificando backups..."
  
  # Verificar backup más reciente
  local latest_backup=$(ls -t backups/*.tar.gz 2>/dev/null | head -1)
  if [ -z "$latest_backup" ]; then
    warn "No se encontraron backups"
    return 1
  fi
  
  # Verificar edad del backup
  local backup_age=$(( ($(date +%s) - $(date -r "$latest_backup" +%s)) / 86400 ))
  if [ "$backup_age" -gt 7 ]; then
    warn "Backup más reciente tiene $backup_age días"
    return 1
  else
    success "Backup reciente disponible ($backup_age días)"
    return 0
  fi
}

# Verificar rendimiento
check_performance() {
  log "Verificando rendimiento..."
  
  # Query de prueba
  local start_time=$(date +%s.%N)
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM recipes;" >/dev/null 2>&1
  local query_time=$(echo "$(date +%s.%N) - $start_time" | bc)
  
  if (( $(echo "$query_time > 1.0" | bc -l) )); then
    warn "Query lenta: ${query_time}s"
    return 1
  else
    success "Rendimiento aceptable: ${query_time}s"
    return 0
  fi
}

# Generar reporte de salud
generate_health_report() {
  local report_file="health_reports/health_$(date '+%Y%m%d_%H%M%S').md"
  mkdir -p health_reports
  
  {
    echo "# Reporte de Salud del Sistema"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "## Estado General"
    echo "- Espacio en disco: $(df -h . | awk 'NR==2 {print $5}') usado"
    echo "- Recetas totales: $(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM recipes;")"
    echo "- Errores en logs: $(find ./logs -type f -mtime -1 -exec grep -l "ERROR" {} \; | wc -l)"
    echo
    echo "## Rendimiento"
    echo "- Tiempo de respuesta: ${query_time}s"
    echo "- Último backup: $(ls -t backups/*.tar.gz 2>/dev/null | head -1)"
    echo
    echo "## Recomendaciones"
    if [ "$used_percent" -gt 80 ]; then
      echo "- Liberar espacio en disco"
    fi
    if [ "$error_count" -gt 0 ]; then
      echo "- Revisar logs de errores"
    fi
    if [ "$backup_age" -gt 3 ]; then
      echo "- Crear nuevo backup"
    fi
  } > "$report_file"
  
  success "Reporte generado: $report_file"
}

# Función principal
main() {
  show_banner
  
  local errors=0
  
  # 1. Espacio en disco
  check_disk_space
  ((errors+=$?))
  echo "----------------------------------------"
  
  # 2. Base de datos
  check_database
  ((errors+=$?))
  echo "----------------------------------------"
  
  # 3. Servicios
  check_services
  ((errors+=$?))
  echo "----------------------------------------"
  
  # 4. Logs
  check_logs
  ((errors+=$?))
  echo "----------------------------------------"
  
  # 5. Backups
  check_backups
  ((errors+=$?))
  echo "----------------------------------------"
  
  # 6. Rendimiento
  check_performance
  ((errors+=$?))
  echo "----------------------------------------"
  
  # Generar reporte
  generate_health_report
  
  # Resumen
  if [ $errors -eq 0 ]; then
    success "✨ Sistema saludable"
  else
    warn "⚠️ Se encontraron $errors problemas"
  fi
  
  cat << EOF

${BLUE}Próximos pasos:${NC}
1. Revisar el reporte detallado
2. Solucionar problemas encontrados
3. Programar mantenimiento si es necesario

${BLUE}Para más información:${NC}
$ cat health_reports/latest.md
EOF
}

# Crear directorio para logs
mkdir -p health_logs

# Ejecutar verificación
LOG_FILE="health_logs/health_$(date '+%Y%m%d_%H%M%S').log"

{
  main
} 2>&1 | tee "$LOG_FILE"

# Crear enlace al último reporte
ln -sf "$(ls -t health_reports/health_*.md | head -1)" health_reports/latest.md

exit ${PIPESTATUS[0]}