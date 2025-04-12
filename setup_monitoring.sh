#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log() { echo -e "${BLUE}[MONITOR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar sudo
check_sudo() {
  if [ "$(id -u)" != "0" ]; then
    error "Este script debe ejecutarse con sudo"
    exit 1
  fi
}

# Configurar alertas por email
setup_email_alerts() {
  log "Configurando alertas por email..."
  
  read -p "Email para alertas: " alert_email
  
  # Crear script de alerta
  cat > /usr/local/bin/recipe-alert << EOF
#!/bin/bash
SUBJECT="\$1"
MESSAGE="\$2"
echo "\$MESSAGE" | mail -s "Recipe System Alert: \$SUBJECT" $alert_email
EOF
  
  chmod +x /usr/local/bin/recipe-alert
  success "Script de alertas configurado"
}

# Configurar monitoreo periódico
setup_monitoring_cron() {
  log "Configurando monitoreo periódico..."
  
  # Verificación cada 15 minutos
  echo "*/15 * * * * /usr/local/bin/recipe-system verify --quick >/dev/null 2>&1" | crontab -
  
  # Health check cada hora
  echo "0 * * * * $PWD/health_check.sh >/dev/null 2>&1" | crontab -
  
  # Backup diario
  echo "0 0 * * * $PWD/recipe_system.sh backup --create >/dev/null 2>&1" | crontab -
  
  success "Monitoreo periódico configurado"
}

# Crear dashboard de monitoreo
create_monitoring_dashboard() {
  log "Creando dashboard de monitoreo..."
  
  mkdir -p /var/www/recipe-monitor
  
  # Crear página de dashboard
  cat > /var/www/recipe-monitor/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Recipe System Monitor</title>
  <meta http-equiv="refresh" content="60">
  <style>
    body { font-family: sans-serif; margin: 20px; }
    .status { padding: 10px; margin: 5px; border-radius: 5px; }
    .ok { background: #dff0d8; }
    .warn { background: #fcf8e3; }
    .error { background: #f2dede; }
  </style>
</head>
<body>
  <h1>Recipe System Monitor</h1>
  <div id="status"></div>
  <script>
    function updateStatus() {
      fetch('/api/system-status')
        .then(r => r.json())
        .then(data => {
          document.getElementById('status').innerHTML = \`
            <div class="status \${data.disk_status}">
              Espacio en disco: \${data.disk_space}
            </div>
            <div class="status \${data.db_status}">
              Base de datos: \${data.db_health}
            </div>
            <div class="status \${data.backup_status}">
              Último backup: \${data.last_backup}
            </div>
          \`;
        });
    }
    updateStatus();
    setInterval(updateStatus, 60000);
  </script>
</body>
</html>
EOF

  success "Dashboard creado en /var/www/recipe-monitor"
}

# Configurar recolección de métricas
setup_metrics() {
  log "Configurando recolección de métricas..."
  
  mkdir -p /var/log/recipe-metrics
  
  # Script de métricas
  cat > /usr/local/bin/collect-metrics << EOF
#!/bin/bash
LOG_FILE="/var/log/recipe-metrics/\$(date '+%Y%m%d').log"

# Métricas del sistema
df -h | grep "/" >> "\$LOG_FILE"
free -h >> "\$LOG_FILE"
uptime >> "\$LOG_FILE"

# Métricas de la aplicación
psql -h "\$DB_HOST" -U "\$DB_USER" -d "\$DB_NAME" << SQL >> "\$LOG_FILE"
  SELECT 
    COUNT(*) as total_recipes,
    COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as recent_updates,
    COUNT(*) FILTER (WHERE is_public = true) as public_recipes
  FROM recipes;
SQL
EOF
  
  chmod +x /usr/local/bin/collect-metrics
  
  # Programar recolección
  echo "*/5 * * * * /usr/local/bin/collect-metrics >/dev/null 2>&1" | crontab -
  
  success "Recolección de métricas configurada"
}

# Configurar limpieza automática
setup_cleanup() {
  log "Configurando limpieza automática..."
  
  # Script de limpieza
  cat > /usr/local/bin/recipe-cleanup << EOF
#!/bin/bash

# Limpiar logs antiguos
find /var/log/recipe-metrics -type f -mtime +30 -delete
find health_logs -type f -mtime +7 -delete
find logs -type f -mtime +14 -delete

# Limpiar backups antiguos
find backups -type f -mtime +90 -delete

# Optimizar base de datos
psql -h "\$DB_HOST" -U "\$DB_USER" -d "\$DB_NAME" -c "VACUUM ANALYZE;"
EOF
  
  chmod +x /usr/local/bin/recipe-cleanup
  
  # Programar limpieza semanal
  echo "0 0 * * 0 /usr/local/bin/recipe-cleanup >/dev/null 2>&1" | crontab -
  
  success "Limpieza automática configurada"
}

# Función principal
main() {
  log "Configurando sistema de monitoreo..."
  echo "----------------------------------------"
  
  # 1. Verificar sudo
  check_sudo
  echo "----------------------------------------"
  
  # 2. Configurar alertas
  setup_email_alerts
  echo "----------------------------------------"
  
  # 3. Configurar cron
  setup_monitoring_cron
  echo "----------------------------------------"
  
  # 4. Crear dashboard
  create_monitoring_dashboard
  echo "----------------------------------------"
  
  # 5. Configurar métricas
  setup_metrics
  echo "----------------------------------------"
  
  # 6. Configurar limpieza
  setup_cleanup
  echo "----------------------------------------"
  
  success "¡Sistema de monitoreo configurado!"
  
  cat << EOF

${BLUE}Sistema de monitoreo configurado:${NC}
✓ Alertas por email
✓ Verificación automática
✓ Dashboard web
✓ Recolección de métricas
✓ Limpieza automática

${BLUE}Verificaciones programadas:${NC}
- Cada 15 minutos: Verificación rápida
- Cada hora: Health check
- Diario: Backup automático
- Semanal: Limpieza

${BLUE}Para acceder al dashboard:${NC}
http://localhost/recipe-monitor

${BLUE}Para ver métricas:${NC}
$ tail -f /var/log/recipe-metrics/\$(date '+%Y%m%d').log

${YELLOW}No olvides:${NC}
1. Verificar las alertas de email
2. Revisar el dashboard periódicamente
3. Monitorear el espacio en disco
EOF
}

# Crear log
mkdir -p monitoring_setup_logs
LOG_FILE="monitoring_setup_logs/setup_$(date '+%Y%m%d_%H%M%S').log"

# Ejecutar configuración
{
  main
} 2>&1 | tee "$LOG_FILE"

exit ${PIPESTATUS[0]}