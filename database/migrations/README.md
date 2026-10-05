# Migraciones canónicas

Esta carpeta es la única cadena ejecutable de cambios de esquema de CRELEALTAD CORE.

## Convención

- Migración directa: `NNN_descripcion.sql`.
- Reversión revisada: `NNN_descripcion.rollback.sql`.
- Cada secuencia `NNN` es única.
- Los archivos directos deben estar envueltos por `BEGIN;` y `COMMIT;`.
- Una migración aplicada no se edita: su SHA-256 está registrado en `public.schema_migrations`.

Los SQL ubicados en `apps/api/src/migrations`, `migraciones` y los archivos cuyo nombre
comienza con `migration_` son artefactos históricos. No se ejecutan para modificar el esquema
vigente. Si una regla todavía fuera necesaria, debe convertirse en una nueva migración canónica
incremental y revisada.

## Comandos oficiales

Desde la raíz del repositorio:

```powershell
npm run db:migrations:status -- --database=crelealtad_test
npm run db:migrations:status -- --database=crelealtad
```

Para aplicar hasta una secuencia, primero se prueba en `crelealtad_test`. El comando exige que
`MIGRATION_APPLY_CONFIRM` coincida exactamente con la base indicada:

```powershell
$env:MIGRATION_APPLY_CONFIRM = 'crelealtad_test'
npm run db:migrations:apply -- --database=crelealtad_test --through=NNN
```

`baseline` sólo registra migraciones que ya están representadas en un esquema verificado. No
ejecuta SQL y exige `MIGRATION_BASELINE_CONFIRM` con el nombre exacto de la base.

## Base automatizada de pruebas

`npm --prefix apps/api run test:setup` reconstruye exclusivamente `crelealtad_test` desde el
dump verificado y registra el catálogo completo como `BASELINE`. Por ser destructivo requiere:

```powershell
$env:TEST_DB_RESET_CONFIRM = 'crelealtad_test'
npm --prefix apps/api run test:setup
```

Nunca se usa ese comando contra `crelealtad`.

Para ejecutar toda la API sin depender de una contraseña local ni de filas precargadas, el entorno
Windows de desarrollo puede levantar un PostgreSQL 17 desechable en un puerto aleatorio:

```powershell
npm --prefix apps/api run test:isolated
```

El comando carga únicamente `database/schema-dump.sql`, ejecuta las suites y elimina el clúster
temporal aun cuando falle una prueba. Si PostgreSQL está instalado en otra ubicación, se indica su
carpeta `bin` mediante `POSTGRES_BIN`. Este mecanismo no conecta con `crelealtad` ni con una base
externa.
