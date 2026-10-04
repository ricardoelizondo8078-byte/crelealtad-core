# M03 — Entrevista de Verificación

Versión: 1.2.0
Estado: persistencia general implementada; criterio de conclusión pendiente
Fecha de verificación: 2026-10-04

## 1. Identidad

- Nombre oficial: Entrevista de Verificación.
- Código: M03-ENTREVISTA.
- Módulo padre: M03 Verificación.
- Roles usuarios: quienes cuenten con `verificacion:ver` para consultar y `verificacion:registrar` para guardar dentro de su alcance vigente.
- Responsable operativo: Dirección de CRELEALTAD.

## 2. Objetivo y resultado observable

- Conservar en PostgreSQL la captura parcial de la entrevista sin perderla al cerrar la aplicación.
- Restaurar la última revisión confirmada al volver a abrir a la integrante.
- Mantener como historial las altas y retiros de familiares, los desacuerdos por monto y todas las fotografías.
- Atribuir cada guardado y cada evidencia al usuario autenticado; el cliente nunca decide el actor.
- Exigir fecha, coordenadas y fuente de ubicación para toda fotografía nueva propia de Entrevista.

## 3. Alcance

### Incluye

- Preguntas generales, historial crediticio externo, datos personales, ingresos, negocio y encuestas aplicables por historial.
- Relaciones con otras integrantes mediante UUID y validación de pertenencia al mismo expediente.
- Autoguardado parcial, recuperación y revisión monotónica.
- Evidencias `NEGOCIO`, `HISTORIAL_CREDITO_ACTIVO`, `HISTORIAL_CREDITO_INACTIVO`,
  `CONTROL_PAGOS` y `FOLLETO_PREMIO_TESORERA`.
- Consulta visual de todas las imágenes vigentes del comprobante de línea de crédito capturado en
  Documentación dentro de `Evidencia de otra financiera`, sin copiarlas a la evidencia propia de
  Entrevista.
- Archivos protegidos, validación real JPEG/PNG, SHA-256, idempotencia, actor y geolocalización.

### No incluye

- Definir o marcar la Entrevista como terminada.
- Cambiar estados del expediente o crear un dictamen.
- Duplicar confirmaciones telefónicas o imágenes del domicilio, que conservan sus contratos existentes.
- Inventar coordenadas para fotografías históricas anteriores a la migración 031.
- Cola offline durable; el autoguardado actual necesita conexión y muestra el error cuando el servidor no confirma.

## 4. Flujo operativo

1. La API valida JWT, permiso, alcance y expediente `EN_VERIFICACION`.
2. Mobile consulta la entrevista. Si no puede recuperarla, bloquea el autoguardado para no sobrescribir información existente con un formulario vacío.
3. Cada cambio se transforma de etiqueta visible a código estable y se envía por autoguardado diferido.
4. La API deriva `expediente_id` desde `integrante_id`, valida relaciones y condiciones, guarda los escalares y aumenta `revision`.
5. Los cambios de familiares y desacuerdos generan eventos de alta o retiro; no eliminan historial.
6. Para una foto, mobile abre exclusivamente la cámara, registra la hora de toma, obtiene una ubicación actual y envía ambos datos con una clave idempotente.
7. La API obtiene el actor del JWT, valida contenido y coordenadas, guarda el archivo fuera de exposición pública y registra metadatos.
8. La app sólo muestra la evidencia como confirmada cuando el servidor devuelve la fila persistida.
9. En el historial crediticio externo, después de la tasa, la rama activa y la rama inactiva
   muestran su propia evidencia fotográfica. Cada apertura de cámara agrega una foto y
   ambas ramas admiten cantidad abierta sin mezclar sus historiales.

## 5. Entidades y tipos de datos

### 5.1 Entrevista principal

Una fila por `integrante_id` en `verificacion_entrevistas`. Todos los campos de respuesta permiten `NULL` para soportar captura parcial; `NULL` significa pendiente, no equivale a `No` ni a cero.

