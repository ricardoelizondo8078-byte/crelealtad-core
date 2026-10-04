# 08 Entity Catalog — Catálogo Integral de Entidades

Versión: 2.14.0
Estado: Vigente y verificado
Fecha de auditoría: 2026-10-04
Fuente: PostgreSQL `crelealtad`, entidades TypeORM, API y mobile activos

## Criterio de lectura

- La constitución define la entidad y semántica oficial de negocio.
- PostgreSQL define la estructura técnica vigente y nombres de campo.
- La presencia de una tabla no implica módulo funcional completo.
- Los estados técnicos no sustituyen los estados funcionales aprobados.
- El inventario detallado de tablas y constraints está en `10_DATABASE_PRINCIPLES.md`.

## 1. Persona

Objetivo: identidad permanente de la clienta.
Persistencia: `personas`.
Cobertura: PostgreSQL, TypeORM y servicios de integrantes/solicitudes.
Reglas cerradas: folio permanente; `nombres`, `apellido_pat`, `apellido_mat`; `nombre_completo` derivado; monto en persona es prospectivo.
Integridad de estado: `ACTIVA`, `INACTIVA`, `BLOQUEADA` y `DEPURADA_LOGICA`, protegidos por `ck_personas_estado`.

## 2. Usuario

Objetivo: identidad de acceso al sistema.
Persistencia: `usuarios`.
Cobertura: PostgreSQL, TypeORM, Auth API y login mobile; cada acceso exitoso actualiza `ultimo_login` y registra un evento `LOGIN` no sensible en la misma transacción.
Relaciones: un rol y una sucursal por usuario en el modelo vigente; `permisos_personalizados` puede reemplazar de forma excepcional y auditable el conjunto efectivo sin cambiar el rol.
Implementación para asesores: abreviatura operativa como identificador de login, PIN en `password_hash`, marca `requiere_cambio_pin`, sucursal `MATRIZ`, zona sin asignar y estado `ACTIVO`.
Integridad de estado: `ACTIVO`, `INACTIVO`, `SUSPENDIDO` y `BLOQUEADO`, protegidos por `ck_usuarios_estado`.
Cobertura de carga: 49 usuarios vinculados a 49 registros de `empleados` y 49 registros de datos laborales.
Brecha: el cambio inicial obligatorio de PIN ya está implementado; faltan administración de
usuarios, recuperación o restablecimiento auditable, cambio voluntario y matriz funcional definitiva.

## 3. Rol

Objetivo: agrupar módulos y acciones permitidas.
Persistencia: `roles`, con permisos JSONB.
Cobertura: datos iniciales, rol incluido en JWT y permisos evaluados por el guard global contra un catálogo técnico central. La migración 035 valida en PostgreSQL la forma JSONB y que módulos/acciones contengan texto.
Integridad de estado: `ACTIVO` e `INACTIVO`, protegidos por `ck_roles_estado`.
Brecha: matriz funcional definitiva y alcance territorial pendientes.

## 4. Empleado

Objetivo: representar la relación operativa/laboral del personal.
Persistencia: `empleados`, `empleados_contacto`, `empleados_datos_laborales`, `empleados_documentos`, `empleados_domicilios`.
Cobertura: PostgreSQL.
Implementación para asesores: 49 empleados activos en `MATRIZ`, sin zona, con fila de datos laborales.
Regla futura aprobada: al reconciliar grupos, la existencia de grupos activos determinará continuidad activa.
Brecha: sin módulo API/mobile administrativo verificado, sin historial de comisión y sin servicio auditable que materialice la regla futura de actividad.

## 5. Sucursal y zona

Objetivo: organización territorial y alcance operativo.
Persistencia: `sucursales`, `zonas`.
Cobertura: relaciones con usuarios, empleados, grupos y expedientes.
Brecha: el backend no aplica alcance de datos por sucursal/zona.

## 6. Grupo

