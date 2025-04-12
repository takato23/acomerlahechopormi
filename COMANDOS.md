# Comandos Frecuentes - Sistema de Recetas

## 1. Instalación

### Instalación Completa
```bash
# Instalar todo el sistema
sudo ./install.sh

# Verificar instalación
./verify_installation_complete.sh
```

### Instalación Rápida
```bash
# Instalación mínima
./quick_install.sh --minimal

# Instalación con monitoreo
./quick_install.sh --monitor
```

### Instalación Manual
```bash
# 1. Configurar ambiente
./setup_environment.sh

# 2. Instalar sistema
./recipe_system.sh install

# 3. Verificar
./verify_checklist.sh
```

## 2. Gestión de Recetas

### Operaciones Básicas
```bash
# Listar recetas
recipe-system recipes list

# Crear receta
recipe-system recipes add

# Editar receta
recipe-system recipes edit <id>

# Eliminar receta
recipe-system recipes delete <id>
```

### Gestión de Ingredientes
```bash
# Agregar ingrediente
recipe-system ingredients add <recipe_id>

# Actualizar ingrediente
recipe-system ingredients update <id>

# Eliminar ingrediente
recipe-system ingredients delete <id>
```

### Favoritos y Etiquetas
```bash
# Marcar favorito
recipe-system recipes favorite <id>

# Agregar etiqueta
recipe-system recipes tag <id> <tag>

# Listar por etiqueta
recipe-system recipes list --tag <tag>
```

## 3. Mantenimiento

### Monitoreo
```bash
# Estado actual
recipe-system monitor status

# Monitoreo en vivo
recipe-system monitor --live

# Generar reporte
recipe-system monitor --report
```

### Backups
```bash
# Crear backup
recipe-system backup --create

# Listar backups
recipe-system backup --list

# Restaurar backup
recipe-system backup --restore <backup_id>
```

### Optimización
```bash
# Optimizar tablas
recipe-system maintain --optimize

# Limpiar datos antiguos
recipe-system maintain --clean

# Actualizar estadísticas
recipe-system maintain --analyze
```

## 4. Verificación

### Verificaciones Rápidas
```bash
# Verificar estado
recipe-system verify

# Verificar estructura
recipe-system verify --structure

# Verificar datos
recipe-system verify --data
```

### Pruebas
```bash
# Pruebas completas
recipe-system test --all

# Pruebas funcionales
recipe-system test --functional

# Pruebas de rendimiento
recipe-system test --performance
```

## 5. Actualizaciones

### Actualización Segura
```bash
# Actualizar sistema
recipe-system update

# Actualización forzada
recipe-system update --force

# Rollback
recipe-system update --rollback
```

### Mantenimiento
```bash
# Verificar versión
recipe-system --version

# Limpiar caché
recipe-system maintain --clean-cache

# Regenerar índices
recipe-system maintain --reindex
```

## 6. Logs y Diagnóstico

### Logs
```bash
# Ver logs recientes
recipe-system logs show

# Ver errores
recipe-system logs --errors

# Exportar logs
recipe-system logs export
```

### Diagnóstico
```bash
# Diagnóstico completo
recipe-system diagnose

# Verificar conexión
recipe-system diagnose --connection

# Verificar permisos
recipe-system diagnose --permissions
```

## 7. Desinstalación

### Desinstalación Segura
```bash
# Desinstalar sistema
sudo ./uninstall.sh

# Desinstalar sin confirmación
sudo ./uninstall.sh --force

# Desinstalar manteniendo datos
sudo ./uninstall.sh --keep-data
```

## 8. Desarrollo

### Git Hooks
```bash
# Verificar antes de commit
./validate_project.sh

# Ejecutar pruebas
./test_functionality.sh

# Verificar rendimiento
./benchmark_performance.sh
```

## 9. Tips Útiles

### Alias Recomendados
```bash
# Agregar al .bashrc
alias rs='recipe-system'
alias rs-monitor='recipe-system monitor --live'
alias rs-backup='recipe-system backup --create'
alias rs-status='recipe-system verify'
```

### Variables de Entorno
```bash
# Configuración básica
export RECIPE_SYSTEM_HOME=/path/to/install
export RECIPE_SYSTEM_ENV=production

# Desarrollo
export RECIPE_SYSTEM_DEBUG=true
export RECIPE_SYSTEM_LOG_LEVEL=debug
```

### Atajos de Teclado
```
CTRL+C          Cancelar operación actual
CTRL+D          Salir de monitoreo en vivo
CTRL+L          Limpiar pantalla
CTRL+R          Recargar configuración
```

## 10. Solución de Problemas

### Problemas Comunes
```bash
# Reiniciar sistema
recipe-system restart

# Limpiar caché
recipe-system cache clear

# Verificar permisos
recipe-system verify --permissions
```

### Recuperación
```bash
# Modo seguro
recipe-system --safe-mode

# Restaurar configuración
recipe-system config --restore

# Reparar sistema
recipe-system repair