| Bloque | Campo PostgreSQL | Tipo | Validación o condición |
|---|---|---|---|
| Identidad | `id` | `UUID` | Generado por servidor |
| Identidad | `expediente_id`, `integrante_id` | `UUID` | FK compuesta; una entrevista por integrante |
| General | `conoce_asesora` | `BOOLEAN` | Trivalente: sí/no/pendiente |
| General | `como_conocio_asesora` | `VARCHAR(40)` | `OTRA_INTEGRANTE`, `OTRA_FINANCIERA`, `FACEBOOK`, `OTRO`; se limpia si responde no |
| General | `conoce_integrantes` | `BOOLEAN` | Trivalente |
| General | `tiempo_conoce_integrantes` | `VARCHAR(20)` | `0_A_1`, `1_A_3`, `MAS_DE_3`; se limpia si responde no |
| General | `sabe_montos_companeras`, `acuerdo_montos_companeras` | `BOOLEAN` | Respuestas independientes y parciales |
| General | `conoce_tesorera` | `BOOLEAN` | Si es no, no puede conservar tesorera reconocida |
| General | `tesorera_reconocida_integrante_id` | `UUID` | Integrante activa del mismo expediente; no cambia la tesorera oficial |
| General | `domicilio_recoleccion_integrante_id` | `UUID` | Integrante del mismo expediente |
| General | `desconoce_domicilio_recoleccion` | `BOOLEAN` | Excluyente con el UUID anterior |
| General | `tiene_familiares_grupo` | `BOOLEAN` | El conjunto se lleva en historial relacionado |
| Crédito externo | `tiene_otro_credito_grupal`, `credito_grupal_anterior_activo` | `BOOLEAN` | Los detalles se limpian cuando no existe antecedente |
| Crédito externo | `financiera_credito_grupal` | `VARCHAR(100)` | Texto controlado por la UI vigente |
| Crédito externo | `valor_ficha_credito_grupal` | `NUMERIC(12,2)` | Mayor o igual a cero |
| Crédito externo | `semana_actual_credito_grupal` | `SMALLINT` | 1 a 16 |
| Crédito externo | `mes_desembolso_credito_grupal`, `mes_ultimo_pago_credito_grupal` | `SMALLINT` | 1 a 12, no se guardan nombres de meses |
| Crédito externo | `anio_ultimo_pago_credito_grupal` | `SMALLINT` | 1900 a 2200 |
| Crédito externo | `numero_ciclos_credito_grupal` | `SMALLINT` | 1 a 40 |
| Crédito externo | `tasa_credito_grupal` | `SMALLINT` | Valor entero de la ficha, 65 a 100 |
| Crédito externo | `nombre_asesora_credito_grupal` | `VARCHAR(200)` | Opcional |
| Crédito externo | `telefono_asesora_credito_grupal` | `VARCHAR(10)` | Diez dígitos cuando existe; no es numérico para conservar ceros iniciales |
| Crédito externo | `motivo_no_renovacion_credito_grupal` | `VARCHAR(120)` | Catálogo vigente, sólo cuando aplica |
| Domicilio | `vive_en_domicilio` | `BOOLEAN` | Trivalente |
| Domicilio | `motivo_no_vive_domicilio` | `VARCHAR(120)` | Sólo para respuesta negativa |
| Domicilio | `tipo_domicilio` | `VARCHAR(20)` | `RENTA`, `PROPIA`, `FAMILIAR` |
| Domicilio | `familiar_domicilio` | `VARCHAR(30)` | `PAPAS`, `HIJOS`, `ABUELOS`, `OTRO_FAMILIAR`; sólo para `FAMILIAR` |
| Domicilio | `antiguedad_domicilio` | `VARCHAR(20)` | `0_A_1`, `1_A_3`, `MAS_DE_3` |
| Hogar | `personas_viven_casa` | `VARCHAR(10)` | `1` a `5` o `6_O_MAS` |
| Hogar | `convivientes` | `VARCHAR(20)[]` | Conjunto acotado: `CONYUGE`, `HIJOS`, `PADRES`, `HERMANOS`, `OTROS` |
| Hogar | `saben_del_credito`, `otro_ingreso_hogar` | `BOOLEAN` | Trivalentes |
| Hogar | `otro_ingreso_semanal`, `capacidad_pago_semanal` | `NUMERIC(12,2)` | Mayor o igual a cero; el primer importe sólo aplica si existe otro ingreso |
| Uso e ingreso | `uso_credito` | `TEXT` | Máximo 1,000 caracteres en API |
| Uso e ingreso | `fuentes_ingreso` | `VARCHAR(20)[]` | Subconjunto de `SUELDO`, `NEGOCIO` |
| Sueldo | `sueldo_semanal` | `NUMERIC(12,2)` | Mayor o igual a cero; sólo con fuente `SUELDO` |
| Sueldo | `lugar_trabajo` | `VARCHAR(250)` | Sólo con fuente `SUELDO` |
| Sueldo | `antiguedad_laboral` | `VARCHAR(20)` | `1_ANIO`, `2_ANIOS`, `3_A_5_ANIOS`, `5_O_MAS` |
| Negocio | `tipo_negocio` | `VARCHAR(250)` | Sólo con fuente `NEGOCIO` |
| Negocio | `ingreso_libre_semanal_negocio` | `NUMERIC(12,2)` | Mayor o igual a cero |
| Negocio | `ubicacion_negocio` | `TEXT` | Descripción declarada; no sustituye coordenadas de cada foto |
| Tesorera con historial | `tiene_control_pagos`, `conoce_premio_tesorera` | `BOOLEAN` | Trivalentes |
| Tesorera con historial | `motivo_sin_control_pagos` | `VARCHAR(120)` | Se limpia cuando sí existe control |
| Tesorera con historial | `asesora_acudio_semanalmente`, `firmaban_control_semanalmente` | `VARCHAR(20)` | `SIEMPRE`, `A_VECES`, `NUNCA` |
| Tesorera con historial | `trato_asesora_tesorera` | `VARCHAR(20)` | `EXCELENTE`, `BUENO`, `REGULAR`, `MALO` |
| Historial CRELEALTAD | `opinion_credito`, `trato_desembolso` | `VARCHAR(20)` | `EXCELENTE`, `BUENO`, `REGULAR`, `MALO` |
| Historial CRELEALTAD | `rapidez_desembolso` | `VARCHAR(20)` | `MUY_RAPIDO`, `RAPIDO`, `LENTO`, `MUY_LENTO` |
| Historial CRELEALTAD | `informacion_credito_clara`, `recomendaria` | `BOOLEAN` | Trivalentes |
| Historial CRELEALTAD | `motivo_recomendacion` | `VARCHAR(120)` | Motivo capturado cuando aplica |
| Historial CRELEALTAD | `oportunidad_mejora` | `TEXT` | Máximo 2,000 caracteres en API |
| Auditoría | `entrevistada_por`, `actualizada_por` | `UUID` | FK a `usuarios`; siempre derivados del JWT |
| Control | `revision` | `INTEGER` | Positivo, aumenta en cada guardado confirmado |
| Control | `created_at`, `updated_at` | `TIMESTAMPTZ` | Fecha/hora del servidor |

### 5.2 Relaciones con integrantes

| Tabla | Propósito | Tipo de historial |
|---|---|---|
| `verificacion_entrevista_familiares` | Vincular familiares declaradas mediante `familiar_integrante_id` | Evento inmutable con `activo`, actor y fecha; un retiro agrega fila |
| `verificacion_entrevista_desacuerdos_montos` | Conservar cada integrante cuyo monto no acepta y su causa | Evento inmutable con `motivo`, `activo`, actor y fecha |

Ambas tablas usan FKs compuestas para impedir que el cliente relacione integrantes de otro expediente. La entrevistada no puede elegirse como su propia familiar ni como desacuerdo.

### 5.3 Fotografías

Todas las fotografías propias de Entrevista viven en `verificacion_entrevista_evidencias`.

| Campo | Tipo | Regla |
|---|---|---|
| `tipo` | `VARCHAR(40)` | `NEGOCIO`, `HISTORIAL_CREDITO_ACTIVO`, `HISTORIAL_CREDITO_INACTIVO`, `CONTROL_PAGOS`, `FOLLETO_PREMIO_TESORERA` |
| `ruta`, `mime_type`, `tamano_bytes`, `sha256` | Texto/entero | Ruta protegida, JPEG/PNG real, máximo 10 MB y hash de contenido |
| `captura_fuente` | `VARCHAR(20)` | Toda captura nueva es `CAMARA` |
| `foto_capturada_at` | `TIMESTAMPTZ` | Momento de la toma informado por el dispositivo |
| `ubicacion_latitud` | `NUMERIC(10,7)` | -90 a 90 |
| `ubicacion_longitud` | `NUMERIC(11,7)` | -180 a 180 |
| `ubicacion_precision_metros` | `NUMERIC(10,2)` | Opcional, nunca negativa |
| `ubicacion_capturada_at` | `TIMESTAMPTZ` | Momento de la lectura de ubicación |
| `ubicacion_fuente` | `VARCHAR(20)` | `DISPOSITIVO` |
| `registrada_por` | `UUID` | Usuario autenticado que realiza y registra la entrevista |
| `idempotency_key` | `VARCHAR` existente | Única por actor para no duplicar reintentos |
| `legado_sin_ubicacion` | `BOOLEAN` | `TRUE` sólo para archivos anteriores a 031; nunca se fabrican coordenadas |
| `created_at` | `TIMESTAMPTZ` | Confirmación del servidor |

La restricción de base exige para toda fila nueva: cámara, hora de foto, latitud, longitud, hora de ubicación y fuente. La precisión puede ser nula si el sistema operativo no la informa.

## 6. Estados y transiciones

La Entrevista no tiene todavía un estado funcional de conclusión aprobado. El único control persistente nuevo es la revisión del borrador:

| Estado técnico | Entrada | Salida | Bloqueo |
|---|---|---|---|
| Sin fila | Nunca se ha confirmado un campo | Primer `PUT` válido | Ninguno |
| Borrador guardado | Existe `verificacion_entrevistas` | Nuevo autoguardado | No equivale a entrevista terminada |
| Guardando | Hay cambio local diferido | Respuesta del servidor | No mostrar éxito antes de confirmar |
| Error de guardado | Falló API o red | Reintento confirmado | Conservar formulario visible |

## 7. Pantalla

| Pantalla | Plantilla | Objetivo | Acciones |
|---|---|---|---|
| `IntegranteVerificacionScreen` / Entrevista | T5 + T8 parcial | Capturar y recuperar entrevista individual | Responder, seleccionar integrantes, tomar/ver/reintentar fotos, volver al concentrador |

## 8. API y persistencia

- `GET /verificacion/integrantes/:integranteId/entrevista`: recupera respuestas, relaciones activas y revisión.
- `PUT /verificacion/integrantes/:integranteId/entrevista`: autoguarda el DTO tipado.
- `GET /verificacion/integrantes/:integranteId/entrevista/evidencias`: lista metadatos autorizados.
- `POST /verificacion/integrantes/:integranteId/entrevista/evidencias`: alta multipart idempotente y geolocalizada.
- `GET /verificacion/integrantes/:integranteId/entrevista/evidencias/:evidenciaId/archivo`: lectura autenticada del archivo protegido.
- Migración: `031_persistencia_general_entrevista.sql` y rollback protegido.
- Auditoría: registra actor, integrante, revisión, nombres de campos modificados y referencia de evidencia; no copia respuestas personales ni coordenadas exactas al `audit_log`.

## 9. Reglas de negocio

- PostgreSQL conserva códigos estables; mobile es responsable sólo de traducir etiquetas visibles.
- Teléfonos son texto de diez caracteres, no números.
- Importes son `NUMERIC(12,2)`, nunca `float`.
- Meses, semanas, ciclos, años y tasa son enteros acotados.
- Campos `NULL` representan captura pendiente.
- Los UUID relacionados se derivan o validan contra el mismo expediente.
- Desmarcar una relación genera historia; no borra la fila anterior.
- Una foto nueva sin ubicación no se guarda. La descripción textual del negocio no cuenta como geolocalización.
- Ninguna foto opcional determina por sí sola que la Entrevista terminó.

## 10. Permisos y seguridad

| Acción | Condición | Auditoría |
|---|---|---|
| Consultar | JWT, `verificacion:ver`, alcance sobre integrante | Acceso sujeto a guard y alcance |
| Guardar respuestas | JWT, `verificacion:registrar`, expediente vigente | Actor, revisión y campos modificados |
| Registrar foto | Igual, JPEG/PNG válido, coordenadas válidas | Actor, tipo, evidencia y metadatos no sensibles |
| Leer archivo | JWT, permiso, alcance y pertenencia | Ruta física nunca se expone como URL pública |

## 11. Estados técnicos de UI

- Carga: recuperar primero respuestas y evidencias.
- Error de recuperación: informar y no iniciar autoguardado destructivo.
- Autoguardado: mostrar guardando, guardado confirmado o error con reintento.
- Fotografía: pendiente local, obteniendo ubicación, enviando, confirmada o error.
- Historial externo: crédito activo e inactivo conservan listas, pendientes y errores separados;
  cambiar la respuesta visible no elimina fotografías ya confirmadas.
- Sin conexión: no simular éxito; la cola offline durable continúa pendiente.
- Sin permiso: la API rechaza aunque la pantalla se haya abierto por estado local desactualizado.

## 12. Casos especiales

- Reintentos de foto: reutilizan `idempotency_key`.
- Cambio de integrante: limpia el formulario anterior antes de recuperar la nueva entrevista.
- Nombres repetidos: nunca son claves; se guardan UUID.
- Concurrencia: `revision` permite identificar la secuencia, pero la política de conflicto offline/multidispositivo continúa abierta.
- Histórico sin GPS: queda marcado `legado_sin_ubicacion = TRUE`; no se rellena retroactivamente.

## 13. Criterios de aceptación

- [x] Las respuestas sobreviven cierre y reapertura.
- [x] El actor se toma del JWT.
- [x] Los UUID externos al expediente son rechazados.
- [x] Familiares y desacuerdos conservan altas y retiros.
- [x] Toda foto nueva propia de Entrevista exige coordenadas, hora y actor.
- [x] Los archivos son protegidos, validados e idempotentes.
- [x] Las ramas activa e inactiva del crédito externo permiten agregar fotografías sin límite y
  recuperan únicamente las correspondientes a su estado.
- [x] Ambas ramas muestran primero todas las imágenes del comprobante de línea de crédito de
  Documentación y después sus fotografías adicionales; la consulta documental conserva error y
  reintento independientes.
- [x] El error de recuperación no vacía silenciosamente la entrevista.
- [ ] Existe criterio funcional aprobado de conclusión.
- [ ] Existe cola offline durable con reinicio, reconexión y deduplicación demostrados.

## 14. Pruebas

- Unitarias: validación de actor, geolocalización, auditoría minimizada, relaciones cruzadas, estado
  del expediente y clasificación separada de evidencias para crédito activo e inactivo.
- Controlador: rutas de consulta, autoguardado, evidencia y archivo protegido.
- Migración: cadena completa hasta 032 recreada y verificada en `crelealtad_test`; reversión 032
  protegida cuando ya existen evidencias de historial crediticio.
- Regresión: typecheck API/mobile y suite integral del API.

## 15. Decisiones abiertas

- Definir campos obligatorios y criterio de `Entrevista terminada` por perfil de integrante.
- Definir política de conflictos y cola durable para edición offline o concurrente.
- Definir si una evidencia pendiente puede conservarse cifrada localmente entre reinicios antes de su confirmación.