Objetivo: unidad solidaria de operación.
Persistencia: `grupos`.
Cobertura: PostgreSQL, TypeORM, API y mobile.
Comportamiento actual: crear grupo genera exactamente un expediente en la misma transacción y audita ambas altas. No existe un endpoint independiente para duplicar esa creación.
Actor de creación: `created_by` es UUID nullable y referencia `usuarios.id` con `ON DELETE RESTRICT`; la nulabilidad conserva grupos históricos sin actor atribuible.
Estados técnicos: PostgreSQL admite `FORMANDO`, `LISTO_PARA_REVISION`, `EN_REVISION` y
`AUTORIZADO`; TypeORM no está completamente alineado con ese enum. Su correspondencia con
Propuesto, En documentación, En evaluación, Activo, En renovación y Cerrado continúa abierta.

## 7. Expediente

Objetivo: contenedor operativo y documental previo y posterior al desembolso.
Persistencia: `expedientes`.
Cobertura: PostgreSQL, TypeORM, API y mobile.
Relación con ciclo: puede existir sin ciclo durante originación; una vez desembolsado, puede originar como máximo un ciclo.
Tesorera en originación: `tesorera_integrante_id` identifica a la participante seleccionada en Documentación para las validaciones adicionales de Verificación. La FK compuesta impide apuntar a una integrante de otro expediente; la API exige además que continúe como participante.
Historia importada: `ciclo_historico_origen_id` relaciona de forma única el expediente fuente con un ciclo D01 del mismo grupo; `importacion_integrantes_id` conserva su procedencia.
Brecha: la transición actual a verificación aplica participación, pendientes y tesorera, pero el mínimo parametrizado y la bitácora constitucional completa continúan pendientes.
Estados técnicos observados: `En proceso`, `EN_DOCUMENTACION`, `EN_VERIFICACION` y
`DESEMBOLSADO`; el código declara además estados todavía no materializados. No existe una
homologación completa aprobada con el catálogo funcional del expediente.

## 8. Integrante

Objetivo: asociar persona con expediente y estado de participación.
Persistencia: `integrantes`.
Cobertura: PostgreSQL, TypeORM, API y mobile.
Estados técnicos vigentes en código y PostgreSQL: DOCUMENTANDO, SUJETA_CREDITO, RETIRADA, EN_VERIFICACION, AUTORIZADA y RECHAZADA.
Regla cerrada: SUJETA_CREDITO requiere los siete pasos definidos y documentos confirmados en servidor.
`RETIRADA` representa que la persona no participa únicamente en ese expediente. Conserva motivo controlado, detalle cuando aplica, actor y fecha; no elimina la persona, solicitud, documentos ni historia anterior.
Control de acceso: para `ASESOR`, toda lectura o escritura directa deriva el expediente y comprueba que `expedientes.asesora_id` corresponda al empleado asociado al JWT.

## 8.1 Intento de llamada de Verificación

Objetivo: conservar cada intento que el verificador declara después de abrir el marcador telefónico o WhatsApp.
Persistencia: `verificacion_llamadas`.
Cobertura: PostgreSQL, entidad TypeORM, API autenticada y contadores mobile.
Campos de trazabilidad: `integrante_id`, `canal`, `resultado`, `registrada_por`, `created_at`, `ubicacion_latitud`, `ubicacion_longitud`, `ubicacion_precision_metros`, `ubicacion_capturada_at` y `ubicacion_fuente`; `idempotency_key` evita duplicar el mismo intento ante un reenvío.
Reglas cerradas: sólo se registra dentro de un expediente `EN_VERIFICACION`, no existe borrado operativo y el registro no duplica el teléfono ni afirma una comprobación automática de la llamada por el dispositivo. Para intentos nuevos, la ubicación actual es obligatoria; los registros históricos conservan los campos nulos. `DISPOSITIVO` puede combinar GPS, Wi-Fi y red móvil.

## 8.2 Encuesta de llamada de Verificación

Objetivo: conservar las respuestas estructuradas y la acción posterior de una llamada contestada.
Persistencia: `verificacion_llamada_encuestas` y `verificacion_llamada_caracteristicas`.
Cobertura: PostgreSQL, entidades TypeORM, API autenticada y mobile.
Campos de trazabilidad: intento único, coincidencia de identidad y domicilio, seis características controladas, acción posterior, actor, fecha y `completada_at` derivado.
Reglas cerradas: una encuesta por intento contestado; no hay captura libre; `completada_at` sólo existe cuando todas las coincidencias son positivas, hay evidencia y la acción no es `LLAMAR_MAS_TARDE`.

## 8.3 Evidencia de llamada de Verificación

Objetivo: probar visualmente la llamada mediante una fotografía de la pantalla del celular elegida de la galería después de las cuatro preguntas.
Persistencia: metadatos en `verificacion_llamada_evidencias` y archivo en almacenamiento protegido fuera de PostgreSQL.
Cobertura: PostgreSQL, almacenamiento filesystem configurable, ruta API protegida y selección mobile desde galería.
Campos de trazabilidad: encuesta única, ruta, MIME verificado, tamaño, SHA-256, actor y fecha.
Reglas cerradas: una evidencia JPEG o PNG de máximo 10 MB por encuesta; no existe borrado operativo ni acceso público directo.

## 8.4 Fachada de Visita al vecino

Objetivo: conservar la evidencia visual y geográfica inicial del domicilio antes del contacto con
el vecino.
Persistencia: metadatos en `verificacion_visita_vecino_fachadas` y archivo en almacenamiento
protegido fuera de PostgreSQL.
Cobertura: cámara exclusiva en mobile, ubicación inmediata, API autenticada, ruta privada y
migración 020.
Campos de trazabilidad: integrante, ruta, MIME, tamaño, SHA-256, fuente `CAMARA`, fechas de foto y
ubicación, actor, idempotencia, latitud, longitud, precisión disponible y fuente `DISPOSITIVO`.
Reglas cerradas: JPEG o PNG de máximo 10 MB; no se ofrece carrete; cada respuesta nueva debe ligar
la fachada más reciente; resumen y auditoría no exponen coordenadas. `CAMARA` describe el flujo
oficial y no una certificación criptográfica del dispositivo.

## 8.5 Visita al vecino de Verificación

Objetivo: conservar cada confirmación declarada por el verificador sobre si el vecino conoce a
la integrante y sabe dónde vive.
Persistencia: `verificacion_visitas_vecino`.
Cobertura: PostgreSQL mediante migraciones 018 y 019, entidad TypeORM, API autenticada y
captura mobile conectada.
Campos de trazabilidad: `integrante_id`, `fachada_id`, `conoce_y_sabe_donde_vive`, `registrada_por`,
`created_at`, `idempotency_key`, latitud, longitud, precisión horizontal opcional, fecha/hora de
lectura y fuente `DISPOSITIVO`.
Reglas cerradas: una fila histórica por confirmación enviada; llaves foráneas restrictivas hacia
integrante y usuario; idempotencia única por actor; ubicación válida obligatoria para cada fila.
Las filas nuevas requieren la fachada más reciente; las filas anteriores a la migración 020
conservan `fachada_id = NULL`. El resumen recupera sólo el resultado más reciente y no expone coordenadas. No duplica nombre,
domicilio o INE y su existencia no define todavía la conclusión de la visita.

## 8.6 Evidencia posterior a la respuesta del vecino

Objetivo: conservar la fotografía geolocalizada que se toma después de guardar `Sí / No` y antes
del guion de correspondencia.
Persistencia: metadatos en `verificacion_visita_vecino_evidencias` y archivo en almacenamiento
protegido fuera de PostgreSQL.
Cobertura: cámara exclusiva en mobile, ubicación inmediata, API autenticada, ruta privada y
migración 021.
Campos de trazabilidad: `visita_id`, ruta, MIME, tamaño, SHA-256, fuente `CAMARA`, fechas de foto
y ubicación, actor, idempotencia, latitud, longitud, precisión disponible y fuente `DISPOSITIVO`.
Reglas cerradas: JPEG o PNG de máximo 10 MB; la evidencia sólo se registra para la respuesta más
reciente y nunca se reutiliza si se crea otra respuesta. Resumen y auditoría omiten coordenadas.

## 8.7 Imagen del domicilio de Verificación

Objetivo: conservar por separado las nomenclaturas de las calles, la fachada, el medidor de luz y,
cuando exista, la fachada con la integrante. M03 captura actualmente fachada, medidor de luz y
fachada con la integrante; la nomenclatura se reserva para un módulo futuro.
Persistencia: metadatos en `verificacion_imagenes_domicilio` y archivo en almacenamiento protegido
fuera de PostgreSQL.
Cobertura: cámara exclusiva en mobile, ubicación inmediata por toma, API autenticada, ruta privada,
migración 022 para la tabla y migración 023 para incorporar el tipo `MEDIDOR_LUZ`.
Campos de trazabilidad: integrante, tipo controlado, ruta, MIME, tamaño, SHA-256, fuente `CAMARA`,
fecha de foto, actor autenticado, idempotencia, latitud, longitud, precisión disponible, fecha de
ubicación, fuente `DISPOSITIVO` y fecha de registro.
Reglas cerradas: cada captura confirmada crea una fila histórica; una repetición no borra la fila
anterior. El resumen devuelve la toma más reciente de cada tipo sin exponer coordenadas ni actor.
En M03 la fachada es obligatoria. Después se registra si existe medidor: `Sí` exige su fotografía y
`No` exige una causa controlada persistida que la sustituye para el cierre. Fachada con la integrante
es opcional y la nomenclatura no se muestra ni se exige. Su tipo e historial permanecen disponibles
para el módulo de destino todavía pendiente. Resumen y auditoría omiten las coordenadas precisas.

## 8.8 Evidencia de Entrevista

Objetivo: conservar las fotografías opcionales de negocio, control de pagos, folleto e historial
crediticio externo que el verificador anexa durante Entrevista.
Persistencia: metadatos en `verificacion_entrevista_evidencias` y archivo en almacenamiento protegido
fuera de PostgreSQL. La migración 031 sustituyó el nombre histórico
`verificacion_entrevista_negocio_evidencias` sin perder sus filas.
Cobertura: captura repetible exclusivamente desde cámara en mobile, API autenticada, ruta privada y
migraciones 024, 025, 031 y 032.
Campos de trazabilidad: integrante, tipo controlado, ruta, MIME, tamaño, SHA-256, origen `CAMARA`,
actor, idempotencia, fecha de foto, ubicación, precisión disponible y fecha de registro.
Reglas cerradas: cero fotografías es válido; pueden agregarse todas las necesarias y no existe máximo
funcional de cantidad. Cada archivo debe ser JPEG o PNG válido y pesar hasta 10 MB. Cada confirmación
crea historial; no define el estado ni la conclusión general de Entrevista.

## 9. Solicitud

Objetivo: captura estructurada individual.
Persistencia verificada:

- `solicitudes`.
- `solicitudes_datos_personales`.
- `solicitudes_domicilios`.
- `solicitudes_negocios`.
- `solicitudes_referencias`.
- `solicitudes_beneficiarios`.
- `solicitudes_validaciones`.
- `solicitudes_documentos`.

Cobertura: PostgreSQL, entidades TypeORM, API y formularios mobile.
Lectura: vista `solicitudes_completo` para resumen y relaciones TypeORM para detalle.
Reglas cerradas: core más siete hijas, UPSERT por `solicitud_id`, IDs de contexto derivados en backend y crédito asignado solo durante desembolso real.
El core conserva `monto_solicitado_confirmado_at` para distinguir una referencia precargada de la captura formal realizada por el asesor en el Paso 6.
Estado: no existe una columna propia de estado en `solicitudes`; la completitud se deriva desde sus
campos, tablas hijas, documentos y el estado técnico de la integrante. El catálogo funcional de
Solicitud no debe inferirse a partir de estados locales de formulario.

## 10. Documento y evidencia

Objetivo: conservar evidencias de identidad, domicilio, solicitud y verificación.
Persistencia actual: metadatos vigentes en `solicitudes_documentos`, versiones y manifiestos en el
almacenamiento protegido del servidor y referencias locales parciales en mobile.
Cobertura: captura por cámara/galería, carga multipart autenticada, validación por firma real,
versionamiento y lectura privada confirmada por servidor.
Brecha: el proveedor actual es filesystem configurable; producción requiere almacenamiento durable,
respaldado y observable, además de sincronización offline completa.
Estado: no existe todavía una entidad documental única que materialice Pendiente, Capturado,
Observado, Aceptado, Reemplazado y Vencido. Los estados mobile de carga/sincronización describen
transporte y no sustituyen ese catálogo funcional.

## 11. Producto de crédito

Objetivo: configurar la oferta financiera.
Persistencia: `productos_credito`.
Cobertura: PostgreSQL y referencia desde expedientes.
Integridad de estado: `ACTIVO`, `INACTIVO` y `SUSPENDIDO`, protegidos por `ck_productos_credito_estado`.
Brecha: sin módulo de parámetros/productos ejecutable.

## 12. Crédito

Objetivo: obligación financiera nacida del desembolso real.
Persistencia: `creditos`.
Relaciones: persona, expediente y solicitud; la FK hacia `solicitudes.id` quedó validada en la migración 033.
Cobertura: base de datos.
Integridad de estado: `BORRADOR`, `PREPARADO_DESEMBOLSO`, `DESEMBOLSADO`, `VIGENTE`, `VENCIDO`, `LIQUIDADO`, `REESTRUCTURADO` y `CANCELADO`; el default es `BORRADOR`.
Brecha: sin API/mobile de desembolso o crédito verificados.

## 13. Ciclo

Objetivo: periodo operativo de un crédito grupal desembolsado.
Persistencia: `ciclos`.
Relaciones: grupo, expediente, tesorera y asesora.
Regla cerrada: nace únicamente con desembolso real.
Tesorera definitiva: `ciclos.tesorera_id` conserva a la persona con quien se ejecutó el desembolso. Puede diferir de `expedientes.tesorera_integrante_id`; una sustitución en Desembolsos se audita y no obliga a repetir Verificación.
Integridad vigente: `expediente_id` obligatorio y único, FK compuesta con `grupo_id` y `ON DELETE RESTRICT`; el ciclo y su expediente siempre pertenecen al mismo grupo.
Integridad de estado: `PLANEADO`, `ACTIVO`, `EN_CIERRE` y `CERRADO`, protegidos por `ck_ciclos_estado`.

## 14. Calendario de pagos

Objetivo: programar obligaciones del crédito.
Persistencia: `calendario_pagos`.
Cobertura: base de datos.

## 15. Pago

Objetivo: registrar aplicación de cobranza.
Persistencia: `pagos`.
Relaciones: crédito, calendario y persona.
Cobertura: base de datos.
Integridad de estado: `PENDIENTE`, `APLICADO`, `PARCIAL`, `VENCIDO` y `REVERSADO`; el default es `PENDIENTE`.
Brecha: sin API/mobile, idempotencia ni flujo de reverso verificados.

## 16. Mora

Objetivo: registrar y gestionar incumplimiento.
Persistencia: `mora`.
Relaciones: crédito y calendario.
Cobertura: base de datos.

## 17. Reestructura o convenio

