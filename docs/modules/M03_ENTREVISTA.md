# M03 — Entrevista de Verificación

Versión: 1.7.1
Estado: persistencia y cierre operativo derivado implementados; dictamen pendiente
Fecha de verificación: 2026-10-10

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
- Permitir terminar la captura únicamente cuando las respuestas y confirmaciones obligatorias
  aplicables estén completas y sincronizadas.
- Capturar el monto del último préstamo externo en ambas ramas y presentar toda respuesta monetaria
  de la app con el formato institucional `$ 18,000`.

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
- Asociación obligatoria de cada fotografía nueva de historial crediticio externo con una, varias
  o todas las integrantes participantes del mismo expediente, conservando un solo archivo.
- Archivos protegidos, validación real JPEG/PNG, SHA-256, idempotencia, actor y geolocalización.
- Acción `Terminar entrevista`, lista concreta de pendientes y paloma derivada en el concentrador.
- Consumo de 18 familias activas administradas en M11 para opciones, motivos y escalas; si la
  consulta no está disponible, mobile conserva el catálogo local vigente como respaldo y no simula
  que un cambio remoto fue cargado.

### No incluye

- Persistir un estado independiente de `Entrevista terminada` en PostgreSQL.
- Cambiar estados del expediente o crear un dictamen.
- Duplicar confirmaciones telefónicas o imágenes del domicilio, que conservan sus contratos existentes.
- Inventar coordenadas para fotografías históricas anteriores a la migración 031.
- Cola offline durable; el autoguardado actual necesita conexión y muestra el error cuando el servidor no confirma.

## 4. Flujo operativo

1. La API valida JWT, permiso, alcance y expediente `EN_VERIFICACION`.
2. Mobile consulta la entrevista. Si no puede recuperarla, bloquea el autoguardado para no sobrescribir información existente con un formulario vacío.
3. Cada cambio se transforma de etiqueta visible a código estable y se envía por autoguardado diferido.
   Las etiquetas configuradas en M11 no alteran esos códigos ni reescriben entrevistas anteriores.
4. La API deriva `expediente_id` desde `integrante_id`, valida relaciones y condiciones, guarda los escalares y aumenta `revision`.
5. Los cambios de familiares y desacuerdos generan eventos de alta o retiro; no eliminan historial.
6. Para una foto de negocio, control de pagos o folleto, mobile abre exclusivamente la cámara,
   registra la hora de toma y obtiene una ubicación actual. En evidencia de otra financiera permite
   tomar una fotografía o elegir una imagen del carrete; ambas fuentes exigen clasificar la vista
   previa como `VERDE`, `AMARILLO` o `ROJO` y después seleccionar una, varias o todas las integrantes
   antes de permitir el envío.
7. La API obtiene el actor del JWT, valida contenido, coordenadas y que todas las integrantes
   seleccionadas participen en el mismo expediente; guarda un solo archivo y sus asociaciones.
8. La app sólo muestra la evidencia como confirmada cuando el servidor devuelve la fila persistida.
9. En el historial crediticio externo, después de la tasa, la rama activa y la rama inactiva
   muestran su propia evidencia fotográfica. Cada elección de cámara o carrete agrega una imagen y
   ambas ramas admiten cantidad abierta sin mezclar sus historiales.
