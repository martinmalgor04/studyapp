#!/bin/bash

# ================================
# StudyApp - Docker Quick Start
# ================================

set -e

echo "🐳 StudyApp Docker Setup"
echo "========================="
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "   Inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

echo "✅ Docker está corriendo"

# Verificar que .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local no existe"
    echo "   Crea el archivo .env.local con tus variables de entorno"
    exit 1
fi

echo "✅ .env.local encontrado"
echo ""

# Preguntar qué hacer
echo "¿Qué quieres hacer?"
echo "  1) Iniciar servicios (primera vez)"
echo "  2) Iniciar servicios (ya construidos)"
echo "  3) Detener servicios"
echo "  4) Reset completo (¡CUIDADO! Borra la DB local)"
echo "  5) Ver logs"
echo "  6) Ver estado"
echo ""
read -p "Opción (1-6): " option

case $option in
    1)
        echo ""
        echo "📦 Construyendo e iniciando servicios..."
        docker-compose up -d --build
        echo ""
        echo "✅ Servicios iniciados"
        echo ""
        echo "🌐 Aplicación: http://localhost:3000"
        echo "🗄️  Adminer:    http://localhost:8080"
        echo "💾 PostgreSQL: localhost:54322 (postgres/postgres)"
        echo ""
        echo "Ver logs: docker-compose logs -f app"
        ;;
    2)
        echo ""
        echo "🚀 Iniciando servicios..."
        docker-compose up -d
        echo ""
        echo "✅ Servicios iniciados"
        echo ""
        echo "🌐 Aplicación: http://localhost:3000"
        echo "🗄️  Adminer:    http://localhost:8080"
        echo ""
        echo "Ver logs: docker-compose logs -f app"
        ;;
    3)
        echo ""
        echo "🛑 Deteniendo servicios..."
        docker-compose stop
        echo "✅ Servicios detenidos"
        ;;
    4)
        echo ""
        echo "⚠️  ADVERTENCIA: Esto eliminará todos los datos de la DB local"
        read -p "¿Estás seguro? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "🗑️  Eliminando todo..."
            docker-compose down -v
            echo "✅ Reset completo"
        else
            echo "❌ Cancelado"
        fi
        ;;
    5)
        echo ""
        echo "📄 Mostrando logs (Ctrl+C para salir)..."
        docker-compose logs -f app
        ;;
    6)
        echo ""
        echo "📊 Estado de servicios:"
        docker-compose ps
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac
