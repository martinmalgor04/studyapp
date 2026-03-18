# CI/CD & Deployment Specification

**Plataforma:** Vercel  
**Estado:** Main en producción  
**Estimación:** 3-4 horas

---

## 1. Objetivo

Automatizar el proceso de CI/CD con GitHub Actions para:
- Validar código en cada PR (lint + tests)
- Build automático antes de merge
- Deploy automático a Vercel en merge a main
- Evitar romper producción con código que no pasa tests
- Desarrollo seguro en rama `develop` con staging local

---

## 2. Git Flow Strategy

### 2.1 Estructura de Ramas

```
main (producción - Vercel)
  ↑
  │ merge via PR
  │
develop (desarrollo - local)
  ↑
  │ merge via PR
  │
feature/* (features individuales - local)
```

**Ramas principales:**

| Rama | Propósito | Deploy | Protección |
|------|-----------|--------|------------|
| `main` | **Producción** | Vercel automático | ✅ Branch protection |
| `develop` | **Desarrollo** | Local (staging) | ⚠️ Opcional |
| `feature/*` | Features individuales | Local | ❌ |

### 2.2 Flujo de Trabajo

```
1. Crear feature desde develop:
   git checkout develop
   git pull origin develop
   git checkout -b feature/nueva-funcionalidad

2. Desarrollar y testear localmente:
   pnpm dev          # Next.js local
   pnpm supabase:start  # Supabase local (staging)
   pnpm test         # Tests
   git commit -m "feat: agregar nueva funcionalidad"

3. Push y PR a develop:
   git push origin feature/nueva-funcionalidad
   # Crear PR: feature/nueva-funcionalidad → develop
   # GitHub Actions valida: lint + tests + build

4. Merge a develop:
   # Una vez aprobado el PR
   git checkout develop
   git pull origin develop

5. Testear en staging local:
   pnpm dev  # Verificar que todo funciona en conjunto

6. PR a main (producción):
   git checkout develop
   git push origin develop
   # Crear PR: develop → main
   # GitHub Actions valida + Vercel preview deployment

7. Deploy a producción:
   # Merge del PR → Vercel deploys automáticamente
```

---

## 3. Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  feature/*  │  │   develop   │  │     main    │         │
│  │   (local)   │→ │   (local)   │→ │ (producción)│         │
│  └─────────────┘  └─────────────┘  └──────┬──────┘         │
└────────────────────────────────────────────┼────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────┐
                    │                                       │
                    ▼                                       ▼
           ┌────────────────┐                    ┌──────────────────┐
           │ GitHub Actions │                    │ Vercel Production│
           │ - Lint         │                    │ (auto-deploy)    │
           │ - Test (unit)  │                    └──────────────────┘
           │ - Build verify │
           └────────────────┘
