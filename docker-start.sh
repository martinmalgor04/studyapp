#!/bin/bash

# ================================
# StudyApp - Dev Start
# ================================
# Inicia Supabase local (Docker) y Next.js (pnpm dev)

set -e

echo "🚀 StudyApp Dev Setup"
echo "====================="
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "   Inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

echo "✅ Docker está corriendo"

# Verificar que pnpm esté disponible
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado"
    exit 1
fi

echo "✅ pnpm disponible"

# Verificar que .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local no existe — copiando desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "   Editá .env.local con tus keys reales"
    else
        echo "❌ Error: tampoco existe .env.example"
        exit 1
    fi
fi

echo "✅ .env.local encontrado"
echo ""

# Preguntar qué hacer
echo "¿Qué querés hacer?"
echo "  1) Iniciar todo (Supabase + Next.js)"
echo "  2) Solo Supabase"
echo "  3) Solo Next.js (Supabase ya corriendo)"
echo "  4) Detener Supabase"
echo "  5) Reset DB (supabase db reset)"
echo "  6) Estado de Supabase"
echo ""
read -p "Opción (1-6): " option

case $option in
    1)
        echo ""
        echo "📦 Iniciando Supabase..."
        npx supabase start
        echo ""
        echo "✅ Supabase corriendo"
        echo "   API:    http://localhost:54321"
        echo "   Studio: http://localhost:54323"
        echo ""
        echo "🚀 Iniciando Next.js..."
        echo ""
        pnpm dev
        ;;
    2)
        echo ""
        echo "📦 Iniciando Supabase..."
        npx supabase start
        echo ""
        echo "✅ Supabase corriendo"
        echo "   API:    http://localhost:54321"
        echo "   Studio: http://localhost:54323"
        ;;
    3)
        echo ""
        echo "🚀 Iniciando Next.js..."
        echo ""
        pnpm dev
        ;;
    4)
        echo ""
        echo "🛑 Deteniendo Supabase..."
        npx supabase stop
        echo "✅ Supabase detenido"
        ;;
    5)
        echo ""
        echo "⚠️  Esto resetea la DB local (aplica migrations + seed)"
        read -p "¿Estás seguro? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            npx supabase db reset
            echo "✅ DB reseteada"
        else
            echo "❌ Cancelado"
        fi
        ;;
    6)
        echo ""
        echo "📊 Estado de Supabase:"
        npx supabase status
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac
