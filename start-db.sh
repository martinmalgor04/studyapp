#!/bin/bash

# ================================
# Iniciar solo PostgreSQL en Docker
# ================================

set -e

echo "🐘 Iniciando PostgreSQL en Docker..."
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "   Inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

# Detener Supabase local si está corriendo
if command -v supabase &> /dev/null; then
    echo "🛑 Deteniendo Supabase local (si está corriendo)..."
    supabase stop 2>/dev/null || true
    echo ""
fi

# Iniciar solo la DB
echo "🚀 Iniciando PostgreSQL..."
docker-compose -f docker-compose.db.yml up -d

echo ""
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 3

# Verificar estado
if docker-compose -f docker-compose.db.yml ps | grep -q "Up"; then
    echo ""
    echo "✅ PostgreSQL iniciado correctamente"
    echo ""
    echo "📊 Conexión:"
    echo "   Host:     localhost"
    echo "   Puerto:   5433"
    echo "   Usuario:  postgres"
    echo "   Password: postgres"
    echo "   Database: studyapp"
    echo ""
    echo "🌐 Adminer (DB UI): http://localhost:8080"
    echo ""
    echo "🔗 Connection String:"
    echo "   postgresql://postgres:postgres@localhost:5433/studyapp"
    echo ""
    echo "▶️  Ahora ejecutá: pnpm dev"
else
    echo ""
    echo "❌ Error al iniciar PostgreSQL"
    echo "   Ver logs: docker-compose -f docker-compose.db.yml logs"
    exit 1
fi
