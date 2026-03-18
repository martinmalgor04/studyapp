.PHONY: help docker-up docker-down docker-restart docker-logs docker-shell docker-clean

# ================================
# StudyApp - Makefile
# ================================

help: ## Muestra esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ----------------
# Docker
# ----------------
docker-up: ## Iniciar todos los servicios
	docker-compose up -d
	@echo ""
	@echo "✅ Servicios iniciados"
	@echo "🌐 App:      http://localhost:3000"
	@echo "🗄️  Adminer:  http://localhost:8080"
	@echo "💾 Postgres: localhost:54322"

docker-build: ## Construir e iniciar servicios
	docker-compose up -d --build

docker-down: ## Detener todos los servicios
	docker-compose down

docker-restart: ## Reiniciar todos los servicios
	docker-compose restart

docker-logs: ## Ver logs en tiempo real
	docker-compose logs -f app

docker-shell: ## Acceder a shell del contenedor
	docker-compose exec app sh

docker-clean: ## Limpiar todo (¡CUIDADO! Borra DB local)
	docker-compose down -v
	docker image prune -a -f

docker-status: ## Ver estado de servicios
	docker-compose ps

# ----------------
# Database
# ----------------
db-shell: ## Conectarse a PostgreSQL
	docker-compose exec db psql -U postgres

db-backup: ## Hacer backup de la DB
	docker-compose exec db pg_dump -U postgres postgres > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup creado"

db-restore: ## Restaurar backup (uso: make db-restore FILE=backup.sql)
	docker-compose exec -T db psql -U postgres postgres < $(FILE)

# ----------------
# App
# ----------------
install: ## Instalar dependencias en el contenedor
	docker-compose exec app pnpm install

lint: ## Ejecutar linter
	docker-compose exec app pnpm lint

test: ## Ejecutar tests
	docker-compose exec app pnpm test

build: ## Build de producción
	docker-compose exec app pnpm build

# ----------------
# Development
# ----------------
dev: ## Iniciar en modo desarrollo (no-Docker)
	pnpm dev

dev-docker: docker-up ## Iniciar con Docker

# ----------------
# Cleanup
# ----------------
clean-cache: ## Limpiar cache de Next.js
	docker-compose exec app rm -rf .next
	docker-compose restart app

# ----------------
# Desarrollo Híbrido (pnpm dev + DB Docker)
# ----------------
db-start: ## Iniciar solo PostgreSQL en Docker
	docker-compose -f docker-compose.db.yml up -d
	@echo ""
	@echo "✅ PostgreSQL iniciado"
	@echo "🔗 postgresql://postgres:postgres@localhost:5433/studyapp"
	@echo "🌐 Adminer: http://localhost:8080"
	@echo ""
	@echo "▶️  Ejecutá: pnpm dev"

db-stop: ## Detener PostgreSQL
	docker-compose -f docker-compose.db.yml stop

db-restart: ## Reiniciar PostgreSQL
	docker-compose -f docker-compose.db.yml restart db

db-logs: ## Ver logs de PostgreSQL
	docker-compose -f docker-compose.db.yml logs -f db

db-shell: ## Conectarse a PostgreSQL (psql)
	docker-compose -f docker-compose.db.yml exec db psql -U postgres -d studyapp

db-reset: ## Reset completo de PostgreSQL (¡CUIDADO!)
	docker-compose -f docker-compose.db.yml down -v
	docker-compose -f docker-compose.db.yml up -d
	@echo "✅ PostgreSQL reseteado con migrations aplicadas"

db-status: ## Ver estado de PostgreSQL
	docker-compose -f docker-compose.db.yml ps
