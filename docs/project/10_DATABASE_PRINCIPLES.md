# 10 Database Principles — Principios de Base de Datos

Versión: 2.14.0
Estado: Vigente y verificado
Fecha de auditoría: 2026-10-04

## Principios

1. PostgreSQL es la fuente de verdad operacional.
2. Llaves UUID para interoperabilidad e identidad estable.
3. Integridad referencial explícita.
4. Historial crítico inviolable y eliminación restringida.
5. Políticas operativas fuera de hardcode.
6. Estados de negocio gobernados por contratos canónicos.
7. Cambios de esquema mediante migraciones incrementales; `synchronize: false`.
8. PostgreSQL define los nombres de campo para DTO, entity, API y frontend de datos.

## Plataforma verificada

- Motor: PostgreSQL 17.10.
- Base local: `crelealtad`.
- Esquema operativo: `public`.
- Tablas base: 50.
- Vistas: 1 (`solicitudes_completo`).
- Índices: 181.
- Llaves primarias: 50.
- Llaves foráneas: 96.
- Restricciones UNIQUE: 47.
- Restricciones CHECK explícitas: 97.
- Row Level Security activo: 0 tablas.
- Triggers en esquema público: 0.

## Inventario de tablas por dominio

### Identidad, organización y acceso

- `personas`
- `usuarios`
- `roles`
- `empleados`
- `empleados_contacto`
- `empleados_datos_laborales`
- `empleados_documentos`
- `empleados_domicilios`
- `sucursales`
- `zonas`

### Originación y expediente

- `grupos`
- `expedientes`
- `integrantes`
- `solicitudes`
- `solicitudes_datos_personales`
- `solicitudes_domicilios`
- `solicitudes_negocios`
- `solicitudes_referencias`
- `solicitudes_beneficiarios`
- `solicitudes_validaciones`
- `solicitudes_documentos`

### Crédito y operación financiera

- `productos_credito`
- `creditos`
- `ciclos`
- `calendario_pagos`
- `pagos`
- `mora`
- `reestructuras`
- `caja_movimientos`

### Catálogos, auditoría y soporte

- `codigos_postales`
- `audit_log`
- `verificacion_llamadas`
- `verificacion_llamada_encuestas`
- `verificacion_llamada_caracteristicas`
- `verificacion_llamada_evidencias`
- `verificacion_visita_vecino_fachadas`
- `verificacion_visita_vecino_evidencias`
- `verificacion_visitas_vecino`
- `verificacion_imagenes_domicilio`
- `verificacion_entrevistas`
- `verificacion_entrevista_familiares`
- `verificacion_entrevista_desacuerdos_montos`
- `verificacion_entrevista_evidencias`
- `backup_tesoreras_20260802`

### Importación e historial grupal

- `importaciones_excel`
- `historial_grupos_ciclos`
- `historial_grupos_ciclos_semanas`

Estas tablas conservan cortes agregados del Excel y no sustituyen los registros transaccionales de `ciclos` y `creditos`.

## Relación ciclo–expediente

- Un expediente puede existir sin ciclo durante documentación, verificación y análisis.
- Todo ciclo canónico requiere `expediente_id`, porque nace únicamente durante el desembolso real.
- Un expediente puede originar como máximo un ciclo.
- `ciclos.expediente_id` y `ciclos.grupo_id` referencian conjuntamente al mismo expediente y grupo; la base rechaza cruces entre grupos.
- La relación usa `ON DELETE RESTRICT` para conservar trazabilidad.

El monto individual efectivamente prestado en un ciclo vive en `solicitudes.monto_autorizado`. `personas.monto_solicitado` sigue siendo únicamente un dato prospectivo de captación.

## Tesorera de Verificación y tesorera definitiva

- `expedientes.tesorera_integrante_id` registra la participante seleccionada por Documentación para recibir las preguntas adicionales de Verificación.
- La FK compuesta `(expedientes.id, expedientes.tesorera_integrante_id) → integrantes(expediente_id, id)` impide referencias entre expedientes; la condición `SUJETA_CREDITO` se revalida en la API.
- La selección, el cambio y la desasignación por retiro se registran en `audit_log` y no borran información histórica.
- `ciclos.tesorera_id` seguirá representando a la persona definitiva al momento del desembolso real.
- Si Desembolsos sustituye a la tesorera, debe auditar el cambio, conservar la selección histórica del expediente y continuar sin regresar a Verificación.

Para ciclos importados aún no materializados en `ciclos`, el expediente histórico fuente usa `expedientes.ciclo_historico_origen_id`, único y validado junto con `grupo_id`. Sus integrantes y solicitudes permanecen en las tablas canónicas; no existe una tabla paralela de integrantes históricos. El expediente fuente carece de `asesora_id` para no incorporarse a la bandeja personal del asesor.

`backup_tesoreras_20260802` es una tabla de respaldo operativo y no debe considerarse entidad canónica del dominio.

## Solicitudes normalizadas

La estructura vigente y cerrada usa:

- `solicitudes` como core.
- Siete tablas hijas por `solicitud_id`.
- UPSERT por `solicitud_id` en las hijas.
- Vista `solicitudes_completo` para consultas resumidas.
- Relaciones TypeORM para armar el detalle completo.

`solicitudes.monto_solicitado_confirmado_at` permanece `NULL` cuando el monto sólo fue precargado como referencia. La API asigna la fecha al recibir la captura explícita del asesor; así, igualdad con el monto anterior no se confunde con aceptación automática.

## Participación por expediente

- `integrantes.estado` incluye `RETIRADA` como estado de participación en un expediente, no como baja de persona.
- `motivo_retiro`, `motivo_retiro_detalle`, `retirada_at` y `retirada_por` conservan el contexto vigente del retiro.
- Checks exigen motivo/actor/fecha en `RETIRADA`, limpian ese contexto al reintegrar y requieren detalle sólo para `OTRO`.
- `retirada_por` referencia `usuarios(id)` con `ON DELETE RESTRICT`.
- La migración incremental 011 es idempotente; su rollback se niega a eliminar el esquema si ya existe historial de retiros.

Las cinco FK críticas de `solicitudes` hacia persona, expediente, grupo, crédito e integrante usan `ON DELETE RESTRICT`. Las tablas hijas usan `ON DELETE CASCADE` exclusivamente por dependencia directa del registro core.

## Acceso y permisos

- `usuarios.rol_id` referencia `roles.id` con `ON DELETE RESTRICT`.
- `usuarios.abreviatura` es el identificador de login para asesores y tiene índice UNIQUE case-insensitive sobre `UPPER(abreviatura)`.
- `usuarios.password_hash` almacena el hash bcrypt del PIN; nunca el PIN en texto plano.
- `usuarios.requiere_cambio_pin` identifica credenciales temporales pendientes de sustitución.
- `usuarios.email` es nullable para permitir asesores sin correo de acceso.
- `audit_log.usuario_id` y `grupos.created_by` referencian `usuarios.id` con `ON DELETE RESTRICT`; `grupos.created_by` usa UUID y permanece nullable para historia sin actor atribuible.
- `roles.permisos` almacena JSONB con módulos y acciones iniciales.
- `usuarios.permisos_personalizados` almacena, sólo cuando existe una excepción individual autorizada, el conjunto efectivo que sustituye los permisos del rol sin cambiar `usuarios.rol_id`.
- La migración 035 exige que ambos contratos tengan objeto, arreglos y elementos textuales; la API filtra contra un catálogo único y deniega por defecto cualquier valor desconocido.
- No existe tabla puente `usuarios_roles`; el modelo vigente asigna un rol por usuario.
- No existen tablas separadas `permisos` o `rol_permisos`.
- La API evalúa los permisos JSONB mediante un guard global. Para `ASESOR`, también valida por recurso la cadena `usuario → empleado → expediente` en grupos, expedientes, integrantes, solicitudes y documentos. La matriz funcional completa y el alcance por sucursal/zona continúan pendientes de aprobación e implementación.
- DEC-023 agrega temporalmente `verificacion:leer` al rol `ASESOR` mediante la migración 010, con registro antes/después en `audit_log` y rollback condicionado; no sustituye la matriz restrictiva definitiva requerida antes de producción.
- No hay RLS activo; el alcance por sucursal/zona debe implementarse y probarse antes de producción.

## Integridad de estados cerrados

- La migración 036 agrega `CHECK` validados para `roles`, `usuarios`, `personas`, `productos_credito`, `creditos`, `ciclos` y `pagos` usando únicamente catálogos ya cerrados.
- `creditos.estado` inicia en `BORRADOR` y `pagos.estado` en `PENDIENTE`; el backend debe ejecutar y auditar toda transición, no aceptar selección arbitraria desde la UI.
- `grupos`, `expedientes`, mora, reestructura/convenio y las tres validaciones `SI/NO` de solicitud no recibieron restricciones nuevas porque su correspondencia funcional exacta continúa abierta o contiene valores legacy. No se inventó una migración de datos.

## Auditoría

Estado actual:

- Existe tabla `audit_log`.
- 45 relaciones entre tablas/vista exponen `created_at` en metadatos; 28 exponen `updated_at`.
- Solo una tabla contiene `created_by`.
- Ninguna tabla contiene `updated_by`.
- No existen triggers públicos para poblar auditoría.
- La API escribe `audit_log` para login exitoso, altas de grupo/expediente e integrante, campos modificados de integrante/solicitud, documentos confirmados, inicio de renovación, handoff a Verificación, retiro, cambio de motivo, reintegro y otras acciones ya enlazadas; la cobertura transversal continúa incompleta.
- Los eventos de captura nuevos conservan nombres de campos y contexto operativo, sin duplicar valores personales en la bitácora.
- `verificacion_llamadas` funciona como bitácora operativa inmutable de intentos: conserva integrante, canal, resultado declarado, actor, fecha/hora, latitud, longitud, precisión horizontal opcional, fecha/hora de lectura y fuente `DISPOSITIVO`, con idempotencia por actor para impedir duplicados por reintento. Las coordenadas son obligatorias para escrituras nuevas mediante API; los intentos históricos permanecen íntegros con campos nulos.
- `verificacion_llamada_encuestas` conserva una respuesta estructurada por intento contestado; `verificacion_llamada_caracteristicas` normaliza las seis coincidencias y `verificacion_llamada_evidencias` mantiene metadatos, SHA-256 y ruta protegida del archivo externo.
- `verificacion_visitas_vecino` es la bitácora inmutable de la confirmación combinada `¿La conoce? ¿Sabe dónde vive?`: conserva integrante, respuesta booleana, actor, fecha, idempotencia, latitud, longitud, precisión horizontal opcional, fecha/hora de lectura y fuente `DISPOSITIVO`. Las migraciones 018 y 019 están aplicadas; la API guarda en transacción la fila y un evento de auditoría sin coordenadas, y el resumen obtiene la respuesta más reciente.
- `verificacion_visita_vecino_fachadas` conserva los metadatos de cada fotografía de fachada y su ubicación, mientras el archivo vive en almacenamiento protegido. La migración 020 agrega además `verificacion_visitas_vecino.fachada_id`; la API exige la fachada más reciente para toda respuesta nueva y preserva con `NULL` únicamente las filas históricas previas.
- `verificacion_visita_vecino_evidencias` conserva cada fotografía posterior a la pregunta, ligada por FK restrictiva a la respuesta concreta. La migración 021 mantiene metadatos, hash, actor, idempotencia y ubicación; el archivo queda protegido fuera de PostgreSQL y la API sólo admite evidencias para la respuesta más reciente.
- `verificacion_imagenes_domicilio` conserva el historial de las cuatro clases técnicas de captura del domicilio. Las migraciones 022 y 023 relacionan cada fila con integrante y usuario mediante FKs restrictivas, limitan el tipo, formato, tamaño, hash, fuente y rango geográfico, e impiden duplicados de reintento por actor e idempotencia. Los archivos permanecen fuera de PostgreSQL en almacenamiento protegido; el resumen sólo presenta la toma más reciente de cada tipo y omite coordenadas. M03 exige fachada y, después, una respuesta persistida sobre el medidor: `Sí` requiere su fotografía y `No` una causa controlada que la sustituye para el cierre. La fachada con la integrante es opcional; `NOMENCLATURAS_CALLES` se conserva sin borrado para el módulo futuro.
- `verificacion_entrevistas` conserva una captura parcial por integrante con tipos de dominio, revisión monotónica y actores inicial/final derivados del JWT. `verificacion_entrevista_familiares` y `verificacion_entrevista_desacuerdos_montos` son historiales inmutables de altas y retiros; sus FKs compuestas impiden relacionar integrantes de otro expediente.
- `verificacion_entrevista_evidencias` conserva cada fotografía propia de Entrevista como una fila histórica de tipo `NEGOCIO`, `CONTROL_PAGOS` o `FOLLETO_PREMIO_TESORERA`, con FKs restrictivas, ruta protegida, MIME, tamaño, SHA-256, cámara, horas de foto/ubicación, actor, coordenadas, precisión disponible e idempotencia. Toda escritura nueva requiere ubicación; las filas anteriores a la migración 031 se preservan mediante `legado_sin_ubicacion` y nunca reciben coordenadas inventadas. La auditoría omite respuestas personales y coordenadas exactas.
- La conclusión de `Llamada` se deriva de `completada_at`: exige todas las coincidencias positivas, evidencia confirmada y una acción distinta de `LLAMAR_MAS_TARDE`. El alta de la encuesta también genera la acción abreviada `ENCUESTA_LLAMADA` en `audit_log`, que respeta el límite vigente de 20 caracteres.