10. Mobile evalúa los campos obligatorios visibles y sus ramas. Si falta algo, lo enumera al final;
    cuando las respuestas, teléfono principal, imágenes y evidencias obligatorias están confirmados
    y sin sincronizaciones pendientes, habilita `Terminar entrevista` y regresa al concentrador.

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
| Crédito externo | `monto_ultimo_prestamo_credito_grupal` | `NUMERIC(12,2)` | Mayor o igual a cero; obligatorio en mobile cuando existe otro crédito y nullable para autoguardado parcial |
| Crédito externo | `semana_actual_credito_grupal` | `SMALLINT` | 1 a 16 |
| Crédito externo | `mes_desembolso_credito_grupal`, `mes_ultimo_pago_credito_grupal` | `SMALLINT` | 1 a 12, no se guardan nombres de meses |
| Crédito externo | `anio_ultimo_pago_credito_grupal` | `SMALLINT` | 1900 a 2200 |
| Crédito externo | `numero_ciclos_credito_grupal` | `SMALLINT` | 1 a 40 |
| Crédito externo | `tasa_credito_grupal` | `SMALLINT` | Opcional; cuando existe, valor entero de 65 a 100 |
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
| Historial CRELEALTAD | `oportunidad_mejora` | `TEXT` | Opcional; máximo 2,000 caracteres en API |
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
| `clasificacion_semaforo` | `VARCHAR(10) NULL` | `VERDE`, `AMARILLO` o `ROJO`, obligatorio por API para nueva evidencia de historial crediticio externo; `NULL` preserva el legado |
| `motivo_clasificacion_id` | `UUID NULL` | exactamente una referencia activa y del mismo color para nueva evidencia de historial crediticio externo; `NULL` preserva el legado |
| `ruta`, `mime_type`, `tamano_bytes`, `sha256` | Texto/entero | Ruta protegida, JPEG/PNG real, máximo 10 MB y hash de contenido |
| `captura_fuente` | `VARCHAR(20)` | `CAMARA`; también `GALERIA` sólo para historial crediticio externo |
| `foto_capturada_at` | `TIMESTAMPTZ NULL` | Momento de la toma para `CAMARA`; `NULL` en `GALERIA` porque no se inventa la fecha original |
| `ubicacion_latitud` | `NUMERIC(10,7)` | -90 a 90 |
| `ubicacion_longitud` | `NUMERIC(11,7)` | -180 a 180 |
| `ubicacion_precision_metros` | `NUMERIC(10,2)` | Opcional, nunca negativa |
| `ubicacion_capturada_at` | `TIMESTAMPTZ` | Momento de la lectura de ubicación |
| `ubicacion_fuente` | `VARCHAR(20)` | `DISPOSITIVO` |
| `registrada_por` | `UUID` | Usuario autenticado que realiza y registra la entrevista |
| `idempotency_key` | `VARCHAR` existente | Única por actor para no duplicar reintentos |
| `legado_sin_ubicacion` | `BOOLEAN` | `TRUE` sólo para archivos anteriores a 031; nunca se fabrican coordenadas |
| `expediente_id` | `UUID` | Derivado por servidor; limita por FK compuesta las asociaciones de la evidencia |
| `created_at` | `TIMESTAMPTZ` | Confirmación del servidor |

La restricción de base exige para toda fila nueva: cámara, hora de foto, latitud, longitud, hora de ubicación y fuente. La precisión puede ser nula si el sistema operativo no la informa.

`verificacion_entrevista_evidencia_integrantes` relaciona un archivo con cada integrante a quien
corresponde, conserva `asociada_por` y `created_at`, y evita duplicados mediante la llave primaria
`(evidencia_id, integrante_id)`. Sus FKs compuestas impiden asociar otro expediente. En los tipos de
historial crediticio el conjunto no puede estar vacío; los demás tipos generan sólo la asociación
con la integrante entrevistada. `activo`, `actualizada_por` y `updated_at` permiten corregir el
conjunto sin borrar la relación previa; las consultas presentan únicamente las asociaciones activas.
Cada asociación activa puede conservar `calificacion_revision` (`TACHA`, `AMARILLO` o `PALOMITA`),
`calificada_por` y `calificada_at`. Los tres campos permanecen juntos o nulos; por ello el legado
no recibe una decisión inventada y una evidencia compartida se califica independientemente para
cada integrante.

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
| `IntegranteVerificacionScreen` con secciones de Entrevista | T5 + T8 parcial | Coordinar y recuperar la entrevista individual; Preguntas generales, Historial crediticio, Datos personales, Ingresos y Encuestas se renderizan en componentes propios, con visores/diálogos aislados y estado tipado en un hook | Responder, seleccionar integrantes, tomar/ver/reintentar fotos, volver al concentrador |

## 8. API y persistencia

- `GET /verificacion/integrantes/:integranteId/entrevista`: recupera respuestas, relaciones activas y revisión.
- `PUT /verificacion/integrantes/:integranteId/entrevista`: autoguarda el DTO tipado.
- `GET /verificacion/integrantes/:integranteId/entrevista/evidencias`: lista metadatos autorizados.
- `POST /verificacion/integrantes/:integranteId/entrevista/evidencias`: alta multipart idempotente y geolocalizada.
- `PUT /verificacion/integrantes/:integranteId/entrevista/evidencias/:evidenciaId/integrantes`:
  reemplaza el conjunto activo de integrantes de una evidencia de historial externo, sin borrar
  archivo ni historia de asociaciones.
- `PUT /verificacion/integrantes/:integranteId/entrevista/evidencias/:evidenciaId/calificacion`:
  guarda `TACHA`, `AMARILLO` o `PALOMITA` exclusivamente en la asociación activa de esa integrante.
- `GET /verificacion/integrantes/:integranteId/entrevista/evidencias/:evidenciaId/archivo`: lectura autenticada del archivo protegido.
- Migraciones: `031_persistencia_general_entrevista.sql`, `032_evidencias_historial_credito.sql` y
  `047_evidencia_otra_financiera_integrantes.sql` más
  `048_historial_asignaciones_evidencia.sql` y
  `054_monto_ultimo_prestamo_credito_externo.sql` más
  `061_calificacion_evidencia_por_integrante.sql` y
  `062_calificacion_amarilla_evidencia.sql`, todas con rollback protegido cuando pueden perder datos.
- Auditoría: registra actor, integrante, revisión, nombres de campos modificados y referencia de evidencia; no copia respuestas personales ni coordenadas exactas al `audit_log`.

## 9. Reglas de negocio

- PostgreSQL conserva códigos estables; mobile es responsable sólo de traducir etiquetas visibles.
- El selector de financiera externa combina el catálogo local de respaldo con las financieras
  activas publicadas por M11; la clasificación no se persiste dentro de Entrevista y se resuelve
  temporalmente en Conclusiones según la fecha de captura.
- Teléfonos son texto de diez caracteres, no números.
- Importes son `NUMERIC(12,2)`, nunca `float`. Las respuestas monetarias se capturan y presentan
  como pesos enteros mediante `$ 18,000`; la capa visual no altera la precisión almacenada de otros contratos.
- Meses, semanas, ciclos, años y tasa son enteros acotados.
- La tasa de otra financiera es opcional en ambas ramas: puede quedar `NULL` y no bloquea
  `Terminar entrevista`; si se captura, debe estar dentro de 65 a 100.
- Campos `NULL` representan captura pendiente.
- Los UUID relacionados se derivan o validan contra el mismo expediente.
- Cada evidencia nueva de otra financiera exige al menos una integrante; seleccionar varias no
  duplica el archivo y la consulta lo presenta en todas las seleccionadas.
- Antes de elegir integrantes, cada evidencia nueva de otra financiera exige `VERDE`, `AMARILLO` o
  `ROJO` y después exactamente un motivo activo del mismo color administrado en M11. Sin concepto
  disponible la continuación permanece bloqueada. La clasificación y su motivo pertenecen a la
  fotografía, no determinan un dictamen y se presentan con
  franjas superior/inferior más el nombre visible y accesible del color. Entrevista abre la variante
  inmersiva blanca de `DocumentViewer`, con encabezado compacto y `X`; Conclusiones conserva el panel
  blanco. Todas las páginas reservan exactamente una banda superior de 64 px y una franja inferior
  de controles de 72 px; las páginas neutrales las muestran blancas y las clasificadas aplican el
  semáforo sólo en esas dos bandas, nunca en los laterales ni en el espacio libre de la fotografía.
  Así la zona útil de todas las imágenes conserva el mismo alto y `Integrantes` y zoom nunca cubren
  la foto. Al `100 %`, las fotografías se recorren mediante deslizamiento
  horizontal. Desde que inicia un pellizco y mientras el zoom sea mayor al `100 %`, la paginación se
  bloquea y el arrastre mueve sólo la imagen activa; no se muestra parcialmente una foto vecina.
  El motivo persistido se muestra centrado, fuerte y en negro dentro de la banda superior;
  `Integrantes` y los controles de zoom se centran visualmente en la banda inferior. El legado sin
  motivo permanece sin texto añadido.
