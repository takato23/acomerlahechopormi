# Variables
SHELL := /bin/bash
.DEFAULT_GOAL := help

# Colores
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
BLUE   := $(shell tput -Txterm setaf 4)
RESET  := $(shell tput -Txterm sgr0)

# Funciones de ayuda
define log
	@echo "${BLUE}[LOG]${RESET} $(1)"
endef

define success
	@echo "${GREEN}[OK]${RESET} $(1)"
endef

define warn
	@echo "${YELLOW}[WARN]${RESET} $(1)"
endef

.PHONY: help install setup fix verify monitor test backup clean all

## Mostrar ayuda
help:
	@echo "Sistema de Recetas - Comandos Disponibles"
	@echo "========================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-30s$(RESET) %s\n", $$1, $$2}'

## Instalar sistema completo
install: ## Instalar sistema completo
	$(call log,Iniciando instalación...)
	@chmod +x *.sh
	@./autoconfigure.sh
	$(call success,Sistema instalado)

## Configurar ambiente
setup: ## Configurar ambiente
	$(call log,Configurando ambiente...)
	@./setup.sh
	$(call success,Ambiente configurado)

## Corregir problemas
fix: ## Corregir problemas
	$(call log,Corrigiendo sistema...)
	@./fix_system.sh
	$(call success,Sistema corregido)

## Verificar sistema
verify: ## Verificar sistema
	$(call log,Verificando sistema...)
	@./verify_installation_complete.sh
	$(call success,Verificación completada)

## Monitorear sistema
monitor: ## Monitorear sistema
	$(call log,Iniciando monitoreo...)
	@./monitor_system.sh

## Ejecutar pruebas
test: ## Ejecutar pruebas
	$(call log,Ejecutando pruebas...)
	@./run_tests.sh
	$(call success,Pruebas completadas)

## Crear backup
backup: ## Crear backup
	$(call log,Creando backup...)
	@./recipe_system.sh backup --create
	$(call success,Backup creado)

## Limpiar sistema
clean: ## Limpiar sistema
	$(call log,Limpiando sistema...)
	@./maintenance.sh --clean
	$(call success,Sistema limpiado)

## Instalar todo y verificar
all: install verify ## Instalar todo y verificar
	$(call success,Sistema completamente instalado y verificado)

# Comandos de desarrollo
.PHONY: dev lint format check

## Iniciar modo desarrollo
dev: ## Iniciar modo desarrollo
	$(call log,Iniciando modo desarrollo...)
	@npm run dev

## Ejecutar linter
lint: ## Ejecutar linter
	$(call log,Ejecutando linter...)
	@npm run lint

## Formatear código
format: ## Formatear código
	$(call log,Formateando código...)
	@npm run format

## Verificar tipos
check: ## Verificar tipos
	$(call log,Verificando tipos...)
	@npm run type-check

# Comandos de base de datos
.PHONY: db-backup db-restore db-clean db-optimize

## Backup de base de datos
db-backup: ## Backup de base de datos
	$(call log,Creando backup de base de datos...)
	@./recipe_system.sh backup --create
	$(call success,Backup completado)

## Restaurar base de datos
db-restore: ## Restaurar base de datos
	$(call log,Restaurando base de datos...)
	@./recipe_system.sh backup --restore
	$(call success,Restauración completada)

## Limpiar base de datos
db-clean: ## Limpiar base de datos
	$(call log,Limpiando base de datos...)
	@./maintenance.sh --clean-db
	$(call success,Base de datos limpiada)

## Optimizar base de datos
db-optimize: ## Optimizar base de datos
	$(call log,Optimizando base de datos...)
	@./maintenance.sh --optimize
	$(call success,Base de datos optimizada)

# Comandos de monitoreo
.PHONY: monitor-live monitor-report monitor-setup

## Monitoreo en vivo
monitor-live: ## Monitoreo en vivo
	$(call log,Iniciando monitoreo en vivo...)
	@./monitor_system.sh --live

## Generar reporte de monitoreo
monitor-report: ## Generar reporte de monitoreo
	$(call log,Generando reporte...)
	@./monitor_system.sh --report
	$(call success,Reporte generado)

## Configurar monitoreo
monitor-setup: ## Configurar monitoreo
	$(call log,Configurando monitoreo...)
	@./setup_monitoring.sh
	$(call success,Monitoreo configurado)

# Comandos de pruebas
.PHONY: test-all test-quick test-perf test-security

## Ejecutar todas las pruebas
test-all: ## Ejecutar todas las pruebas
	$(call log,Ejecutando todas las pruebas...)
	@./run_tests.sh --all
	$(call success,Pruebas completadas)

## Pruebas rápidas
test-quick: ## Pruebas rápidas
	$(call log,Ejecutando pruebas rápidas...)
	@./run_tests.sh --quick
	$(call success,Pruebas rápidas completadas)

## Pruebas de rendimiento
test-perf: ## Pruebas de rendimiento
	$(call log,Ejecutando pruebas de rendimiento...)
	@./run_tests.sh --performance
	$(call success,Pruebas de rendimiento completadas)

## Pruebas de seguridad
test-security: ## Pruebas de seguridad
	$(call log,Ejecutando pruebas de seguridad...)
	@./run_tests.sh --security
	$(call success,Pruebas de seguridad completadas)