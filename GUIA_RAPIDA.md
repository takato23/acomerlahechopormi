# Guía Rápida - Sistema de Recetas

## 1. Instalación Rápida

### Instalación Completa
```bash
# Instalar todo el sistema
sudo ./setup.sh

# Verificar instalación
./verify_installation_complete.sh
```

### Corrección de Errores
```bash
# Corregir problemas automáticamente
./fix_system.sh

# Verificar imports
./verify_imports.sh
```

### Monitoreo
```bash
# Ver estado del sistema
./health_check.sh

# Configurar monitoreo
./setup_monitoring.sh
```

## 2. Solución de Problemas Comunes

### Error: "The requested module does not provide an export named 'default'"
```bash
# Ejecutar corrección automática
./fix_recipe_exports.sh

# O manualmente:
1. Revisa src/features/recipes/services/recipeService.ts
2. Agrega "export default" al servicio
3. Reinicia el servidor
```

### Error: "Failed to load resource"
```bash
# Limpiar caché y reconstruir
npm run clean
npm run build

# O usar script de mantenimiento
./maintenance.sh --clean
```

### Error: "Type ... is not assignable to type"
```bash
# Verificar tipos
./verify_imports.sh

# Corregir automáticamente
./fix_system.sh --types
```

## 3. Comandos de Mantenimiento

### Backups
```bash
# Crear backup manual
./recipe_system.sh backup --create

# Restaurar backup
./recipe_system.sh backup --restore <fecha>

# Listar backups
./recipe_system.sh backup --list
```

### Optimización
```bash
# Limpiar sistema
./maintenance.sh --clean

# Optimizar DB
./maintenance.sh --optimize

# Verificar rendimiento
./benchmark_performance.sh
```

### Monitoreo
```bash
# Estado actual
./health_check.sh

# Monitoreo en vivo
./monitor_system.sh --live

# Ver últimos logs
tail -f logs/system.log
```

## 4. Estructura de Archivos

### Scripts Principales
```
├── setup.sh                    # Instalador principal
├── fix_system.sh              # Corrección automática
├── health_check.sh            # Verificación de salud
└── monitor_system.sh          # Sistema de monitoreo
```

### Logs y Reportes
```
├── logs/                      # Logs del sistema
├── monitoring_logs/           # Logs de monitoreo
├── security_logs/            # Logs de seguridad
└── reports/                  # Reportes generados
```

### Backups
```
└── backups/
    ├── daily/                # Backups diarios
    ├── weekly/              # Backups semanales
    └── monthly/             # Backups mensuales
```

## 5. Variables de Entorno

### Configuración Básica
```bash
SUPABASE_URL=tu_url
SUPABASE_KEY=tu_key
DB_HOST=tu_host
DB_USER=tu_usuario
DB_NAME=tu_base
```

### Configuración Avanzada
```bash
LOG_LEVEL=debug
MONITORING_INTERVAL=15
BACKUP_RETENTION=30
```

## 6. Tareas Programadas

### Monitoreo
```bash
# Cada 15 minutos
*/15 * * * * /usr/local/bin/health_check.sh

# Reporte diario
0 0 * * * /usr/local/bin/monitor_system.sh --report
```

### Mantenimiento
```bash
# Backup diario
0 0 * * * /usr/local/bin/recipe_system.sh backup --create

# Limpieza semanal
0 0 * * 0 /usr/local/bin/maintenance.sh --clean
```

## 7. Problemas Conocidos

### Error de Importación
- **Síntoma**: Error de exportación por defecto
- **Solución**: Ejecutar `./fix_recipe_exports.sh`
- **Prevención**: Usar `verify_imports.sh` antes de commits

### Error de Tipos
- **Síntoma**: Errores de TypeScript
- **Solución**: Ejecutar `./fix_system.sh --types`
- **Prevención**: Configurar pre-commit hooks

### Error de Rendimiento
- **Síntoma**: Lentitud en la aplicación
- **Solución**: Ejecutar `./maintenance.sh --optimize`
- **Prevención**: Monitoreo regular con `health_check.sh`

## 8. Enlaces Útiles

### Documentación
- `SISTEMA_COMPLETO.md`: Documentación detallada
- `IMPLEMENTACION.md`: Detalles técnicos
- `COMANDOS.md`: Lista completa de comandos

### Monitoreo
- http://localhost:5173/monitor  # Dashboard local
- http://localhost:5173/status   # Estado del sistema
- http://localhost:5173/logs     # Visor de logs

### Soporte
- GitHub Issues: Para reportar problemas
- Wiki: Para documentación adicional
- Slack: Para soporte en tiempo real

## 9. Tips y Trucos

### Alias Útiles
```bash
# Agregar al .bashrc
alias rs='./recipe_system.sh'
alias fix='./fix_system.sh'
alias health='./health_check.sh'
alias monitor='./monitor_system.sh --live'
```

### Atajos de Teclado
```
CTRL+C  # Cancelar operación
CTRL+L  # Limpiar pantalla
CTRL+D  # Salir de monitoreo
```

### Comandos Rápidos
```bash
# Verificación rápida
./health_check.sh --quick

# Corrección rápida
./fix_system.sh --quick

# Backup rápido
./recipe_system.sh backup --quick