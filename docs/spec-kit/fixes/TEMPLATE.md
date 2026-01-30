# X.Y.Z - [Título del Fix]

**Fecha**: DD MMM YYYY  
**Sprint**: X.Y - [Nombre del Sprint]  
**Severidad**: 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low  
**Módulo**: [Nombre del módulo]  
**Tiempo de resolución**: ~XX min

---

## Síntoma

[Descripción clara del error o problema observado]

Ejemplo:
> Error en runtime: `TypeError: undefined is not an object (evaluating 'session.subject.name')`
> Las sesiones se mostraban pero crasheaban al intentar acceder a datos relacionados.

---

## Hipótesis Generadas

1. **H1**: [Primera hipótesis sobre la causa]
2. **H2**: [Segunda hipótesis]
3. **H3**: [Tercera hipótesis]
4. **H4**: [Cuarta hipótesis] (opcional)
5. **H5**: [Quinta hipótesis] (opcional)

---

## Instrumentación

Logs agregados en:
- `[archivo]:[línea]` - [Descripción de qué se loguea]
- `[archivo]:[línea]` - [Descripción]

**Payload structure**:
```json
{
  "location": "file.ts:line",
  "message": "descripción",
  "data": { "key": "value" },
  "hypothesisId": "H1"
}
```

---

## Evidencia de Logs

```json
[Logs capturados relevantes]
```

**Análisis**:
- **H1**: CONFIRMADA | RECHAZADA | INCONCLUSA - [Razón basada en logs]
- **H2**: CONFIRMADA | RECHAZADA | INCONCLUSA - [Razón]
- **H3**: ...

---

## Causa Raíz

[Explicación técnica detallada del problema]

Ejemplo:
> La sintaxis del `.select()` de Supabase estaba listando cada campo individualmente,
> lo que impedía que los JOINs funcionaran correctamente.

---

## Solución

### Código Antes

```typescript
// ❌ CÓDIGO INCORRECTO
[código que causaba el problema]
```

### Código Después

```typescript
// ✅ CÓDIGO CORREGIDO
[código que soluciona el problema]
```

### Explicación

[Por qué la solución funciona]

---

## Archivos Modificados

- [`path/to/file1.ts`](../../src/path/to/file1.ts) - [Qué se cambió]
- [`path/to/file2.tsx`](../../src/path/to/file2.tsx) - [Qué se cambió]

---

## Testing

- [ ] Unit tests actualizados/agregados
- [ ] E2E tests verificados
- [ ] Manual testing completado
- [ ] Logs post-fix analizados

**Resultados**:
```
[Resultado de tests o verificación manual]
```

---

## Impacto

- **Usuarios afectados**: Todos | Solo nuevos usuarios | Solo feature X
- **Scope**: [Descripción del alcance]
- **Downtime**: ~XX minutos
- **Regresiones**: Ninguna | [Descripción si aplica]

---

## Lecciones Aprendidas

1. [Lección técnica o de proceso]
2. [Otra lección]
3. [Buena práctica identificada]

**Para evitar en el futuro**:
- [Acción preventiva 1]
- [Acción preventiva 2]

---

## Referencias

- Issue/PR: #XX (si aplica)
- Documentación relacionada: [link]
- Commits: `abc123`, `def456`

---

_Documentado por: [Nombre]_  
_Revisado por: [Nombre] (opcional)_