- Desde el visor, `Integrantes` permite corregir sólo las fotografías propias de Entrevista; los
  comprobantes heredados de Documentación permanecen de consulta.
- Desmarcar una relación la desactiva, genera auditoría y no borra la fila anterior ni el archivo.
- La tacha roja, advertencia amarilla o palomita verde del visor pertenece a una sola combinación
  evidencia–integrante. Puede
  corregirse, registra antes/después en auditoría y no sustituye el semáforo ni su motivo.
- Sólo las fotografías confirmadas de Entrevista son calificables. Las imágenes de Documentación
  se muestran en el mismo visor, pero permanecen de consulta.
- `Cerrar` permanece habilitado para salir del visor aun cuando existan fotografías pendientes de
  calificación; abandonar la vista no inventa ni modifica decisiones.
- Una foto nueva sin ubicación no se guarda. La descripción textual del negocio no cuenta como geolocalización.
- Ninguna foto opcional determina por sí sola que la Entrevista terminó.
- `¿En qué cree usted que podemos mejorar?` permanece visible cuando aplica la encuesta de servicio,
  pero su respuesta es opcional y no formará parte del criterio de conclusión.
- El teléfono secundario, los datos de la asesora de otra financiera, la ubicación escrita del
  negocio y las fotografías opcionales de negocio u otra financiera no bloquean la terminación.
- Una evidencia opcional ya iniciada debe terminar de guardarse antes de habilitar el cierre.
- La paloma de Entrevista se deriva del criterio vigente; no es un dictamen ni un cambio de estado.
- `¿Cómo conoció a la asesora?` se abre automáticamente sólo al elegir `Sí` cuando el seguimiento
  todavía está vacío; nunca por abrir, consultar o restaurar una entrevista ya contestada.
- La misma regla aplica a todos los selectores condicionales de Entrevista: ninguno se autoabre al
  restaurar; una respuesta existente se corrige tocando su renglón y una captura nueva vacía puede
  abrirse inmediatamente desde la respuesta que la habilita.

## 10. Permisos y seguridad

| Acción | Condición | Auditoría |
|---|---|---|
| Consultar | JWT, `verificacion:ver`, alcance sobre integrante | Acceso sujeto a guard y alcance |
| Guardar respuestas | JWT, `verificacion:registrar`, expediente vigente | Actor, revisión y campos modificados |
| Registrar foto | Igual, JPEG/PNG válido, coordenadas válidas | Actor, tipo, evidencia y metadatos no sensibles |
| Corregir integrantes | Igual, evidencia accesible y UUID del mismo expediente | Conjunto anterior/nuevo, actor y fecha |
| Calificar evidencia | Igual, asociación activa de historial externo | Integrante, valor anterior/nuevo, actor y fecha |
| Leer archivo | JWT, permiso, alcance y pertenencia | Ruta física nunca se expone como URL pública |

## 11. Estados técnicos de UI

- Carga: recuperar primero respuestas y evidencias.
- Error de recuperación: informar y no iniciar autoguardado destructivo.
- Autoguardado: mostrar guardando, guardado confirmado o error con reintento.
- Fotografía: pendiente local, pendiente de clasificación y motivo cuando corresponde, pendiente
  de integrantes, obteniendo ubicación, enviando, confirmada o error.
- Cancelar la selección posterior a una toma de otra financiera descarta esa fotografía local y
  permite repetirla; no genera envío, asociación ni estado pendiente.
- Historial externo: crédito activo e inactivo conservan listas, pendientes y errores separados;
  cambiar la respuesta visible no elimina fotografías ya confirmadas.
- Sin conexión: no simular éxito; la cola offline durable continúa pendiente.
- Sin permiso: la API rechaza aunque la pantalla se haya abierto por estado local desactualizado.
- Incompleta: el botón `Terminar entrevista` permanece visible y deshabilitado, con una lista exacta
  de respuestas, evidencias o sincronizaciones pendientes.