Objetivo: formalizar modificación controlada de obligaciones.
Persistencia: `reestructuras`.
Cobertura: base de datos.
Decisión pendiente: definir correspondencia exacta entre “Convenios” funcional y `reestructuras` técnica.

## 18. Movimiento de caja

Objetivo: registrar movimientos financieros por sucursal.
Persistencia: `caja_movimientos`.
Cobertura: base de datos.
Brecha: sin API/mobile ni controles de aprobación verificados.

## 19. Código postal

Objetivo: apoyar captura estructurada de domicilio.
Persistencia: `codigos_postales`.
Cobertura: API de colonias/información y uso mobile.

## 20. Auditoría

Objetivo: registrar actor, fecha, motivo y resultado de eventos críticos.
Persistencia: `audit_log` y bitácoras operativas específicas como `verificacion_llamadas`.
Cobertura: `audit_log` registra altas de grupo, expediente e integrante; campos cambiados de integrante/solicitud; carga documental; renovaciones; participación; tesorera; handoff y revisión documental. `audit_log.usuario_id` referencia `usuarios.id` con `ON DELETE RESTRICT`; las llamadas conservan actor, fecha/hora, canal y resultado en su entidad inmutable.
Privacidad: los eventos nuevos de captura registran nombres de campos y contexto operativo, no copias de valores personales.
Brecha: la cobertura transversal de módulos futuros continúa incompleta y no existen triggers públicos de auditoría.

## 21. Importación e historial grupal Excel

Objetivo: conservar cortes auditables del Excel operativo hasta la transición definitiva al app.
Persistencia: `importaciones_excel`, `historial_grupos_ciclos`, `historial_grupos_ciclos_semanas`.
Cobertura: validadores/cargadores grupal e individual D01 y consulta posterior desde API/mobile de Renovación.
Reglas: corte inmutable por hash, una sola base activa, `GRUPO VIGENTE=1` sin inferencia de liquidación, asesor por ciclo y FKs con `ON DELETE RESTRICT`.
Separación: estas tablas contienen historia agregada y no sustituyen `ciclos` ni `creditos` nacidos del desembolso real.
Historia individual: vive en `expedientes`, `integrantes` y `solicitudes`; no existe una tabla paralela de membresías históricas.

## 22. Ledger de migraciones

Objetivo: detectar migraciones pendientes, archivos alterados y entradas desconocidas antes de desplegar.
Persistencia: `schema_migrations`.
Cobertura: versión de archivo, SHA-256, origen `MIGRATION` o `BASELINE`, fecha, usuario PostgreSQL y
duración opcional. `crelealtad_test` y `crelealtad` tienen las 33 migraciones canónicas aplicadas hasta la 036, sin pendientes, drift ni entradas desconocidas.
Regla técnica: un checksum distinto bloquea el baseline; la tabla no contiene datos de negocio.

## Artefactos no canónicos

- `backup_tesoreras_20260802`: respaldo operativo, no entidad de dominio.
- Archivos `.BACKUP`, `.FIXED`, `.NEW` y suites `.skip`: variantes técnicas que no son runtime activo salvo importación demostrada.

## Entidades funcionales sin módulo/tabla dedicada verificada

- Verificación como dictamen y bitácora formal del resto de procesos; los intentos de llamada ya tienen entidad dedicada.
- Análisis.
- Desembolso como evento explícito.
- Parámetro.
- Regla versionada.
- Observación estructurada.
- Excepción operativa.
- Cola de sincronización offline.

Estas ausencias no autorizan a inventar su estructura; requieren especificación y aprobación funcional.

## Referencias cruzadas

- `project/03_PROJECT_STATUS.md`
- `project/05_BUSINESS_RULES.md`
- `project/09_STATE_MACHINE.md`
- `project/10_DATABASE_PRINCIPLES.md`
- `project/20_MODULE_CATALOG.md`
- `../DECISIONES.md`