Brecha constitucional:

- Cambios de estado, permisos, parámetros, excepciones y movimientos financieros requieren actor, fecha, motivo, resultado y contexto.
- La auditoría debe implementarse en transacciones de aplicación y protegerse contra alteración ordinaria.

## Migraciones

- `database/migrations` es la única cadena canónica ejecutable. `apps/api/src/migrations`, `migraciones` y los archivos `migration_*` son artefactos históricos que no deben aplicarse al esquema vigente.
- El catálogo compartido calcula checksums y rechaza números de secuencia duplicados antes de consultar o modificar una base.
- Ninguna migración debe ejecutarse por nombre o fecha sin revisar SQL, precondiciones, respaldo, compatibilidad y reversión.
- Los cambios se prueban primero en `crelealtad_test` cuando corresponda.
- `schema_migrations` conserva versión, SHA-256, origen, actor y duración. `npm run db:migrations:apply -- --database=<base> --through=<secuencia>` exige confirmación nominal mediante `MIGRATION_APPLY_CONFIRM`, ejecuta cada archivo canónico dentro de una transacción y registra el ledger sólo al confirmar.
- La cadena canónica tiene 33 migraciones aplicadas hasta 036 en `crelealtad_test` y `crelealtad`. La 036 fue probada con aplicación repetida, rollback, reconstrucción desde dump y pruebas de rechazo antes de aplicarse a la base operativa.
- `db:migrations:status` termina con error si detecta pendientes, drift o entradas desconocidas. La reconstrucción destructiva de `crelealtad_test` exige `TEST_DB_RESET_CONFIRM=crelealtad_test` y registra como `BASELINE` el catálogo exacto representado por el dump; no mantiene listas paralelas de migraciones.
- Está prohibido activar `synchronize: true`.
- D01 identifica cada corte por SHA-256, genera manifiesto, prevalida relaciones y carga en una sola transacción; repetir el mismo hash no duplica filas.

## Brechas verificadas

1. RLS inexistente.
2. Auditoría parcial: el recorrido de Documentación está cubierto en sus altas y cambios principales, pero faltan módulos futuros y gobierno transversal.
3. Sin triggers de auditoría o integridad adicional.
4. Matriz funcional de permisos y alcance territorial pendientes, aunque la aplicación técnica del JSONB ya existe.
5. Tabla de respaldo mezclada con entidades operativas.
6. Las tres validaciones SI/NO en solicitudes siguen siendo decisión funcional abierta.
7. Algunas relaciones usan `NO ACTION`; cualquier cambio a la política de borrado requiere revisión contra decisiones cerradas.
8. La documentación histórica todavía menciona tablas canónicas que no coinciden con el esquema vigente.

## Referencias cruzadas

- `project/03_PROJECT_STATUS.md`
- `project/08_ENTITY_CATALOG.md`
- `project/09_STATE_MACHINE.md`
- `project/11_ARCHITECTURE_GUIDE.md`
- `../DECISIONES.md`
- `../database/DATABASE.md`
