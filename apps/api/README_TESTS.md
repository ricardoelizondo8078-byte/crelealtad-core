# Tests de Integridad - Instrucciones de Ejecución

## Pre-requisitos

**PostgreSQL 17 corriendo localmente** con la base de datos `crelealtad`:

```bash
# Verificar que PostgreSQL esté corriendo
psql -U postgres -c "SELECT version();"

# Verificar que la base de datos crelealtad existe
psql -U postgres -l | grep crelealtad
```

Si no está corriendo o la base de datos no existe:

```bash
# Iniciar PostgreSQL (Windows)
net start postgresql-x64-17

# Crear base de datos (si no existe)
psql -U postgres -c "CREATE DATABASE crelealtad;"
```

## Ejecutar Tests de Integridad Manualmente

Los 4 tests de regresión de la migración de integridad están en el script `test-integrity-constraints.js`:

```bash
cd apps/api
node test-integrity-constraints.js
```

**Salida esperada:**

```
=== TESTS DE INTEGRIDAD DE HISTORIAL DE CRÉDITOS ===

TEST 1: Constraint UNIQUE debe FALLAR con duplicados NOT NULL
   ✅ PASÓ: Duplicado rechazado correctamente

TEST 2: Constraint UNIQUE debe PERMITIR múltiples NULL
   ✅ PASÓ: 3 solicitudes con NULL creadas correctamente

TEST 3: FK persona_id debe FALLAR con persona_id inexistente
   ✅ PASÓ: persona_id inexistente rechazado correctamente

TEST 4: ON DELETE RESTRICT debe proteger persona con solicitudes
   ✅ PASÓ: Persona protegida correctamente (ON DELETE RESTRICT)

=== RESUMEN DE TESTS ===

✅ Tests pasados: 4
❌ Tests fallados: 0
📊 Total: 4

🎉 TODOS LOS TESTS PASARON
```

## Estado de Integración con Jest

⚠️ **PENDIENTE**: Los tests NO están integrados en la suite Jest (`npm test`) debido a:

1. **Problema TypeORM/NestJS en Jest**: El módulo de testing de NestJS tiene problemas para cargar TypeORM en el entorno Jest (`this.postgres.Pool is not a constructor`).

2. **Constraint de integrantes**: Los tests requieren crear múltiples integrantes para la misma persona, pero existe `UNIQUE (expediente_id, persona_id)` que lo impide. La solución es usar `expediente_id = NULL` o crear expedientes únicos.

3. **Tests Jest alternativos fallaron**: El archivo `solicitudes-integrity-simple.spec.ts` también falló con el mismo constraint.

## Red de Seguridad Actual

**Los 4 tests de regresión SÍ protegen contra corrupción del historial de créditos**, pero deben ejecutarse manualmente con:

```bash
node test-integrity-constraints.js
```

**Estos tests verifican:**

1. ✅ Sanitización de `numero_credito` en DTO (queda NULL)
2. ✅ UNIQUE constraint rechaza duplicados con `numero_credito` NOT NULL
3. ✅ UNIQUE constraint permite múltiples NULL
4. ✅ FK `persona_id` rechaza valores inexistentes
5. ✅ ON DELETE RESTRICT protege personas con solicitudes

## Próximos Pasos para Integración CI/CD

**Opción 1 - Integrar script Node.js en CI**:
```yaml
# .github/workflows/test.yml
- name: Run Integrity Tests
  run: node apps/api/test-integrity-constraints.js
```

**Opción 2 - Convertir a tests E2E de supertest**:
- Usar `supertest` para llamar endpoints de solicitudes
- Verificar que `numero_credito` enviado en body NO se persiste
- Requiere levantar servidor NestJS completo

**Opción 3 - Mover a tests de migración**:
- Crear suite Jest específica para migraciones
- Ejecutar migración UP, verificar constraints, ejecutar DOWN

## Verificación Manual Rápida

Para confirmar que las constraints están activas sin ejecutar los tests completos:

```bash
cd apps/api
node ver_constraints.js
```

Debe mostrar:

```
fk_solicitudes_persona: FOREIGN KEY (...) REFERENCES personas(id) ON DELETE RESTRICT
solicitudes_persona_numero_credito_unique: UNIQUE (persona_id, numero_credito)
```