- Completa: el botón se habilita y la paloma se deriva de datos confirmados, sin crear otro registro.

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
- [x] Toda evidencia nueva propia de Entrevista exige coordenadas actuales y actor; cámara registra
  la hora de toma y galería conserva `foto_capturada_at = NULL`.
- [x] Los archivos son protegidos, validados e idempotentes.
- [x] Las ramas activa e inactiva del crédito externo permiten agregar fotografías sin límite y
  recuperan únicamente las correspondientes a su estado.
- [x] Las ramas activa e inactiva preguntan el monto del último préstamo después de la ficha, lo
  autoguardan, restauran y muestran en Conclusiones con el formato monetario institucional.
- [x] La tasa de otra financiera no muestra asterisco y puede quedar vacía sin impedir el cierre;
  un valor capturado conserva el catálogo entero de 65 a 100 y su persistencia vigente.
- [x] Ambas ramas de otra financiera permiten cámara o carrete y registran la fuente real; la API
  rechaza `GALERIA` para negocio, control de pagos y folleto.
- [x] Ambas ramas muestran primero todas las imágenes del comprobante de línea de crédito de
  Documentación y después sus fotografías adicionales; la consulta documental conserva error y
  reintento independientes.
- [x] Cada fotografía nueva de otra financiera obliga a elegir una, varias o todas las integrantes;
  la API rechaza el conjunto vacío y los UUID de otro expediente.
- [x] Antes del selector de integrantes, cada fotografía nueva de otra financiera obliga a elegir
  `VERDE`, `AMARILLO` o `ROJO`; la API lo persiste por archivo y carrusel/visor muestran franjas y
  texto accesible sin clasificar retroactivamente el legado.
- [x] Después del color exige exactamente un motivo activo del mismo catálogo; sin opción no permite
  continuar y las evidencias históricas conservan motivo `NULL`.
- [x] Entrevista y Conclusiones reutilizan `DocumentViewer`: Entrevista usa la variante inmersiva
  blanca y Conclusiones el panel blanco. Todas las evidencias reservan bandas superior/inferior
  idénticas; una evidencia clasificada aplica su semáforo sólo a esas bandas, sin color lateral,
  aloja los controles en la banda inferior y permite cambiar de fotografía mediante deslizamiento
  horizontal sólo al `100 %`; el pellizco y el zoom bloquean el carrusel en la evidencia activa.
- [x] El motivo persistido aparece centrado, fuerte y en negro dentro de la franja superior; los
  controles de integrantes y zoom quedan centrados visualmente en la franja inferior y el legado
  sin motivo no recibe texto inventado.
- [x] El visor permite corregir las integrantes de una fotografía propia, conserva al menos una y
  no muestra la acción en comprobantes heredados de Documentación.
- [x] El error de recuperación no vacía silenciosamente la entrevista.
- [x] Existe criterio funcional aprobado de terminación operativa, lista de faltantes y paloma
  derivada sin estado paralelo.
- [ ] Existe cola offline durable con reinicio, reconexión y deduplicación demostrados.

## 14. Pruebas

- Unitarias: validación de actor, geolocalización, auditoría minimizada, relaciones cruzadas, estado
  del expediente, clasificación separada de evidencias y criterio de completitud por ramas.
- Componente: el selector de cómo conoció a la asesora no se abre al restaurar y sí puede abrirse
  después de una selección nueva de `Sí`.
- Controlador: rutas de consulta, autoguardado, evidencia y archivo protegido.
- Migración: la 054 pasó aplicación, rollback protegido y reaplicación en `crelealtad_test`; después
  de un respaldo custom verificado se aplicó en `crelealtad`. Ambas bases quedaron sin pendientes,
  drift ni entradas desconocidas. La reversión de 048 continúa bloqueada si existen asociaciones
  inactivas para no resucitar relaciones retiradas.
- Regresión: typecheck API/mobile y suite integral del API.

## 15. Decisiones abiertas

- Definir si en el futuro se requiere persistir un estado formal de Entrevista independiente del
  criterio derivado de mobile.
- Definir política de conflictos y cola durable para edición offline o concurrente.
- Definir si una evidencia pendiente puede conservarse cifrada localmente entre reinicios antes de su confirmación.