```

### 3.1 Ambientes

| Ambiente | Rama | Database | Deploy | URL |
|----------|------|----------|--------|-----|
| **Desarrollo** | `feature/*` | Supabase local | Manual | `localhost:3000` |
| **Staging** | `develop` | Supabase local | Manual | `localhost:3000` |
| **Producción** | `main` | Supabase Cloud | Automático (Vercel) | `studyapp.vercel.app` |

---

## 4. Setup Inicial de Ramas

### 4.1 Crear Rama Develop

**Primera vez (si no existe):**

```bash
# Desde main (en producción)
git checkout main
git pull origin main

# Crear develop desde main
git checkout -b develop
git push -u origin develop
```

### 4.2 Protección de Ramas en GitHub

**Settings → Branches → Add rule:**

#### Reglas para `main`:

```yaml
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1 (para producción)
  ☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required checks:
    - Lint
    - Unit Tests
    - Build Check

☑ Require conversation resolution before merging
☐ Require linear history (opcional)
☑ Do not allow bypassing the above settings
```

#### Reglas para `develop` (opcional pero recomendado):

```yaml
Branch name pattern: develop

☑ Require a pull request before merging
  ☑ Require approvals: 0 (más flexible)

☑ Require status checks to pass before merging
  Required checks:
    - Lint
    - Unit Tests
    - Build Check

☐ Require conversation resolution before merging
```

---

## 5. Flujo de Trabajo Detallado

### 5.1 Desarrollar Nueva Feature

```bash
# 1. Asegurar que develop está actualizado
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/telegram-notifications

# 3. Desarrollar localmente
pnpm dev  # Next.js en localhost:3000
pnpm supabase:start  # Supabase local (staging database)

# 4. Hacer commits
git add .
git commit -m "feat: implementar notificaciones telegram"

# 5. Push de la feature
git push -u origin feature/telegram-notifications
```

### 5.2 PR a Develop (Staging Local)

```bash
# En GitHub: Crear Pull Request
# Base: develop ← Compare: feature/telegram-notifications
```

**GitHub Actions ejecuta automáticamente:**
1. ✅ Install dependencies
2. ✅ Lint check (`pnpm lint`)
3. ✅ Unit tests (`pnpm test:unit`)
4. ✅ Build verification (`pnpm build`)

**Resultado:**
- ✅ PR aprobado si todo pasa → merge a `develop`
- ❌ PR bloqueado si falla algún check

### 5.3 Testing en Staging Local (Develop)

```bash
# Después del merge a develop
git checkout develop
git pull origin develop

# Verificar en local con Supabase local
pnpm supabase:start  # Si no está corriendo
pnpm dev

# Testear manualmente:
# - Funcionalidad nueva
# - Regresiones
# - Integración con features existentes
```

**Checklist antes de pasar a producción:**
- [ ] Features nuevas funcionan correctamente
- [ ] No hay regresiones en features existentes
- [ ] Tests unitarios pasando
- [ ] Tests E2E pasando (si aplica)
- [ ] No hay warnings/errors en consola
- [ ] Rendimiento aceptable

### 5.4 PR a Main (Producción)

```bash
# Cuando develop está estable y listo
# En GitHub: Crear Pull Request
# Base: main ← Compare: develop
```

**GitHub Actions ejecuta:**
- ✅ Todos los checks (lint + tests + build)

**Vercel genera:**
- 🔍 Preview deployment automático
- URL temporal: `https://studyapp-pr-XXX.vercel.app`
- Permite verificar antes de merge

**Verificación final:**
1. Revisar preview deployment de Vercel
2. Verificar que usa Supabase Cloud (producción)
3. Testing rápido en preview
4. Aprobar PR

### 5.5 Deploy a Producción

```bash
# Merge del PR develop → main
# En GitHub: Click en "Merge pull request"
```

**Vercel ejecuta automáticamente:**
1. 🔨 Build de producción
2. 🚀 Deploy a producción
3. 🌐 URL: `https://studyapp.vercel.app`
4. 📧 Notificación de deploy (email/Slack si está configurado)

---

## 6. Comandos Útiles

### 6.1 Sincronizar Develop con Main

```bash
# Cuando main avanzó (ej: hotfix directo)
git checkout develop
git pull origin main
git push origin develop
```

### 6.2 Limpiar Ramas Feature Mergeadas

```bash
# Ver ramas locales
git branch

# Eliminar rama local
git branch -d feature/nombre-feature

# Eliminar rama remota
git push origin --delete feature/nombre-feature

# Limpiar referencias obsoletas
git fetch --prune
```

### 6.3 Revertir Cambios en Develop

```bash
# Si algo salió mal en develop
git checkout develop
git revert <commit-hash>
git push origin develop
```

### 6.4 Hotfix Directo a Main (Emergencia)

```bash
# Solo en caso de bug crítico en producción
git checkout main
git pull origin main
git checkout -b hotfix/nombre-del-bug

# Fix rápido
git commit -m "hotfix: corregir bug crítico"
git push -u origin hotfix/nombre-del-bug

# PR directo a main (bypass de develop por emergencia)
# Después: sincronizar develop con main
git checkout develop
git pull origin main
git push origin develop
```

---

## 7. GitHub Actions Workflows

### 7.1 Archivo: `.github/workflows/ci.yml`

Pipeline para validar PRs a `develop` y `main`:

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]  # Se ejecuta en PRs a estas ramas
  push:
    branches: [main, develop]  # Se ejecuta en push directo (raro)

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run ESLint
        run: pnpm lint

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: false

  build:
    name: Build Check
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build project
        run: pnpm build
        env:
          # Usar valores dummy para build en CI
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  # Opcional: E2E tests (comentado por ahora)
  # e2e:
  #   name: E2E Tests
  #   runs-on: ubuntu-latest
  #   
  #   services:
  #     postgres:
  #       image: supabase/postgres:15.1.0.117
  #       env:
  #         POSTGRES_PASSWORD: postgres
  #       options: >-
  #         --health-cmd pg_isready
  #         --health-interval 10s
  #         --health-timeout 5s
  #         --health-retries 5
  #   
  #   steps:
  #     - uses: actions/checkout@v4
  #     
  #     - name: Setup pnpm
  #       uses: pnpm/action-setup@v2
  #       with:
  #         version: 8
  #     
  #     - name: Setup Node.js
  #       uses: actions/setup-node@v4
  #       with:
  #         node-version: '20'
  #         cache: 'pnpm'
  #     
  #     - name: Install dependencies
  #       run: pnpm install --frozen-lockfile
  #     
  #     - name: Install Playwright browsers
  #       run: pnpm exec playwright install --with-deps chromium
  #     
  #     - name: Run E2E tests
  #       run: pnpm test:e2e
  #       env:
  #         DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
```

### 7.2 Archivo: `.github/workflows/codeql.yml` (Opcional - Seguridad)

Análisis de seguridad automatizado:

```yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Lunes a medianoche

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    
    permissions:
      actions: read
      contents: read
      security-events: write
    
    strategy:
      fail-fast: false
      matrix:
        language: ['javascript']
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

---

## 8. Configuración de Vercel

### 8.1 Configuración Actual

**Branch principal en Vercel:**

```
Production Branch: main
- Auto-deploy: ✅ Enabled
- URL: https://studyapp.vercel.app
```

**Preview deployments:**
```
Branches: All branches (PR previews)
- Ejemplo: develop → https://studyapp-git-develop.vercel.app
- PRs: feature/* → https://studyapp-pr-123.vercel.app
```

Vercel detecta automáticamente:
- Framework: Next.js
- Build command: `pnpm build`
- Output directory: `.next`
- Install command: `pnpm install`

### 8.2 Variables de Entorno en Vercel

**Dashboard → Settings → Environment Variables:**

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Telegram (cuando esté listo)
TELEGRAM_BOT_TOKEN=123456789:ABCdef...

# Analytics (futuro)
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx
```

### 8.3 Preview Deployments

Vercel crea automáticamente preview deployments:

| Tipo | Trigger | URL | Database |
|------|---------|-----|----------|
| **Production** | Merge a `main` | `studyapp.vercel.app` | Supabase Cloud |
| **Preview (develop)** | Push a `develop` | `studyapp-git-develop.vercel.app` | Supabase Cloud |
| **Preview (PR)** | PR a `main` | `studyapp-pr-123.vercel.app` | Supabase Cloud |

**Nota:** Previews también usan Supabase Cloud (mismo que producción). Para testing aislado, usar Supabase local en desarrollo.

### 8.4 Build Settings en `vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
```

---

## 9. Ambientes de Testing

### 9.1 Local (Development)

```bash
# Database: Supabase local
pnpm supabase:start  # PostgreSQL en Docker

# Environment
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# Testing
pnpm test:unit       # Unit tests
pnpm test:e2e        # E2E tests (con DB local)
```

### 9.2 Staging (Develop Branch Local)

```bash
# Database: Supabase local (mismo setup)
pnpm supabase:start

# Testing integración
pnpm dev  # Verificar features mergeadas juntas

# Antes de PR a main
pnpm test:all  # Unit + E2E
pnpm build     # Verificar build
```

### 9.3 Production (Main Branch)

```bash
# Database: Supabase Cloud
# Deploy: Vercel automático

# Monitoring
# - Vercel Dashboard: logs y analytics
# - Supabase Dashboard: DB queries
```

---

## 10. GitHub Repository Settings

### 10.1 Secrets Necesarios

**Settings → Secrets and variables → Actions:**

| Secret | Valor | Uso |
|--------|-------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://localhost:54321` | Build en CI |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (dummy) | Build en CI |

**Nota:** Estos son valores dummy para que el build pase en CI. Los valores reales están en Vercel.

---

## 11. Deploy Manual (Emergency)

Si Vercel falla o necesitas deploy manual:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login (primera vez)
vercel login

# Deploy a producción
vercel --prod

# Deploy a preview
vercel
```

---

## 12. Monitoreo Post-Deploy

### 12.1 Vercel Dashboard

**Deployment → Logs:**
- Build logs
- Function logs
- Edge logs

**Analytics (gratis):**
- Web Vitals (LCP, FID, CLS)
- Real user monitoring
- Top pages

### 12.2 Healthcheck Endpoint (futuro)

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient();
    const { error } = await supabase.from('subjects').select('count').limit(1);
    
    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

---

## 13. Rollback Strategy

### 13.1 Via Vercel Dashboard

1. Ir a **Deployments**
2. Encontrar deployment anterior estable
3. Click en "•••" → **Promote to Production**
4. Confirmar

**Tiempo de rollback:** ~30 segundos

### 13.2 Via Git

```bash
# Revertir commit problemático
git revert <commit-hash>
git push origin main

# O resetear a commit anterior (más drástico)
git reset --hard <commit-hash>
git push --force origin main  # ⚠️ Cuidado en equipo
```

---

## 14. Performance Optimization

### 14.1 Build Cache

Vercel cachea:
- `node_modules` entre builds
- `.next/cache` (Next.js build cache)
- Resultados de instalación

**Invalidar cache:**
```bash
# En Vercel Dashboard
Settings → General → Clear Cache
```

### 14.2 Edge Functions (futuro)

Mover APIs críticas a Edge Runtime:

```typescript
// src/app/api/sessions/route.ts
export const runtime = 'edge';  // Ejecutar en edge en vez de Node.js
```

---

## 15. Checklist de Implementación

### Setup Inicial
- [x] Proyecto deployado en Vercel
- [x] Main branch en producción
- [ ] Crear rama `develop`
- [ ] GitHub Actions configurado
- [ ] Branch protection rules activos (main + develop)
- [ ] Secrets de GitHub configurados

### Git Flow
- [ ] Crear rama `develop` desde `main`
- [ ] Configurar protección en `main` (require PR + checks)
- [ ] Configurar protección en `develop` (opcional)
- [ ] Documentar flujo en README

### Workflows
- [ ] Crear `.github/workflows/ci.yml`
- [ ] Crear `.github/workflows/codeql.yml` (opcional)
- [ ] Test workflow: PR a develop
- [ ] Test workflow: PR develop → main
- [ ] Verificar que PRs se bloqueen si fallan checks

### Vercel
- [x] Environment variables configuradas
- [x] Production branch: `main`
- [x] Preview deployments habilitados
- [ ] Notificaciones configuradas (Discord/Slack opcional)

### Documentación
- [ ] Actualizar README con badges de CI
- [ ] Documentar Git Flow (main/develop/feature)
- [ ] Documentar comandos útiles
- [ ] Documentar rollback procedure

### Ambientes
- [x] Local: Supabase local funcionando
- [ ] Staging: Develop branch con testing local
- [x] Production: Main → Vercel + Supabase Cloud

### Monitoring (futuro)
- [ ] Setup Vercel Analytics
- [ ] Crear endpoint `/api/health`
- [ ] Configurar alertas (uptime monitor)

---

## 16. Badges para README

```markdown
# StudyApp

[![CI](https://github.com/tu-usuario/studyapp/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/studyapp/actions/workflows/ci.yml)
[![Deployment](https://img.shields.io/github/deployments/tu-usuario/studyapp/production?label=vercel&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/github/license/tu-usuario/studyapp)](LICENSE)
```

---

**Tiempo estimado:** 3-4 horas  
**Bloqueadores:** Ninguno (Vercel ya configurado, main en producción)  

**Beneficios del Git Flow:**
- ✅ `main` siempre estable (producción)
- ✅ `develop` para integración antes de producción
- ✅ Testing en staging local antes de deploy
- ✅ PRs revisables con checks automáticos
- ✅ Historial limpio y trazable
- ✅ Rollback fácil si algo sale mal

**Próximos Pasos:**
1. Crear rama `develop` desde `main`
2. Configurar branch protection rules
3. Crear primer feature desde `develop`
4. Testear flujo completo: feature → develop → main
