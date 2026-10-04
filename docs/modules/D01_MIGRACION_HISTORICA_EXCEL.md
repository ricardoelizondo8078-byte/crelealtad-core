# D01 — Migración histórica desde Excel

## 1. Identidad

- Nombre oficial: Migración histórica desde Excel
- Código: D01
- Estado: parcial funcional
- Responsable operativo: Administración de datos con validación de Operación
- Roles usuarios: proceso técnico de carga; sus resúmenes grupales se consumen por ASESOR en Renovación

## 2. Objetivo y resultado observable

- Problema que resuelve: el Excel continúa como fuente operativa hasta la salida del app y cada semana cambia el corte que finalmente deberá migrarse.
- Resultado esperado: validar y cargar cortes grupales e integrantes históricos de forma trazable e idempotente, conservando cada integrante y monto autorizado en el expediente de su ciclo.
- Indicadores de éxito: cero relaciones huérfanas, conteo y suma individual exactos por ciclo, una sola base activa por fuente y segunda ejecución sin duplicados.

## 3. Alcance

### Incluye

- Hoja `BASE DE DATOS`, encabezado en fila 11.
- Bloque histórico semanal y bloque lateral de ciclos vigentes.
- Grupos, ciclos grupales agregados, comportamiento semanal y asesora responsable.
- SHA-256 del archivo, manifiesto, incidencias y cortes inmutables.
- Prevalidación contra grupos, usuarios y empleados de la base destino.
- Creación explícita de grupos faltantes cuando se usa `--crear-grupos`.
- Carga transaccional, activación controlada e idempotencia por hash del archivo.
- Segundo contrato para `BASEDATOS CRELEALTAD`: último ciclo inequívoco, persona existente, integrante única, conteo exacto y suma de montos igual al préstamo grupal.
- Expediente histórico fuente por ciclo elegible, con integrantes y `solicitudes.monto_autorizado`.

### No incluye

- Creación de créditos individuales, solicitudes o ciclos transaccionales de `creditos`/`ciclos`.
- Inferir que un ciclo no vigente está liquidado.
- Fusionar nombres semejantes, erratas o préstamos personales sin decisión operativa.
- Borrar datos ficticios ni definir todavía el corte limpio de producción.

## 4. Flujo operativo

1. Operación entrega una copia cerrada del Excel vigente.
2. El validador calcula hash, revisa estructura y extrae los dos bloques.
3. Se consolida cada llave externa `# GPO + CICLO` y se preservan sus semanas.
4. Se compara el conjunto `GRUPO VIGENTE=1` con el resumen lateral.
5. Se generan `manifest.json`, `ciclos.json`, `semanas.json` e `incidencias.json` fuera de Git.
6. Se respalda la base destino y se aplica la migración aditiva de esquema.
7. La prevalidación resuelve grupos y asesoras; ambigüedades o faltantes no autorizados bloquean.
8. La carga inserta el corte completo en una transacción.
9. Se verifican conteos, FKs y datos vigentes; después se activa el corte.
10. Repetir el mismo archivo devuelve la importación existente y no duplica filas.
11. El contrato individual relaciona sólo los últimos ciclos determinísticos y deja bloqueadas las diferencias para reconciliación.
12. Cada ciclo elegible crea un expediente histórico fuente sin `asesora_id`, sus integrantes y solicitudes con `monto_autorizado`.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| `importaciones_excel.archivo_sha256` | Archivo | Sí | SHA-256 único por tipo | Sí |
| `historial_grupos_ciclos.clave_origen` | `# GPO + CICLO` | Sí | Única dentro del corte | Sí |
| `grupo_id` | Nombre exacto normalizado | Sí | Una coincidencia o alta explícita | Sí |
| `asesora_id` | `ASESOR` → abreviatura | No | Alias versionado y empleado existente | Sí |
| `vigente_en_corte` | `GRUPO VIGENTE` | Sí | Verdadero solo cuando vale 1 | Sí |
| métricas semanales | Bloque histórico | Según fuente | Conversión numérica y fila trazable | Sí |
| `expedientes.ciclo_historico_origen_id` | ciclo grupal activo | Sí para expediente fuente | único y mismo `grupo_id` | Sí |
| `integrantes.persona_id` | CURP mapeada | Sí | persona existente y no repetida en ciclo | Sí |
| `solicitudes.monto_autorizado` | `MONTO` individual | Sí | positivo; suma exacta igual a `prestamo` | Sí |

`NOMBRE CONTACTO` y `TEL. CONTACTO` no se exportan a los artefactos de esta fase.

## 6. Estados y transiciones

| Estado | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| VALIDADO | Validador | Contrato sin errores | Carga | Incidencias ERROR |
| CARGADO | Migrador | Transacción confirmada | Activación | Conteos/FKs incorrectos |
| ACTIVO | Administrador de datos | Validación posterior | Nuevo corte activo | Solo uno por fuente |
| RECHAZADO | Validador | Error de contrato | Corrección del Excel | No se carga |

Estos estados pertenecen al proceso de importación, no al ciclo financiero.

## 7. Pantallas

La carga continúa siendo CLI y no otorga permisos nuevos. La pantalla T1 `Renovación`, especificada en `M02_RENOVACION_GRUPOS.md`, consume en sólo lectura el último ciclo de los grupos asignados al asesor.

## 8. API y persistencia

- Endpoints de carga: ninguno. Consumo posterior: `GET /renovaciones/grupos` y `POST /renovaciones/grupos/:grupoId` en M02-R.
- Servicios: `MIGRACION_COMPLETA/scripts/historico/` y `scripts/historico-individual/`.
- Tablas: `importaciones_excel`, `historial_grupos_ciclos`, `historial_grupos_ciclos_semanas`, `expedientes`, `integrantes`, `solicitudes` y `audit_log`.
- Idempotencia: `UNIQUE(tipo_fuente, archivo_sha256)`.
- Auditoría: manifiesto JSONB, archivo/hash, filas de origen, hash semántico y fecha de activación.
- La capa histórica no escribe en `creditos` ni en `ciclos`, porque esas tablas representan desembolso real y crédito individual.

## 9. Reglas de negocio

- Se conserva el historial; no se borra ni sobrescribe un corte anterior.
- `GRUPO VIGENTE=1` significa crédito grupal vivo en el corte.
- Un valor distinto de 1 no autoriza a asignar estado `LIQUIDADO`.
- La asesora es responsabilidad del ciclo importado; no se deriva de `grupos.created_by`.
- Las variantes de nombre se conservan como fuente hasta aprobar un catálogo de equivalencias.
- Ninguna diferencia individual se completa por inferencia: ciclo ambiguo, persona o monto no resueltos, conteo o suma distintos permanecen bloqueados.
- Los expedientes históricos fuente no reciben `asesora_id`; alimentan Renovación, pero no aparecen en la bandeja personal del asesor.

## 10. Permisos y seguridad

| Acción | Rol | Condición | Auditoría |
|---|---|---|---|
| Validar archivo | Operador técnico autorizado | Acceso local al archivo | Manifiesto e incidencias |
| Cargar corte | Administrador de datos | `--aplicar`, base explícita y respaldo | Importación y transacción |
| Activar corte | Administrador de datos | Verificación posterior | `activated_at` |

## 11. Estados técnicos de UI

No aplica. La CLI devuelve código distinto de cero ante rechazo.

## 12. Casos especiales

- Duplicados: mismo hash es idempotente; una llave repetida en resumen vigente es error.
- Datos incompletos: faltantes críticos bloquean; `OFNA` se conserva con `asesora_id=NULL` y advertencia.
- Reintentos: una transacción fallida hace rollback completo.
- Concurrencia: el índice parcial garantiza una sola base activa por fuente.
- Grupos faltantes: solo se crean con `--crear-grupos`; nombres ambiguos siempre bloquean.

## 13. Criterios de aceptación

- [x] Archivo SEM 366 validado sin errores de contrato.
- [x] 299 vigentes coinciden con los 299 del resumen lateral.
- [x] Carga íntegra verificada en `crelealtad_test`.
- [x] Segunda carga del mismo archivo no duplica información.
- [x] Consulta grupal conectada a API/mobile con alcance por último ciclo asignado.
- [x] Respaldo completo verificado antes de aplicar en `crelealtad`.
- [x] Contrato de integrantes diseñado, probado y cargado para 276 últimos ciclos exactos.
- [x] 1,594 integrantes y solicitudes históricas cargadas sin diferencias de conteo o suma.
- [x] Segunda carga individual idempotente: 276 expedientes reutilizados y cero filas duplicadas.
- [ ] Ensayo final sobre una base limpia clonada del esquema de producción.

## 14. Pruebas

- Unitarias: workbook sintético, alias de asesora, consolidación y comparación de vigentes.
- Integración: esquema y reversión en `crelealtad_test`; carga individual completa simulada con rollback antes de aplicarse en `crelealtad`.
- Manuales: revisión de manifiesto e incidencias.
- Regresión: TypeScript del paquete de migración e idempotencia contra PostgreSQL.

## 15. Decisiones abiertas

- Regla verificable para concluir que un ciclo histórico está `LIQUIDADO`.
- Catálogo aprobado para equivalencias de nombres de grupo.
- Reconciliación operativa de los 193 últimos ciclos bloqueados: 2 ambiguos, 81 sin fuente, 101 con persona o monto no resuelto, 7 con conteo distinto y 2 con suma distinta.
- Estrategia final para retirar datos ficticios: base limpia recomendada frente a clasificación/borrado controlado.
