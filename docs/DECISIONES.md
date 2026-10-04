# DECISIONES DE ARQUITECTURA - CRELEALTAD CORE

Registro cronológico de decisiones cerradas. Toda propuesta que contradiga una
decisión CERRADA debe detenerse y reportarse a Ricardo para revisión.

---

## 2026-08-06 | Nombres de pila en UN SOLO campo

**DECISION**: Los nombres de pila van en un único campo `nombres`. Los apellidos
van separados en `apellido_pat` y `apellido_mat`. La columna `nombre_completo`
es GENERATED ALWAYS concatenando nombres + apellido_pat + apellido_mat.

**MOTIVO**: Los nombres compuestos (María del Socorro, Juan Carlos) y las
personas con tres nombres no se pueden partir de forma confiable. Los apellidos
separados son necesarios porque CURP, RFC e INE se arman con ellos, y las listas
de cobranza se ordenan por apellido_pat.

**ALTERNATIVAS DESCARTADAS**:
- Separar nombres de pila en `primer_nombre` y `segundo_nombre`: no funciona
  con nombres compuestos ni con tres nombres. Implementado, revertido.
- Concatenar apellidos en un solo campo: no funciona para CURP/RFC ni para
  ordenamiento de cobranza.

**ESTADO**: CERRADA

**UBICACION**:
- personas.nombres, personas.apellido_pat, personas.apellido_mat
- solicitudes_datos_personales.nombres, apellido_pat, apellido_mat
- primer_nombre y segundo_nombre son columnas LEGACY pendientes de eliminar

---

## 2026-08-06 | personas es identidad permanente, monto_solicitado es prospeccion

**DECISION**: La tabla `personas` almacena identidad permanente con folio inmutable.
El campo `personas.monto_solicitado` es PROSPECTIVO: lo que la clienta pretende
en el primer acercamiento. Este monto se sobrescribe y NO es el monto formal.

**MOTIVO**: El monto formal vive en `solicitudes.monto_solicitado` y
`solicitudes.monto_autorizado`. La persona puede tener múltiples solicitudes en
diferentes ciclos, cada una con su propio monto. El monto en personas es solo
captura inicial.

**ALTERNATIVAS DESCARTADAS**:
- Tratar personas.monto_solicitado como monto formal: se sobrescribe al crear
  solicitudes, causando pérdida de datos históricos.

**ESTADO**: CERRADA

---

## 2026-08-06 | Estructura de solicitudes: core + 7 tablas hijas

**DECISION**: Solicitudes normalizadas en 8 tablas:
- `solicitudes` (core): 13 columnas con FKs e integrante_id, persona_id,
  expediente_id, grupo_id
- `solicitudes_datos_personales`: 17 columnas
- `solicitudes_domicilios`: 14 columnas
- `solicitudes_negocios`: 18 columnas
- `solicitudes_referencias`: 15 columnas
- `solicitudes_beneficiarios`: 8 columnas
- `solicitudes_validaciones`: 7 columnas
- `solicitudes_documentos`: 12 columnas

Todas las tablas hijas usan UPSERT por `solicitud_id`.
Vista `solicitudes_completo` une las 8 tablas con LEFT JOIN.

**MOTIVO**: Separar datos de alta cardinalidad (direcciones, referencias,
negocios) de los datos core para mejorar rendimiento. Permite PATCH parcial
sin tocar todos los campos. Upsert simplifica lógica de actualización.

**ALTERNATIVAS DESCARTADAS**:
- Tabla única desnormalizada: demasiados campos (91+), actualizaciones lentas.
- JSON/JSONB: no permite validación de esquema en BD, dificulta queries.

**ESTADO**: CERRADA

---

## 2026-08-06 | Nombres de campo en español y snake_case

**DECISION**: TODOS los nombres de campo en base de datos, DTOs, entities y API
usan español y snake_case. La fuente de verdad es la COLUMNA EN POSTGRESQL.
DTOs, service, frontend y cualquier mapeo se alinean a la base, NUNCA al revés.

**MOTIVO**: Consistencia entre backend y base de datos. Los nombres de columnas
PostgreSQL son snake_case por convención. Mezclar inglés y español causa
confusión. El dominio del negocio es en español (tesorera, ciclo, expediente).

**ALTERNATIVAS DESCARTADAS**:
- camelCase en DTOs y snake_case en BD: genera desalineación y errores de mapeo.
- Inglés en API y español en BD: no refleja el dominio real del negocio.

**EXCEPCIONES LEGACY**: name, email, password en módulo de auth (pendiente migrar).

**ESTADO**: CERRADA

---

## 2026-08-06 | numero_credito y credito_id solo los escribe el backend en desembolso

**DECISION**: Los campos `numero_credito` y `credito_id` en `solicitudes` SOLO
los escribe el backend durante el desembolso real. NUNCA llegan del frontend.
NUNCA se permite que el frontend los envíe.

**MOTIVO**: Son secuenciales y controlados por el backend. El desembolso es un
proceso crítico que genera el crédito activo. Permitir que el frontend los
envíe abriría riesgo de colisiones y datos inconsistentes.

**ALTERNATIVAS DESCARTADAS**:
- Permitir que el frontend proponga numero_credito: riesgo de colisión, no es
  secuencial garantizado.

**ESTADO**: CERRADA

---

## 2026-08-06 | Ciclos nacen únicamente al desembolso real

**DECISION**: Un ciclo nace ÚNICAMENTE cuando se desembolsa un crédito activo.
NO se crean ciclos hasta que hay un crédito activo.

**MOTIVO**: El ciclo representa un crédito activo con flujo de pagos. Crear
ciclos antes del desembolso genera registros fantasma sin significado operativo.

**ALTERNATIVAS DESCARTADAS**:
- Crear ciclo al autorizar solicitud: el ciclo quedaría sin credito_id si no
  se desembolsa.

**ESTADO**: CERRADA

---

## 2026-08-06 | Histórico de crecimiento de línea por persona_id + numero_credito

**DECISION**: El histórico de crecimiento de línea se reconstruye por
`persona_id` + `numero_credito`. Constraint UNIQUE en `creditos_historico`
sobre `(persona_id, numero_credito)`.

**MOTIVO**: Una persona puede tener múltiples créditos secuenciales. El
crecimiento de línea se determina comparando el monto del crédito N con N-1.
El constraint UNIQUE garantiza que no haya duplicados por crédito.

**ALTERNATIVAS DESCARTADAS**:
- Histórico por solicitud_id: las solicitudes pueden rechazarse, el histórico
  solo debe incluir créditos desembolsados.

**ESTADO**: CERRADA

---

## 2026-08-06 | FK con ON DELETE RESTRICT - NO se borra información

**DECISION**: En CRELEALTAD NO SE BORRA INFORMACIÓN. Todas las foreign keys
críticas usan `ON DELETE RESTRICT`:
- solicitudes.persona_id -> personas.id
- solicitudes.expediente_id -> expedientes.id
- solicitudes.grupo_id -> grupos.id
- solicitudes.credito_id -> creditos.id
- solicitudes.integrante_id -> integrantes.id

Todos los registros son inmutables desde el punto de vista operativo.

**MOTIVO**: Auditoría, histórico, trazabilidad legal. Borrar información rompe
el histórico de créditos y pagos. Las regulaciones financieras requieren
conservar registros.

**ALTERNATIVAS DESCARTADAS**:
- ON DELETE CASCADE: destruye histórico.
- ON DELETE SET NULL: rompe integridad referencial.

**EXCEPCIONES**: Las tablas hijas de solicitudes usan ON DELETE CASCADE porque
son hijas directas y no tienen sentido sin la solicitud padre.

**ESTADO**: CERRADA

---

## 2026-08-06 | Backend deriva persona_id, expediente_id y grupo_id desde integrante

**DECISION**: Los campos obligatorios `persona_id`, `expediente_id`, `grupo_id`
en `solicitudes` NO vienen del frontend. El backend los deriva del
`integrante_id` que viene en la URL.

**MOTIVO**: El integrante ya tiene persona_id y expediente_id. El expediente
tiene grupo_id. Pedirle al frontend que los envíe es redundante y riesgoso
(podría enviar IDs inconsistentes).

**ALTERNATIVAS DESCARTADAS**:
- Permitir que el frontend envíe los 4 campos: riesgo de inconsistencia si el
  frontend envía persona_id distinta a la que tiene el integrante.

**ESTADO**: CERRADA

---

## 2026-08-06 | GET arma respuesta plana con relations, no con vista

**DECISION**: El endpoint `GET /solicitudes/:id` usa TypeORM relations para
armar la respuesta plana, NO usa la vista `solicitudes_completo`.

**MOTIVO**: La vista tiene 13 columnas core pero no tiene las 7 tablas hijas
completas. Relations permite devolver TODOS los campos de las 8 tablas (91 campos).
La vista solo sirve para listar solicitudes con campos básicos.

**ALTERNATIVAS DESCARTADAS**:
- Usar solicitudes_completo para GET: solo devolvería 13 columnas, perdería los
  otros 78 campos de las tablas hijas.

**ESTADO**: CERRADA

---

## 2026-08-06 | Estados de integrantes y transición a SUJETA_CREDITO

**DECISION**: Estados válidos:
- DOCUMENTANDO (default al crear)
- SUJETA_CREDITO (solicitud completa con 7 pasos validados)
- EN_VERIFICACION
- AUTORIZADA
- RECHAZADA

Transición a SUJETA_CREDITO validada por backend:
- Paso 1: curp + fecha_nac + genero
- Paso 2: dom_calle + dom_colonia + dom_municipio
- Paso 3: ref1_nombre + ref2_nombre
- Paso 4: negocio_giro + negocio_ingreso_semanal
- Paso 5: beneficiario_nombre + beneficiario_parentesco
- Paso 6: tiene_medidor_luz + vive_max_5km_tesorera (not null)
- Paso 7: 4 documentos (doc_ine_ruta, doc_comprobante_ruta,
  doc_ine_beneficiario_ruta, doc_solicitud_firmada_ruta)

El backend rechaza con 400 y devuelve pasosIncompletos y camposFaltantes si falta algo.

**MOTIVO**: La transición a SUJETA_CREDITO certifica que la solicitud está lista
para verificación. No permitir transición parcial evita que solicitudes incompletas
avancen en el flujo.

**ALTERNATIVAS DESCARTADAS**:
- Permitir transición a SUJETA_CREDITO sin validar pasos: genera solicitudes
  inválidas en verificación, desperdicia tiempo de analistas.

**ESTADO**: CERRADA

---

## ABIERTA | Validaciones como VARCHAR(20) en lugar de BOOLEAN

**DECISION PENDIENTE**: Las 3 validaciones en `solicitudes_validaciones` están
definidas como VARCHAR(20):
- tiene_medidor_luz
- vive_max_5km_tesorera
- tiene_menos_70_anios

Valores actuales: "SI", "NO" (strings sin restricción formal).

**PROBLEMA**: VARCHAR libre acepta "Si", "si", "S", "YES", "1", o cualquier basura.
El esquema de diseño original indica que deberían ser BOOLEAN.

**ALTERNATIVAS**:
- Opción A: Migrar a BOOLEAN (alineado con diseño original, requiere cambios en
  backend y frontend)
- Opción B: Mantener VARCHAR con CHECK constraint IN ('SI', 'NO') (mínimo cambio,
  no corrige desalineación)

**ESTADO**: ABIERTA - requiere aprobación de Ricardo

**UBICACION**: docs/INCONSISTENCIAS.md

---

## 2026-08-06 | Validación de documentos: solo rutas de servidor (Opción A → B)

**DECISION**: La validación de solicitudes completas rechaza rutas locales del dispositivo
(prefijos `storage:`, `file://`, `content://`) en los 4 campos de documentos obligatorios.
Solo acepta rutas de servidor. Las solicitudes quedan en DOCUMENTANDO hasta que los
documentos se suban al servidor.

**MOTIVO**: Evitar expedientes marcados como completos con documentos inexistentes del lado
del servidor. Sin esta validación, una solicitud puede pasar a SUJETA_CREDITO con documentos
que solo existen en AsyncStorage del teléfono, perdiéndose al reinstalar la app o cambiar
de dispositivo. Esto representa riesgo operativo y legal crítico: no se puede verificar
identidad, domicilio ni firmas después.

**IMPLEMENTACION ACTUAL (Opción A)**:
- Helper `esRutaServidor()` rechaza prefijos locales
- Validación en `validarSolicitudCompleta()` usa el helper para Paso 7
- Mensajes legibles para asesoras: "INE de la integrante - pendiente de subir"
- Frontend muestra badge "⚠️ PENDIENTE DE SUBIR" en documentos locales
- El botón "Marcar como Capturado" muestra el mensaje de validación del backend

**ROADMAP HACIA OPCION B (Captura offline + sincronización)**:
Esta es una solución intermedia. El objetivo final es permitir captura offline con
sincronización posterior, porque las asesoras trabajan en la calle con señal irregular.

Próximos pasos cuando se implemente upload:
1. Agregar columna `documentos_origen` ENUM('LOCAL', 'SERVIDOR')
2. Crear estado intermedio DOCUMENTOS_PENDIENTES
3. Modificar `esRutaServidor()` para aceptar locales con origen='LOCAL'
4. Solo SUJETA_CREDITO requiere origen='SERVIDOR'
5. Flujo de sincronización para subir documentos pendientes

**ALTERNATIVAS DESCARTADAS**:
- Opción B directo (estado DOCUMENTOS_PENDIENTES): más complejo, requiere migración.
  Se implementará después.
- Opción C (bloqueo total): bloquea captura completa hoy, requiere upload urgente.

**ESTADO**: CERRADA (implementada Opción A como paso intermedio hacia B)

**UBICACION**:
- Backend: apps/api/src/integrantes/integrantes.service.ts
  - Helper privado `esRutaServidor()`
  - Helper privado `obtenerEtiquetaLegible()` para mensajes en español
  - Validación en `validarSolicitudCompleta()` líneas 295-314
- Frontend: apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx
  - Badge en documentos locales
  - Mensaje en Alert cuando falta Paso 7

---

## 2026-08-06 | Diseño visual sobre mensajes de texto

**DECISION**: La app se guía por elementos visuales (botones, etiquetas, colores), NO
por mensajes de texto. El estado se comunica visualmente, no con alerts ni instrucciones.

**MOTIVO**: La presencia/ausencia de controles comunica más rápido que leer texto. Las
asesoras trabajan en campo con prisas. Un botón "Ver" presente = documento existe; botón
ausente = falta documento. NO requiere leer instrucciones.

**CUANDO SE JUSTIFICA TEXTO**: Solo cuando comunica algo sin equivalente visual, como
riesgo de pérdida de datos, advertencias críticas, o explicación de un error.

**ALTERNATIVAS DESCARTADAS**:
- Alerts explicativos cuando el estado ya es visible: ruido innecesario, ralentiza flujo.

**ESTADO**: CERRADA

**EJEMPLOS APLICADOS**:
- Badge "⚠️ PENDIENTE DE SUBIR" en documentos locales (SolicitudFormScreen.tsx)
- Botón "Ver" presente solo cuando hay documento capturado
- NO mostrar alert cuando pase validación exitosa (el cambio de paso es suficiente)

---

## 2026-08-27 | Monto individual histórico por ciclo

**DECISION**: El monto individual histórico es `solicitudes.monto_autorizado`:
el monto efectivamente prestado a la integrante durante ese ciclo. No se obtiene
de `personas.monto_solicitado`, que conserva su carácter prospectivo.

Al iniciar una renovación, el monto autorizado del ciclo anterior puede
precargarse como `monto_solicitado` de la nueva solicitud. Esta precarga no
autoriza el nuevo crédito.

**ESTADO**: CERRADA

---

## 2026-08-27 | Relación única entre ciclo y expediente

**DECISION**: Todo ciclo debe referenciar exactamente un expediente y ese
expediente no puede originar otro ciclo. El ciclo y el expediente deben pertenecer
al mismo grupo. Un expediente sí puede existir sin ciclo mientras atraviesa
documentación, verificación y análisis; el ciclo se crea únicamente al desembolso.

La relación usa `ON DELETE RESTRICT` para conservar historial y auditoría.

**ESTADO**: CERRADA

---

## 2026-08-28 | Captura explícita del monto solicitado en Paso 6

**DECISION**: El monto existente antes del Paso 6 es una referencia, no una captura formal.
En renovación se muestra el `monto_autorizado` del ciclo anterior; en grupo nuevo se
muestra el monto prospectivo registrado al integrar a la solicitante. El campo de
`monto_solicitado` inicia vacío y el asesor debe capturarlo. La API registra la fecha de
confirmación para distinguir una referencia precargada de un monto ya capturado.

**MOTIVO**: Evitar que la precarga del ciclo anterior avance como si el asesor hubiera
confirmado el monto del nuevo ciclo y permitir que solicite el mismo importe sin perder
la evidencia de captura.

**ESTADO**: CERRADA

---

## 2026-08-29 | Acceso temporal amplio a módulos ejecutables

**DECISION**: Durante la etapa actual de desarrollo, todos los usuarios activos pueden
acceder a los módulos que ya sean ejecutables. En el corte actual, Documentación ya está
habilitada para los asesores y se agrega `verificacion:leer` al rol `ASESOR` para que
todos ellos puedan abrir la bandeja y las pantallas de Verificación disponibles.

La API conserva JWT, guard global y permisos efectivos; no se habilitan módulos marcados
como `Próximamente`, usuarios inactivos, dictámenes, transiciones ni acciones que todavía
no tengan contrato implementado. Mientras esta decisión siga vigente, cada módulo nuevo
deberá incorporar de forma explícita y auditable el acceso temporal correspondiente.

**MOTIVO**: Permitir pruebas operativas completas de los módulos en construcción antes de
definir y aplicar la matriz restrictiva definitiva por rol, acción y territorio.

**REVERSIÓN**: La matriz definitiva sustituirá esta excepción temporal. La migración de
Verificación conserva el valor anterior en `audit_log` y cuenta con rollback condicionado
para no sobrescribir cambios posteriores.

**ESTADO**: CERRADA Y TEMPORAL

---

## 2026-08-29 | Confirmación de participantes antes de Verificación

**DECISION**: Antes de enviar un expediente a Verificación, la asesora confirma quiénes
participarán en el ciclo. Una persona que descansa o no concluyó su documentación se
mantiene dentro del expediente con estado `RETIRADA`, motivo controlado, actor y fecha;
no se elimina ni se altera su identidad o historial de ciclos anteriores.

Los motivos vigentes son `DESCANSA_RENOVACION`, `DOCUMENTACION_INCOMPLETA`,
`DECIDIO_NO_CONTINUAR` y `OTRO`; este último exige detalle. Una integrante completa o
pendiente puede retirarse mientras el expediente está `EN_DOCUMENTACION`. El reintegro
es un evento formal que recalcula la completitud y la devuelve a `SUJETA_CREDITO` o
`DOCUMENTANDO` según sus evidencias vigentes.

El handoff ignora las retiradas, bloquea cualquier pendiente no resuelta y exige al menos
una integrante completa. La pantalla muestra cantidad y suma de montos al pie de cada
sección, sin un resumen superior de recuadros. El mínimo parametrizado de RN-014 no se
hardcodea y permanece pendiente de M11/producto vigente.

**MOTIVO**: Las renovaciones conservan integrantes del ciclo anterior que descansan y
capturas que no siempre se concluyen. La operación necesita continuar sin perder historial,
sin convertir una falta documental en borrado y sin enviar personas no confirmadas.

**ESTADO**: CERRADA E IMPLEMENTADA

---

## 2026-08-30 | Las restricciones individuales no cambian el rol operativo

**DECISION**: El encabezado y el alcance operativo muestran y aplican el rol real de la
persona. Una restricción individual de módulos no crea ni asigna un rol alterno. El usuario
conserva `usuarios.rol_id` y, cuando exista una excepción autorizada, la API calcula sus
permisos efectivos desde `usuarios.permisos_personalizados` antes de recurrir a
`roles.permisos`.

Para la prueba vigente, Guadalupe Barrón conserva el rol `ASESOR`, mantiene Documentación,
Expedientes y Solicitudes, y no recibe el módulo Verificación. La excepción no amplía los
permisos de otras cuentas ni cambia la propiedad o el estado de expedientes.

**MOTIVO**: Un rol técnico alterno se mostró en el encabezado y desactivó el alcance por
asesora de `Mis Expedientes`, exponiendo una bandeja institucional de grupos. Rol, permiso
y propiedad operativa son responsabilidades distintas.

**ESTADO**: CERRADA E IMPLEMENTADA

---

## 2026-08-30 | Etiquetas y retorno para revisión documental

**DECISION**: En las tarjetas de integrantes de Verificación, las incidencias visibles se
denominan `REVISAR DOCUMENTACIÓN` y los resultados negativos ya existentes se muestran
como `NO APROBADA`. En el detalle de expediente de Documentación se usan las mismas
etiquetas; `REVISAR DOCUMENTACIÓN` toma los colores del módulo Verificación, `RETIRADA`
conserva su paleta gris y `NO APROBADA` usa la paleta roja institucional.

Cuando Verificación detecta documentos faltantes o inconsistentes, la API devuelve a la
integrante de `SUJETA_CREDITO` a `DOCUMENTANDO` sin sacar al expediente de
`EN_VERIFICACION`. El asesor puede corregir únicamente esa integrante. Al concluir de
nuevo los siete pasos, la validación del servidor la devuelve a `SUJETA_CREDITO` y ambas
pantallas dejan de mostrar automáticamente `REVISAR DOCUMENTACIÓN`. Solicitud y conclusión
quedan registradas en `audit_log` con actor y estado del expediente.

La devolución identifica los documentos observados. La API retira únicamente sus rutas
activas para que Documentación muestre los espacios pendientes y obligue a reemplazarlos;
los archivos anteriores no se eliminan físicamente y sus referencias quedan en auditoría.
Cuando la integrante vuelve a Verificación se revisa nuevamente todo el Paso 1.

Antes de solicitar la devolución, el verificador debe responder `Sí` o `No` para los cuatro
documentos del Paso 1. La acción `Revisar documentación` sólo se habilita cuando los cuatro
fueron revisados y al menos uno tiene respuesta `No`; únicamente los documentos con `No`
se envían como observados.

Esta decisión no habilita el dictamen de rechazo: `NO APROBADA` es el texto visible para
un estado `RECHAZADA` ya persistido; crear ese resultado continúa bloqueado hasta aprobar
el contrato de dictamen, motivo y permisos.

**MOTIVO**: La devolución documental debe ser visible para asesor y verificador, sobrevivir
sesiones y desaparecer sólo después de una validación completa confirmada por servidor.

**ESTADO**: CERRADA E IMPLEMENTADA

---

## 2026-08-31 | Bandeja personal de revisión documental

**DECISION**: El asesor responsable recibe una bandeja central denominada `PENDIENTES
PARA TI` cuando Verificación devuelve una o más integrantes mediante `REVISAR
DOCUMENTACIÓN`. La bandeja aparece antes de los módulos en el menú principal, agrupa por
grupo, muestra cantidad de integrantes y antigüedad, y permite abrir directamente el
expediente. Todas las pantallas autenticadas muestran un contador rojo sobre el avatar y
ese indicador abre la misma bandeja.

El destinatario se deriva de `expedientes.asesora_id → empleados.usuario_id`. Un pendiente
existe sólo mientras el expediente continúa `EN_VERIFICACION`, la integrante está
`DOCUMENTANDO` y existe el evento auditado `REV_DOC_SOLICITADA`. Al volver a
`SUJETA_CREDITO` desaparece automáticamente. El contador representa integrantes con una
corrección abierta, no mensajes sin leer; por tanto no existe acción de marcar como leído
ni una tabla paralela de mensajería.

Esta etapa no incluye rechazo, opinión del asesor, chat, notificación push ni dictamen. La
API es de sólo lectura, exige `expedientes:leer` y limita el resultado al usuario
autenticado. No requiere migración porque reutiliza el estado canónico y `audit_log`.

**MOTIVO**: El asesor necesita detectar y atender devoluciones documentales desde
cualquier pantalla sin saturar cada módulo ni crear una segunda fuente de verdad para el
estado operativo.

**ESTADO**: CERRADA E IMPLEMENTADA

---

## 2026-08-31 | Identidad gris para Login y Menú principal

**DECISION**: Login y Menú principal son superficies generales compartidas por todos los
usuarios y roles. Ambas usan la paleta aprobada `OPCIÓN B — GRIS PLATA CLARO`: gris
`#9CA3AF` en el encabezado, gris `#6B7280` en barras y acciones, y texto oscuro de alto
contraste. Los colores de módulo se aplican únicamente después de seleccionar y abrir el
módulo correspondiente.

La bandeja global `PENDIENTES PARA TI` usa la misma paleta general en su encabezado,
barra de título y áreas seguras. Las señales de cada pendiente conservan su color semántico;
por ejemplo, `REVISAR DOCUMENTACIÓN` mantiene la identificación visual aprobada para ese
estado operativo.

El cambio conserva estructura, componentes, contenido y comportamiento. Documentación
mantiene su tema verde dentro de su propio flujo y las tarjetas del Menú principal conservan
el color distintivo de cada módulo.

**MOTIVO**: Evitar que las pantallas generales se interpreten visualmente como parte del
módulo Documentación.

**ESTADO**: CERRADA E IMPLEMENTADA

---

## 2026-09-02 | Tesorera obligatoria por expediente y sustitución en Desembolso

**DECISION**: Antes de enviar un expediente a Verificación, Documentación debe seleccionar
exactamente una tesorera entre las integrantes completas que participarán. La asignación
pertenece al expediente y se conserva como referencia para que Verificación identifique a
la integrante y aplique sus preguntas adicionales. No se agrega una marca permanente a la
persona ni a todos sus expedientes.

Si la integrante seleccionada deja de participar antes del handoff, el sistema elimina esa
asignación y exige seleccionar otra. La API vuelve a validar, dentro de la transición a
`EN_VERIFICACION`, que la tesorera exista, pertenezca al mismo expediente y conserve el
estado participante `SUJETA_CREDITO`.

En Desembolso se debe confirmar la tesorera definitiva. Si por cualquier circunstancia
cambia en esa etapa, el expediente no regresa a Verificación: Desembolso selecciona a otra
integrante participante, registra actor, fecha, valor anterior y valor nuevo, y crea el
ciclo con la nueva persona en `ciclos.tesorera_id`. La sustitución no borra ni altera quién
fue la tesorera utilizada durante Verificación.

**MOTIVO**: La tesorera recibe una verificación distinta, pero una sustitución operativa al
momento de desembolsar no debe repetir todo el flujo ya concluido. Separar la referencia
del expediente de la tesorera definitiva del ciclo conserva ambas verdades y su trazabilidad.

**ESTADO**: CERRADA; M02/M03 IMPLEMENTADOS, CONTRATO DE M05 APROBADO Y PENDIENTE DE
SU FUTURO MÓDULO EJECUTABLE

---

## 2026-09-04 | Distancia aproximada al domicilio de la tesorera

**DECISION**: `Detalle de Expediente` y `Verificación de Grupo` muestran una distancia
aproximada en línea recta entre el domicilio capturado de cada integrante y el domicilio
capturado de la tesorera. La etiqueta usa el formato abreviado `DIST. 5.3 KM`. Si cualquiera
de los dos domicilios no puede geocodificarse, se muestra `DIST. N/D`; no se inventa una cifra ni se sustituye
por la respuesta declarativa de `vive_max_5km_tesorera`.

Cuando la distancia calculada sea mayor al límite operativo vigente, la burbuja cambia a
fondo rojo claro con texto y borde rojo oscuro. El límite actual de 5 km se mantiene en una
política técnica única para sustituirla por el parámetro remoto cuando el módulo de Parámetros
tenga contrato ejecutable; no se replica dentro de las pantallas.

La geocodificación se ejecuta sobre la dirección escrita (calle, número, colonia, municipio,
estado y código postal). No usa ni almacena la ubicación actual del teléfono. Ricardo autorizó
expresamente el 2026-09-04 que esos campos del domicilio se envíen al geocodificador del
dispositivo (Apple/Google, según plataforma). Las coordenadas y su fecha/fuente se conservan
para evitar consultas repetidas. El recorrido vial exacto permanece diferido hasta contar con
la integración formal de mapas.

**MOTIVO**: Obtener una referencia cuantitativa útil sin afirmar una precisión vial inexistente,
sin depender de la ubicación física desde la que la asesora realiza la captura y sin requerir
por ahora una llave propia de rutas.

**ESTADO**: CERRADA E IMPLEMENTADA PARA DISTANCIA APROXIMADA EN LÍNEA RECTA;
RECORRIDO VIAL EXACTO PENDIENTE DE LA IMPLEMENTACIÓN FORMAL DE MAPAS

---

## 2026-09-11 | Verificación individual como concentrador de procesos independientes

**DECISION**: Después de concluir la revisión documental previa, la pantalla de
Verificación Individual funciona como un menú concentrador y no como un paso de un
recorrido lineal. Su primera versión ofrece cuatro procesos con la misma jerarquía:
`Llamada`, `Visita al vecino`, `Imágenes del domicilio` y `Entrevista`.

Los cuatro procesos pueden abrirse en cualquier orden y cada uno regresa al concentrador.
La vista no muestra `Paso X de Y` ni una acción `Continuar` entre procesos. La revisión
documental conserva su bloqueo previo vigente. El acceso `Visita al vecino` queda
preparado sin inventar preguntas, evidencias ni persistencia hasta que se apruebe su
contrato específico.

**MOTIVO**: En campo, llamada, visita, imágenes y entrevista no ocurren necesariamente
en una secuencia fija. El sistema debe adaptarse a la oportunidad operativa de cada
actividad sin presentar una dependencia inexistente.

**ESTADO**: CERRADA E IMPLEMENTADA EN SU PRIMERA VERSIÓN VISUAL

---

## 2026-09-18 | Llamada telefónica y llamada por WhatsApp usan el mismo número

**DECISION**: El proceso `Llamada` de Verificación Individual ofrece dos acciones
separadas y explícitas: `Llamada por teléfono` y `Llamada por WhatsApp`. Ambas utilizan
el teléfono vigente de la integrante; no se captura ni conserva un segundo número.

La llamada telefónica abre el marcador existente. La acción de WhatsApp convierte los
números mexicanos al formato internacional, abre la conversación mediante el enlace
universal oficial y deja que el verificador inicie la llamada desde WhatsApp. No se usa
un esquema no documentado para iniciar automáticamente una llamada.

Después de abrir correctamente cualquiera de los dos destinos, la pantalla conserva el
mismo diálogo local `Sí contestó / No contestó` y las mismas preguntas de contacto
inicial. Esta decisión no agrega persistencia ni auditoría de intentos; ese contrato
continúa pendiente.

**MOTIVO**: Dar al verificador la opción de contactar por el canal disponible sin
duplicar el dato telefónico ni introducir una integración inestable.

**ESTADO**: CERRADA E IMPLEMENTADA

---

## 2026-09-18 | Registro permanente y contadores de llamadas de Verificación

**DECISION**: Cada vez que el verificador abre correctamente el marcador telefónico o
WhatsApp y después declara `Sí contestó` o `No contestó`, la API conserva un intento
inmutable ligado a la integrante. El registro contiene canal, resultado declarado,
usuario y fecha/hora; no duplica el teléfono ni afirma que el sistema operativo haya
comprobado la llamada.

Los botones mantienen sus nombres fijos y muestran dos contadores independientes por
canal: `No contestó` en rojo y `Sí contestó` en verde. Los contadores se derivan del
historial del servidor y sólo cambian cuando la API confirma el registro. La clave de
idempotencia del intento evita duplicados si una respuesta se reenvía por una falla de red.

La escritura requiere la acción específica `verificacion:registrar`, concedida a los
roles `ASESOR` y `VERIFICADOR` mientras continúa vigente el acceso temporal de desarrollo.
Las respuestas posteriores de identidad, domicilio y características, así como la selección
local de la acción posterior, no forman parte de este registro y continúan pendientes de su
contrato de persistencia.

**MOTIVO**: El conteo debe sobrevivir cierres de sesión y cambios de dispositivo, conservar
actor y fecha, y no presentar como historial un estado únicamente local.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 015, API Y MOBILE

---

## 2026-09-18 | Pestaña NUEVO en la bandeja de grupos por verificar

**DECISION**: La pantalla `Grupos en Verificación` muestra una pestaña vertical `NUEVO`
en el lado izquierdo de la tarjeta cuando el expediente corresponde al ciclo 1. Las
renovaciones no muestran esa pestaña.

La condición proviene del ciclo vigente resuelto por la API con la misma precedencia usada
en Documentación: ciclo transaccional, solicitud, auditoría de inicio de renovación e
historial grupal. No se determina por nombre, antigüedad ni posición de la tarjeta. La
etiqueta también se anuncia a tecnologías de asistencia para no depender sólo del color.

**MOTIVO**: Alertar al verificador de que se trata de un grupo nuevo y requiere especial
cuidado, manteniendo la señal visual institucional ya utilizada en la bandeja de
Documentación.

**ESTADO**: CERRADA E IMPLEMENTADA SIN CAMBIO DE ESQUEMA

---

## 2026-09-18 | Identificación grupal mientras Documentación corrige evidencias

**DECISION**: Cuando un grupo visible en `Grupos en Verificación` conserva al menos una
integrante en estado `DOCUMENTANDO`, la tarjeta muestra la franja vertical abreviada
`REVISAR DOC.`, cuyo significado completo es `Revisar documentación`. La marca es
informativa: el verificador puede abrir el grupo y continuar con
el trabajo permitido.

La devolución continúa respetando DEC-026: sólo la integrante observada cambia a
`DOCUMENTANDO` y el expediente conserva `EN_VERIFICACION` para no perder el handoff ni su
historial. La señal grupal es una condición derivada por la API y desaparece cuando la
última integrante pendiente vuelve a `SUJETA_CREDITO`. Si también es ciclo 1, la señal de
corrección documental tiene prioridad temporal sobre la pestaña `NUEVO`.

La etiqueta individual conserva `REVISAR DOCUMENTACIÓN`; `REVISAR DOC.` se reserva
para advertir al verificador que el grupo contiene integrantes en Documentación.

**MOTIVO**: Hacer visible la corrección documental sin ocultar el grupo, impedir su apertura
ni inventar una transición de estado del expediente.

**ESTADO**: CERRADA E IMPLEMENTADA SIN CAMBIO DE ESQUEMA

---

## 2026-09-19 | Acción posterior cuando la integrante sí contesta

**DECISION**: En Verificación Individual, `No contestó` conserva el intento en servidor y
cierra el diálogo de resultado. Cuando el verificador declara `Sí contestó`, el intento se
registra primero y, después de la confirmación del servidor, se abre la segunda vista interna
de `Llamada`, separada de los botones y sus contadores.

La pregunta 4 de esa vista es `¿Qué se realizará ahora?` y ofrece una selección única entre
`Agendó visita`, `Entrevista corta`, `Entrevista larga` y `Llamar más tarde`. No existe un
diálogo adicional para esa selección. `Agendó visita` y `Entrevista corta` regresan al
concentrador al continuar; `Entrevista larga` abre el formulario general de entrevista y
`Llamar más tarde` regresa al concentrador sin marcar `Llamada` como realizada. Cualquiera de
las otras tres opciones muestra una paloma verde en el acceso `Llamada` del concentrador para
confirmar visualmente que ese proceso ya se realizó durante la sesión. `Volver a llamadas`
regresa a la selección de canal sin salir al concentrador. La elección y la paloma sirven
únicamente para dirigir y representar la sesión actual. No crean una cita ni persisten todavía
la conclusión del proceso o el tipo de entrevista; esos contratos siguen pendientes.

**MOTIVO**: Después de una llamada contestada, el trabajo operativo puede continuar de tres
formas distintas. Integrar la decisión al final de la encuesta mantiene una secuencia visible
sin una interrupción modal y sin alterar el historial inmutable del intento de llamada.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-19 | Persistencia y conclusión del proceso Llamada

**DECISION**: Cada llamada contestada conserva en servidor las respuestas de identidad,
domicilio, las seis coincidencias que componen la pregunta 3 y la acción posterior de la
pregunta 4. Después de responder las cuatro preguntas, el verificador debe seleccionar desde
la galería una fotografía de la pantalla del celular como evidencia; sin esa evidencia no se
puede guardar la encuesta.

La fotografía se guarda en almacenamiento protegido y PostgreSQL conserva sus metadatos,
ruta, huella SHA-256, actor y fecha. El proceso `Llamada` se considera concluido únicamente
cuando todas las coincidencias son positivas, existe evidencia confirmada y la acción es
`Agendó visita`, `Entrevista corta` o `Entrevista larga`. La paloma verde se deriva de esa
conclusión persistida en servidor, por lo que se conserva al cerrar sesión o la aplicación.

`Llamar más tarde` guarda intento, respuestas y evidencia como historial, pero no concluye el
proceso ni muestra la paloma; debe realizarse un nuevo intento. Una no coincidencia también
conserva el registro sin declarar conclusión mientras su tratamiento operativo continúe
pendiente. `Entrevista corta` y `Entrevista larga` abren directamente la pantalla de
Entrevista sólo después de que el servidor confirma el guardado. Esta decisión sustituye las
partes de DEC-036 que limitaban la acción y la paloma a la sesión local o enviaban la
entrevista corta al concentrador.

**MOTIVO**: Conservar un historial verificable, impedir que una señal local simule un proceso
concluido y recuperar el estado correcto en cualquier sesión o dispositivo.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 016, API Y MOBILE

---

## 2026-09-21 | Consulta del INE durante Visita al vecino

**DECISION**: Al abrir `Visita al vecino` desde el concentrador de Verificación
Individual, la app muestra en modo de consulta las dos imágenes vigentes del INE de la
integrante. La primera vista presenta el frente y permite deslizar horizontalmente hacia
el reverso, de forma que ambas imágenes puedan revisarse incluso cuando se hayan capturado
en un orden incorrecto.

Tocar cualquiera de las imágenes abre un visor opaco de pantalla completa. En ese visor
no permanece visible el fondo de la aplicación; se conserva el cambio lateral entre ambas
caras y se permite ampliar y recorrer la imagen.

Esta consulta reutiliza la evidencia documental ya confirmada en servidor. No captura una
nueva evidencia, no permite reordenar o reemplazar archivos, no marca la visita como
concluida y no agrega persistencia del proceso. Las preguntas, el resultado, las evidencias
propias de la visita y su criterio de completitud continúan pendientes de contrato.

**MOTIVO**: El verificador necesita mostrar y revisar ambas caras de la identificación
durante la visita sin regresar a la revisión documental y sin que una captura invertida
oculte la cara necesaria. El visor opaco evita mezclar visualmente el documento ampliado
con el resto de la aplicación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-21 | Ubicación del dispositivo al confirmar una llamada

**DECISION**: Al responder `Sí contestó` o `No contestó` en el diálogo `Resultado de la
llamada`, la aplicación obtiene la ubicación actual del teléfono y la envía como parte del
mismo registro inmutable del intento. PostgreSQL conserva latitud, longitud, precisión
horizontal cuando el sistema operativo la informa, fecha/hora de la lectura y la fuente
general `DISPOSITIVO`, además del canal, resultado, actor y fecha/hora del servidor.

La lectura es obligatoria para los intentos nuevos: si los servicios de ubicación están
apagados, el permiso no fue concedido o no se obtiene una coordenada válida, la app no guarda
el resultado ni incrementa el contador y muestra una instrucción para corregirlo y reintentar.
Los intentos históricos permanecen sin coordenadas; no se reconstruye ni inventa su ubicación.
`DISPOSITIVO` no significa exclusivamente GPS, porque iOS o Android pueden combinar GPS,
Wi-Fi y red móvil.

El propósito de estos datos es permitir posteriormente un reporte que compare el punto de la
llamada con el domicilio registrado. Esta decisión no define todavía la fórmula, el umbral de
cercanía ni construye dicho reporte.

**MOTIVO**: Conservar evidencia verificable del lugar desde el que se declara el resultado de
la llamada, sin presentar como real una ubicación ausente o reconstruida.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 017, API Y MOBILE

---

## 2026-09-21 | Primera llamada obligatoriamente por teléfono

**DECISION**: Cuando una integrante todavía no tiene intentos telefónicos registrados, la
primera vista de `Llamada` mantiene habilitada únicamente `Llamada por teléfono` y muestra
`Llamada por WhatsApp` deshabilitada con una explicación visible. WhatsApp se habilita en
cuanto el servidor confirma al menos un intento por teléfono, sin importar si el resultado
fue `Sí contestó` o `No contestó`.

La condición se deriva del historial compartido y no del estado local del dispositivo. La API
aplica la misma regla y rechaza un registro de WhatsApp cuando no existe el antecedente
telefónico. Si el historial no pudo consultarse, WhatsApp permanece deshabilitado; registrar
correctamente una llamada telefónica actualiza el resumen y lo habilita. Esta decisión
sustituye la disponibilidad inicial indistinta de ambos canales descrita en DEC-032, pero
conserva el mismo número de la integrante y el enlace oficial de WhatsApp.

**MOTIVO**: Asegurar que el primer contacto se intente por la vía telefónica institucional y
usar WhatsApp sólo como canal posterior, conservando una regla verificable entre dispositivos.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Guion inicial para dirigirse al vecino

**DECISION**: La pantalla `Visita al vecino` muestra, antes del INE, un recuadro destacado
con el texto que el verificador debe decir al iniciar el contacto. La primera línea dice
`Estoy intentando localizar a` y el nombre completo de la integrante aparece en el renglón
inferior para distinguirlo con claridad; tanto la frase como el nombre aparecen entre
comillas. El nombre se obtiene de la solicitud vigente y se presenta dentro del mismo patrón
visual destacado utilizado para los guiones de la llamada.

El recuadro permanece visible durante la carga o el error de consulta del INE. No registra
una respuesta, no concluye el proceso y no agrega persistencia.

**MOTIVO**: La visita comienza confirmando indirectamente el domicilio mediante un vecino.
El guion visible evita que el verificador dependa de memoria y le proporciona el nombre
correcto antes de mostrar la identificación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Confirmación inicial del vecino

**DECISION**: Debajo de las imágenes del INE, `Visita al vecino` pregunta `¿La conoce?
¿Sabe dónde vive?` y permite seleccionar una única respuesta `Sí` o `No`. La opción positiva
usa la señal verde y la negativa la señal roja del componente binario institucional; ambas
conservan texto e icono para no depender únicamente del color.

En este incremento la respuesta pertenece sólo a la sesión local. No se presenta como
guardada, no marca la visita como concluida y no se conserva en servidor hasta que se apruebe
el contrato completo de persistencia y resultado de la visita.

**MOTIVO**: Después de identificar visualmente a la integrante, el verificador necesita
registrar de forma inmediata si el vecino la reconoce y ubica su domicilio, sin introducir
todavía un resultado definitivo o una transición de estado.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Guion de entrega de correspondencia al vecino

**DECISION**: Debajo de la pregunta `¿La conoce? ¿Sabe dónde vive?`, la pantalla
`Visita al vecino` muestra un segundo recuadro destacado con tres renglones: `Traigo
correspondencia para`, el nombre completo de la integrante y `Y necesito que me la firme de
recibido.`. Las tres líneas aparecen entre comillas y el nombre conserva la mayor jerarquía
tipográfica para facilitar su lectura en campo.

El nombre se obtiene de la solicitud vigente. El recuadro sólo funciona como guion operativo:
no registra una respuesta, no declara una entrega y no concluye ni persiste la visita.

**MOTIVO**: Dar continuidad a la conversación con el vecino mediante una instrucción visible,
clara y personalizada, manteniendo el mismo patrón visual del guion inicial.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Ajuste tipográfico de los guiones para el vecino

**DECISION**: En los dos recuadros de guion de `Visita al vecino`, únicamente el nombre de la
integrante conserva las comillas. Las frases `Estoy intentando localizar a`, `Traigo
correspondencia para` y `Y necesito que me la firme de recibido.` se muestran sin comillas y
con una tipografía ligeramente menor. El tamaño y la jerarquía visual del nombre no cambian.

Esta decisión sustituye únicamente el formato de comillas y tamaño de las frases descrito en
DEC-041 y DEC-043; su ubicación, contenido, origen dinámico del nombre y falta de persistencia
permanecen sin cambios.

**MOTIVO**: Separar visualmente el guion que debe decir el verificador del nombre que necesita
destacar al hablar con el vecino.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Resultado de la confirmación en el acceso Visita al vecino

**DECISION**: Al volver al concentrador de Verificación Individual, el botón `Visita al
vecino` refleja la respuesta seleccionada en `¿La conoce? ¿Sabe dónde vive?`: muestra una
palomita verde cuando la respuesta fue `Sí` y una tacha roja cuando fue `No`. El indicador
incluye una etiqueta accesible con el resultado y no depende únicamente del color.

En este incremento el indicador se deriva del mismo estado local de la pregunta. No se presenta
como guardado, no sobrevive al cambio de integrante o al cierre de la pantalla y no convierte
la visita en un proceso concluido.

**MOTIVO**: Permitir que el verificador identifique desde el concentrador el resultado ya
seleccionado sin volver a abrir la visita ni confundir una respuesta negativa con una tarea
pendiente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Tabla base para Visita al vecino

**DECISION**: La confirmación declarada en `¿La conoce? ¿Sabe dónde vive?` se conservará como
historial inmutable en la tabla `verificacion_visitas_vecino`. Cada fila relaciona a la
integrante, la respuesta booleana `conoce_y_sabe_donde_vive`, la persona que la registró, la
fecha/hora y una clave de idempotencia para evitar duplicados por reintento.

La tabla usa UUID, llaves foráneas restrictivas hacia `integrantes` y `usuarios`, índice por
integrante y fecha e índice único por actor y clave de idempotencia. No duplica el nombre, el
domicilio ni el INE. La creación de la tabla no conecta todavía la pantalla con la API ni
convierte la visita en un proceso concluido.

**MOTIVO**: Separar la visita al vecino de las tablas de llamadas, preservar trazabilidad y
preparar una persistencia segura antes de conectar la captura móvil.

**ESTADO**: CERRADA E IMPLEMENTADA EN POSTGRESQL MEDIANTE MIGRACIÓN 018; API Y MOBILE PENDIENTES

---

## 2026-09-22 | Ubicación obligatoria al confirmar la respuesta del vecino

**DECISION**: Al seleccionar `Sí` o `No` en `¿La conoce? ¿Sabe dónde vive?`, la app obtiene la
ubicación actual del teléfono y envía en una sola confirmación la respuesta, latitud, longitud,
precisión horizontal disponible y fecha/hora de lectura. La fuente se registra como
`DISPOSITIVO`. Si el permiso está denegado, los servicios de ubicación están apagados, la
lectura es inválida o el servidor no confirma la escritura, no se crea la visita y la palomita o
tacha no cambia.

Cada confirmación se conserva como una fila histórica e idempotente en
`verificacion_visitas_vecino`; una respuesta posterior no sobrescribe la anterior. La consulta
del resumen devuelve la respuesta más reciente para restaurar el indicador entre sesiones. La
ubicación precisa no se copia a `audit_log` ni se expone en el resumen normal de la pantalla.
Este registro no define todavía que todo el proceso `Visita al vecino` esté concluido.
Esta decisión sustituye únicamente la condición de respuesta local descrita en DEC-042 y
DEC-045 y completa la conexión pendiente de DEC-046; no cambia los guiones ni declara nuevas
evidencias o conclusión del proceso.

**MOTIVO**: Conservar evidencia del lugar desde el cual se obtuvo la confirmación del vecino,
sin simular éxito local, perder historial ni ampliar innecesariamente la exposición de
coordenadas.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 019, API AUTENTICADA Y MOBILE

---

## 2026-09-22 | Fotografía geolocalizada de fachada como primer paso de Visita al vecino

**DECISION**: Al abrir `Visita al vecino`, el primer paso obligatorio es tomar una fotografía de
la fachada directamente con la cámara del dispositivo. La pantalla no ofrece selección desde el
carrete. Inmediatamente después de la toma, mobile obtiene la ubicación actual y envía en una
misma captura la imagen, latitud, longitud, precisión horizontal disponible y las fechas de toma
y lectura. Si se cancela la cámara, no hay permiso o lectura válida de ubicación, o el servidor no
confirma el guardado, no se habilitan los guiones, el INE ni la pregunta al vecino.

La evidencia se conserva en almacenamiento protegido y sus metadatos en
`verificacion_visita_vecino_fachadas`, con integrante, actor, SHA-256, fuente de captura
`CAMARA`, ubicación, fuente `DISPOSITIVO`, fecha e idempotencia. La respuesta posterior se liga
a la fachada más reciente mediante `verificacion_visitas_vecino.fachada_id`; las respuestas
históricas anteriores a esta decisión conservan `NULL` para no inventar evidencia retrospectiva.
La API valida los bytes y el contrato del flujo oficial, pero `CAMARA` describe la única fuente
ofrecida por mobile y no constituye una prueba criptográfica del origen físico de la imagen.
Capturar la fachada no define por sí sola la conclusión completa de `Visita al vecino`.

**MOTIVO**: Asegurar una evidencia visual y geográfica del domicilio antes de iniciar la
confirmación con el vecino, sin permitir archivos escogidos del carrete ni simular avance antes
de la confirmación del servidor.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 020, API AUTENTICADA Y MOBILE

---

## 2026-09-22 | Evidencia geolocalizada después de la pregunta al vecino

**DECISION**: Entre `¿La conoce? ¿Sabe dónde vive?` y el recuadro amarillo de
correspondencia, `Visita al vecino` muestra una segunda captura fotográfica denominada
`Fotografía de evidencia`. Sólo se habilita después de que el servidor confirma la respuesta
`Sí / No`; abre directamente la cámara, no ofrece carrete y obtiene una ubicación actual
inmediatamente después de la toma.

Cada evidencia se liga a la respuesta histórica concreta mediante `visita_id` y se conserva en
almacenamiento protegido. `verificacion_visita_vecino_evidencias` guarda ruta, MIME, tamaño,
SHA-256, actor, fechas, idempotencia, fuente `CAMARA`, latitud, longitud, precisión disponible y
fuente `DISPOSITIVO`. Si se registra una nueva respuesta, la evidencia anterior permanece en su
historial y no se reutiliza para la respuesta nueva. Un fallo de cámara, ubicación o servidor no
comunica guardado. El resumen normal y `audit_log` no exponen coordenadas.

La frase de correspondencia permanece debajo de este nuevo espacio. La evidencia no cambia por
sí sola el indicador `Sí / No` ni declara concluido todo el proceso `Visita al vecino`.

**MOTIVO**: Conservar una evidencia visual y geográfica específica del contacto posterior a la
confirmación del vecino, sin mezclarla con la fachada ni permitir archivos del carrete.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 021, API AUTENTICADA Y MOBILE

---

## 2026-09-22 | Iconografía y redacción breve para las fotografías de Visita al vecino

**DECISION**: Las tarjetas de captura de `Visita al vecino` sustituyen el emoji de cámara por
pares de iconos vectoriales abstractos. La fachada muestra cámara y casa; la segunda evidencia
muestra cámara y busto de persona. Sus instrucciones visibles se reducen a `Toma una foto de la
fachada. Usa la cámara; no el carrete.` y `Toma una foto como evidencia. Usa la cámara; no el
carrete.`.

Las tarjetas dejan de explicar que se registrará la ubicación para reducir texto en campo. Este
ajuste es exclusivamente visual: se mantienen la captura obligatoria de ubicación, las
validaciones, la persistencia y los bloqueos definidos en DEC-048 y DEC-049.

**MOTIVO**: Comunicar el propósito de cada toma de manera inmediata con símbolos reconocibles y
reducir la carga de lectura sin modificar la evidencia geográfica requerida.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Terminación de Visita al vecino con respuesta y evidencia

**DECISION**: El botón inferior de `Visita al vecino` deja de ser una acción genérica para
volver atrás y se convierte en la acción primaria `Terminar visita al vecino`. Permanece
deshabilitado hasta que la respuesta `Sí / No` y la segunda fotografía de evidencia estén
confirmadas por el servidor y pertenezcan a la misma respuesta vigente. Una imagen pendiente,
un envío en curso o un error de consulta no habilitan la acción.

Tanto `Sí` como `No` permiten terminar cuando cuentan con su evidencia. La fachada ya es un
prerrequisito implícito porque sin ella no puede registrarse la respuesta. Al pulsar el botón,
la app regresa al concentrador. La condición se deriva de los registros persistidos existentes;
no se crea un estado paralelo ni una fila adicional de cierre.

Esta decisión sustituye la parte de DEC-049 que mantenía abierto el criterio de conclusión de
`Visita al vecino`; no cambia la conservación histórica ni la geolocalización de sus evidencias.

**MOTIVO**: Evitar que el verificador abandone la visita como terminada cuando falta la respuesta
o su evidencia, y distinguir claramente la salida operativa de una simple navegación hacia atrás.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Marco ocre para los apartados de Visita al vecino

**DECISION**: Cada tarjeta de `Visita al vecino` usa un marco ocre fuerte para identificar sus
apartados sin cambiar el fondo que ya tenía cada uno. Fachada, INE con su pregunta, segunda
fotografía de evidencia y aviso bloqueado conservan la superficie blanca. Únicamente los dos
guiones que se dicen al vecino mantienen el fondo amarillo claro preexistente.

La pantalla usa `Card outlined` con el tema `verification` para los apartados blancos y conserva
`Card accent` en los dos diálogos. No introduce colores ni bordes locales.

**MOTIVO**: Separar visualmente cada paso y permitir que el verificador identifique rápidamente
los apartados durante el trabajo en campo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-22 | Persistencia geolocalizada de Imágenes del domicilio

**DECISION**: Cada fotografía de `Imágenes del domicilio` se conserva como una fila histórica en
`verificacion_imagenes_domicilio`. El tipo identifica `NOMENCLATURAS_CALLES`, `FACHADA` o
`FACHADA_CON_INTEGRANTE`; la tabla guarda ruta protegida, MIME, tamaño, SHA-256, fecha de la foto,
usuario autenticado que realizó la verificación, latitud, longitud, precisión disponible, fecha de
lectura, fuentes `CAMARA` y `DISPOSITIVO`, e idempotencia.

Mobile abre únicamente la cámara y obtiene una ubicación actual inmediatamente después de cada
toma. Las tres fotografías pueden capturarse en cualquier orden. Un error de envío conserva durante
la sesión la foto, el punto y la misma clave para reintentar sin duplicar. La interfaz sólo muestra
`GUARDADA` tras la confirmación de la API. `Terminar imágenes del domicilio` se habilita únicamente
cuando el servidor confirmó nomenclaturas y fachada; fachada con la integrante continúa opcional.

Una nueva toma crea historial y no borra la anterior; el resumen operativo recupera la más reciente
de cada tipo. Las coordenadas precisas y el actor no se incluyen en el resumen ordinario, y
`audit_log` tampoco duplica las coordenadas. Los archivos se entregan sólo mediante ruta autenticada
sin caché compartida.

**MOTIVO**: Conservar quién realizó cada verificación y dónde se tomó cada evidencia, sin simular
guardado local, perder historial por reemplazos ni exponer ubicación precisa fuera de superficies
autorizadas.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 022, API AUTENTICADA Y MOBILE

---

## 2026-09-25 | Traslado de la nomenclatura fuera de Imágenes del domicilio

**DECISION**: La pantalla `Imágenes del domicilio` deja de mostrar y capturar la opción
`Nomenclaturas de las calles`. Esta evidencia se trasladará a otro módulo, cuyo destino y flujo
operativo todavía deben definirse.

En esta pantalla permanecen únicamente `Fachada`, obligatoria, y `Fachada con la integrante`,
opcional. `Terminar imágenes del domicilio` se habilita cuando el servidor confirma la fachada;
la fotografía con la integrante no bloquea el cierre.

No se elimina el tipo técnico `NOMENCLATURAS_CALLES`, su restricción de base de datos ni ninguna
fila histórica. Permanecen disponibles para el módulo futuro. Las dos evidencias visibles conservan
captura exclusiva por cámara, ubicación, actor, almacenamiento protegido, idempotencia y auditoría.

**MOTIVO**: Separar la evidencia de nomenclatura del proceso actual sin borrar historial ni exigir
una fotografía que ya no corresponde a esta pantalla.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API SIN CAMBIO DE ESQUEMA

---

## 2026-09-25 | Palomita persistente de Imágenes del domicilio

**DECISION**: El acceso `Imágenes del domicilio` del concentrador muestra una paloma verde cuando
el resumen del servidor confirma la fotografía obligatoria de fachada. La imagen opcional de
fachada con la integrante y las nomenclaturas históricas no condicionan este indicador.

La paloma se reconstruye desde la evidencia persistida al volver a abrir el expediente, cerrar la
aplicación o usar otro dispositivo; no depende de conservar únicamente el estado local de la sesión.

**MOTIVO**: Hacer visible que el proceso ya cumple su evidencia obligatoria y evitar que una captura
guardada aparezca como pendiente en el concentrador.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE API NI ESQUEMA

---

## 2026-09-25 | Bloqueo global mientras la aplicación procesa

**DECISION**: Toda operación asíncrona explícita en mobile que impida continuar con seguridad
inhabilita temporalmente la interacción de la aplicación completa. La superficie global muestra un indicador animado con un mensaje breve
como `Cargando…`, `Guardando…` o `Procesando…`, captura los toques, impide cerrar mediante el botón
físico de regreso y anuncia el estado a accesibilidad.

El cliente HTTP central activa el bloqueo de forma predeterminada para solicitudes visibles. Las
acciones asíncronas explícitas de botones compartidos, cámara, galería, ubicación y almacenamiento
local usan el mismo controlador. El autoguardado y las consultas derivadas de campos se ejecutan en
segundo plano, no abren el overlay y comunican su estado mediante indicadores locales. Un segundo
toque se ignora mientras hay trabajo bloqueante activo. Si existen operaciones bloqueantes anidadas
o paralelas, la pantalla se libera únicamente cuando termina la última, tanto en éxito como en error.

El bloqueo es una protección de interfaz y no sustituye confirmación del servidor, claves de
idempotencia, transacciones, cola offline, reintentos ni resolución de conflictos.

**MOTIVO**: Evitar dobles envíos y acciones simultáneas durante instrucciones explícitas, sin
interrumpir la captura continua cada vez que el formulario autoguarda o consulta datos derivados.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE API NI ESQUEMA

---

## 2026-09-25 | INE del beneficiario opcional en Documentación

**DECISION**: La evidencia `INE Beneficiario` del Paso 7 es opcional. Permanece visible con
la burbuja `OPCIONAL` y conserva exactamente las capacidades documentales disponibles para
otras evidencias opcionales: capturar, subir, reintentar, consultar y reemplazar una versión
confirmada por el servidor.

Su ausencia no bloquea el botón `COMPLETO ✓`, la transición de la integrante a
`SUJETA_CREDITO`, el resumen de avance del expediente ni la apertura de los procesos de
Verificación. Los tres documentos obligatorios para ese cálculo son la INE de la integrante,
el comprobante de domicilio y la solicitud firmada. La revisión documental obligatoria de
Verificación evalúa esos mismos tres documentos; una INE de beneficiario ausente no genera una
devolución a Documentación.

El campo, la ruta de carga, el almacenamiento por versiones y cualquier evidencia ya capturada
se conservan. No se borra información ni se requiere migración, porque las columnas existentes
ya permiten valores nulos. Esta decisión sustituye únicamente la parte de la decisión del
2026-08-06 que exigía cuatro documentos en el Paso 7 y la parte de la decisión del 2026-08-30
que obligaba a revisar los cuatro antes de continuar.

**MOTIVO**: La operación necesita concluir la solicitud aun cuando la identificación del
beneficiario no esté disponible, manteniendo la posibilidad de anexarla cuando sí se obtenga.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE SIN CAMBIO DE ESQUEMA

---

## 2026-09-25 | Consulta permanente de Documentos en Verificación Individual

**DECISION**: Después de concluir la revisión documental obligatoria y abrir el concentrador de
Verificación Individual, el menú mantiene `Documentos` como su primer acceso, antes de `Llamada`.
Este acceso permite volver a consultar en cualquier momento las imágenes entregadas por el asesor,
incluidas ambas caras y el zoom disponible, sin abandonar a la integrante ni regresar al módulo de
Documentación.

La consulta incluye los tres documentos obligatorios y los documentos opcionales disponibles:
`INE Beneficiario` y `Comprobante Línea de Crédito`. Los opcionales se identifican expresamente;
si no fueron capturados aparecen como pendientes de forma informativa, sin bloquear procesos ni
convertirse en documentos sujetos a la devolución del Paso 1.

La reapertura desde el concentrador es exclusivamente de consulta: no vuelve a pedir respuestas
`Sí / No`, no reinicia el avance y no permite generar una devolución documental nueva. La acción
inferior regresa al concentrador. La revisión documental inicial conserva íntegramente sus bloqueos,
respuestas y capacidad de devolver documentos antes de abrir los procesos.

Este acceso no agrega un quinto proceso operativo a DEC-031; los cuatro procesos independientes
permanecen `Llamada`, `Visita al vecino`, `Imágenes del domicilio` y `Entrevista`.

**MOTIVO**: El verificador necesita contrastar durante cualquier actividad los datos visibles en
los documentos originales sin repetir la revisión inicial ni perder el contexto de la verificación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE SIN CAMBIO DE API NI ESQUEMA

---

## 2026-09-25 | Medidor de luz obligatorio en Imágenes del domicilio

**DECISION**: La pantalla `Imágenes del domicilio` incorpora `Medidor de luz` como segunda tarjeta,
entre `Fachada` y `Fachada con la integrante`. Fachada y medidor de luz son obligatorios; fachada
con la integrante permanece opcional.

Las tres capturas continúan disponibles en cualquier orden y conservan cámara exclusiva, ubicación,
fecha, actor autenticado, almacenamiento protegido, idempotencia e historial. El botón `Terminar
imágenes del domicilio` y la paloma verde del concentrador sólo se habilitan cuando el servidor
confirma fachada y medidor de luz. La nomenclatura continúa fuera de esta pantalla y su historial
se conserva.

**MOTIVO**: Incorporar evidencia obligatoria del medidor eléctrico sin permitir cerrar el proceso
con un faltante ni reducir la trazabilidad de las fotografías.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 023, API Y MOBILE

---

## 2026-09-25 | Fotografías opcionales del negocio en Entrevista

**DECISION**: En `Entrevista`, el campo `¿En caso de tener negocio, de qué es?` habilita,
cuando contiene una respuesta, la opción `Fotografías del negocio`. El verificador únicamente
puede tomar cada fotografía directamente con la cámara del teléfono; no puede seleccionar archivos
desde el carrete o la galería. Puede volver a abrir la cámara y agregar todas las fotografías que
necesite. No existe cantidad mínima ni máxima de fotografías y su ausencia no bloquea la Entrevista,
no crea una paloma de conclusión y no modifica estados.

Cada fotografía confirmada se conserva como una fila histórica independiente en
`verificacion_entrevista_negocio_evidencias`, con archivo protegido, MIME y contenido validados,
tamaño, SHA-256, actor, fecha, origen `CAMARA` e idempotencia. La API mantiene el límite técnico
vigente de 10 MB por archivo y acepta JPEG o PNG; ese límite por archivo no constituye un máximo
de cantidad. Los reintentos conservan la misma clave y una falla parcial no elimina las imágenes
ya confirmadas. La ausencia de ubicación definida originalmente queda sustituida por DEC-170 para
toda captura nueva; las filas históricas no reciben coordenadas inventadas.

Esta entrega persiste únicamente las fotografías opcionales del negocio. Las respuestas completas,
el criterio de terminación y el estado general de `Entrevista` continúan pendientes de su contrato
funcional y no se infieren a partir de estas evidencias.

**MOTIVO**: Permitir que Verificación capture evidencia visual actual del negocio cuando exista, sin impedir
el avance cuando no haya fotografías disponibles ni imponer un número artificial de archivos.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIONES 024 Y 025, API AUTENTICADA Y MOBILE

---

## 2026-09-25 | Familiares dentro del grupo en Entrevista

**DECISION**: En `Entrevista`, después de seleccionar el domicilio donde se recolectarán los pagos
y antes de `¿Quién vive actualmente con usted?`, se presenta la pregunta obligatoria
`¿Tiene algún familiar en este grupo?` con respuesta única `Sí / No`.

Al responder `Sí`, la aplicación abre un selector emergente de selección múltiple con las demás
integrantes del grupo. La integrante entrevistada no aparece como opción y debe seleccionarse al
menos una familiar. Después de confirmar el selector, los nombres elegidos permanecen visibles
debajo de la respuesta para revisión inmediata. Al responder `No`, el selector se oculta y se
eliminan las selecciones previas y su resumen visible.

Esta entrega pertenece al formulario local parcial de Entrevista. La respuesta y los identificadores
seleccionados no se presentan como confirmados por servidor hasta que se apruebe e implemente el
contrato general de persistencia y conclusión de Entrevista.

**MOTIVO**: Identificar relaciones familiares dentro del mismo grupo de manera explícita, evitando
texto libre, ambigüedad por nombres repetidos y la selección de la propia entrevistada.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-09-25 | Primera pregunta general de Entrevista

**DECISION**: La primera pregunta de `PREGUNTAS GENERALES` dentro de `Entrevista` es
`¿Conoce a la asesora?` y presenta una respuesta única obligatoria `Sí / No`. Se coloca antes de
`¿Conoce a todas las integrantes del grupo?` y no habilita por ahora preguntas dependientes.

La respuesta forma parte del formulario local parcial de Entrevista y no se presenta como
confirmada por servidor hasta implementar su contrato general de persistencia y conclusión.

**MOTIVO**: Confirmar desde el inicio si la integrante identifica a la persona asesora antes de
continuar con las preguntas sobre conocimiento del grupo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-09-25 | División de Entrevista entre Preguntas generales y Datos personales

**DECISION**: La pantalla de `Entrevista` separa visualmente dos bloques consecutivos. El bloque
`PREGUNTAS GENERALES` termina después de `¿Tiene algún familiar en este grupo?` y de su selección
condicional. A continuación comienza el bloque `DATOS PERSONALES` con
`¿Quién vive actualmente con usted?`; las preguntas posteriores permanecen dentro de este segundo
bloque mientras no se apruebe otra subdivisión.

La separación utiliza franjas horizontales compartidas con fondo ocre claro y texto ocre oscuro,
tomados del tema de Verificación y con el formato de encabezado de bloque institucional. No modifica
respuestas, obligatoriedad, persistencia ni reglas de conclusión.

**MOTIVO**: Reflejar la clasificación operativa indicada en el formato de entrevista y facilitar
que la persona verificadora identifique el cambio de tema durante la captura en campo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-26 | Teléfonos al inicio de Datos personales en Entrevista

**DECISION**: El bloque `DATOS PERSONALES` de `Entrevista` inicia con
`¿Me puede confirmar su número?`. El campo se precarga con el teléfono vigente de la integrante,
permite editarlo y presenta a la derecha un botón cuadrado con icono de teléfono para marcar. Sólo
aparece cuando existen diez dígitos y usa el mismo fondo azul claro e icono oscuro del teléfono
mostrado en el encabezado de la integrante.

Inmediatamente después se presenta `¿Tiene algún número secundario?`, con un campo telefónico
opcional. Su campo conserva el mismo largo que el principal reservando a la derecha un espacio
totalmente transparente del tamaño del botón. Mientras está vacío o incompleto no muestra ningún
control; al completar diez dígitos el botón azul claro aparece en ese espacio sin desplazar ni
redimensionar el campo. Después continúa `¿Quién vive actualmente con usted?`.
Esta decisión sustituye únicamente el punto de inicio de `DATOS PERSONALES` definido el 2026-09-25;
la separación visual entre bloques permanece vigente.

Ambos valores pertenecen por ahora al formulario local parcial de Entrevista. Editar el principal
no modifica el teléfono maestro de la integrante ni simula una actualización confirmada por el
servidor. Esa persistencia se resolverá dentro del contrato general de Entrevista.

**MOTIVO**: Confirmar durante la entrevista los medios de contacto actuales y permitir una llamada
de comprobación desde el mismo punto de captura.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-09-26 | Ingresos y capacidad de pago en Datos personales

**DECISION**: Después de los teléfonos y antes de `¿Quién vive actualmente con usted?`, el bloque
`DATOS PERSONALES` incorpora tres preguntas obligatorias:

1. `¿De dónde provienen sus ingresos?`, con selección múltiple `Sueldo` y `Negocio`; pueden elegirse
   una o ambas opciones. Se presentan como botones tipo cápsula y usan los colores del módulo de
   Verificación para señalar cada opción seleccionada.
2. `¿A cuánto ascienden sus ingresos semanales?`, con captura monetaria numérica.
3. `¿Cuánto puede pagar por semana?`, con captura monetaria numérica.

Esta decisión no establece todavía límites, porcentajes ni una validación automática entre los
ingresos declarados y la capacidad de pago. Las respuestas permanecen dentro del formulario local
parcial hasta implementar el contrato general de persistencia y reglas de Entrevista.

**MOTIVO**: Capturar de forma directa el origen, el monto semanal de ingresos y la capacidad de
pago declarada para su evaluación posterior, sin inventar una política financiera.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA Y REGLAS FINANCIERAS PENDIENTES

---

## 2026-09-27 | Personas en casa y otros ingresos en Datos personales

**DECISION**: Dentro de `DATOS PERSONALES`, inmediatamente después de
`¿Quién vive actualmente con usted?`, se presenta `¿Cuántas personas viven en casa?` mediante
burbujas de selección única `1`, `2`, `3`, `4`, `5` y `≥6`, con los colores del módulo de
Verificación. Las opciones del `1` al `5` son círculos del mismo diámetro; `≥6` es ovalada para
alojar el signo sin ocupar espacio innecesario.

Después del ingreso semanal declarado y antes de la capacidad de pago se pregunta
`¿Tienen algún otro ingreso aparte del suyo?` con selección única `Sí / No`. Al responder `Sí`, se
habilita `¿A cuánto asciende el otro ingreso semanal?` como importe monetario obligatorio. Al
cambiar a `No`, el importe adicional se limpia y se oculta.

El otro ingreso se captura de forma independiente y no se suma automáticamente ni modifica la
capacidad de pago mientras no exista una regla financiera aprobada. Las respuestas permanecen
locales hasta implementar el contrato general de persistencia de Entrevista.

**MOTIVO**: Registrar el tamaño del hogar y distinguir otros ingresos semanales sin inferir cálculos
o políticas que todavía no han sido definidos por CRELEALTAD.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA Y REGLAS FINANCIERAS PENDIENTES

---

## 2026-09-27 | Antecedente en otros créditos grupales

**DECISION**: Dentro de `DATOS PERSONALES`, después del tamaño del hogar, se pregunta
`¿Ha estado en algún otro crédito grupal?` mediante selección única obligatoria `Sí / No`. Al
responder `Sí`, se habilita la lista desplegable obligatoria
`¿Con qué financiera tuvo el crédito grupal?` y se abre automáticamente sin requerir otro toque;
`No` oculta la lista y limpia cualquier selección.

El catálogo operativo inicial para Nuevo León contiene `Compartamos Banco`, `Crediclub`,
`Crédito Sí`, `Banco BanFeliz`, `Exitus Contigo`, `Seamos Socios` y `Otra`. `Otra` permite
indicar una institución no contemplada sin presentar como exhaustivo un catálogo cambiante. La
respuesta permanece local hasta implementar el contrato general de persistencia de Entrevista.

**MOTIVO**: Registrar antecedentes en otras instituciones de crédito grupal mediante una captura
rápida y permitir instituciones no previstas sin inventar una lista cerrada permanente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA PENDIENTE

---

## 2026-09-27 | Encuesta a la tesorera desde el ciclo 2

**DECISION**: La entrevista muestra una sección adicional únicamente cuando la integrante es la
tesorera persistida del expediente y el crédito corresponde al ciclo 2 o uno posterior. La encuesta
incluye dos bloques en el mismo flujo:

1. `Control de pagos del ciclo anterior`: pregunta `¿Tienen su control de pagos?`. Si responde
   `Sí`, exige una fotografía tomada con la cámara o seleccionada desde la galería. Si responde `No`, exige registrar
   qué ocurrió y muestra la instrucción de explicar que el control es un documento clave, debe
   firmarse semanalmente por asesora y tesorera y será requerido en el próximo desembolso.
2. `Evaluación de calidad`: registra la opinión sobre el crédito, la asistencia semanal del asesor,
   la firma semanal del control, el trato recibido, si recomendaría a CRELEALTAD y el motivo de esa
   respuesta.

DEC-170 sustituye la condición temporal anterior: respuestas y fotografía cuentan ahora con
persistencia protegida, actor y auditoría; la fotografía nueva exige además ubicación actual. La
interfaz no debe presentarla como confirmada hasta recibir la respuesta del servidor.

**MOTIVO**: Aplicar el formato operativo de renovación solamente a quien desempeña la función de
tesorera y cuenta con experiencia de al menos un ciclo anterior.

**ESTADO**: CERRADA; PERSISTENCIA PROTEGIDA COMPLETADA POR DEC-170 Y MIGRACIÓN 031

---

## 2026-09-28 | Encuesta de servicio según historial individual confirmado

**DECISION**: La elegibilidad de las encuestas de renovación se deriva del historial de la
integrante, identificado por su `persona_id`, y nunca del número de ciclo del grupo actual. Existe
historial individual únicamente cuando la misma persona tiene en otro expediente una solicitud con
`monto_autorizado > 0` o un crédito registrado. Un resultado desconocido (`NULL`) no habilita
ninguna encuesta.

El `Control de pagos del ciclo anterior` se muestra sólo cuando la integrante es la tesorera del
expediente y tiene historial individual confirmado. La `Encuesta de servicio` se muestra a cualquier
integrante con historial individual confirmado e incluye respuestas únicas en burbujas para opinión
del crédito, trato durante el desembolso, rapidez de entrega, claridad de la información y
recomendación. Una valoración regular o negativa abre `¿Qué podríamos mejorar?` como respuesta
obligatoria.

Esta decisión sustituye en DEC-071 el criterio de ciclo del grupo y separa la evaluación de servicio
del bloque exclusivo de tesorería. DEC-170 completa la persistencia protegida y auditada de las
respuestas y de la fotografía geolocalizada del control.

**MOTIVO**: Aplicar la encuesta según la experiencia real de cada persona con CRELEALTAD, incluso
si cambió de grupo, y evitar mostrarla por inferencias ambiguas del ciclo colectivo.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-28 | La tesorera responde ambas encuestas completas

**DECISION**: Cuando la tesorera tiene historial individual confirmado, responde dos bloques
independientes porque actúa simultáneamente como tesorera y como integrante:

1. La encuesta exclusiva de tesorería conserva completa la pregunta y evidencia de control de pagos,
   la opinión del crédito, la asistencia semanal de la asesora, la firma semanal del control, el
   trato de la asesora, la recomendación y su motivo.
2. A continuación responde también la encuesta general de servicio aplicable a toda integrante con
   historial confirmado.

Las respuestas de ambos bloques son independientes; una no sustituye ni precarga la otra. La
elegibilidad continúa derivándose del historial individual y no del ciclo del grupo.

**MOTIVO**: La función de tesorera agrega responsabilidades operativas, pero no elimina su condición
de integrante ni la experiencia individual que debe evaluarse.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-28 | Confirmación telefónica mediante botón textual

**DECISION**: En `DATOS PERSONALES`, la pregunta `¿Me puede confirmar su número?` presenta un campo
compacto con espacio suficiente para los diez dígitos y sustituye el botón cuadrado con icono por
la acción textual `Confirmar`, usando los colores de Verificación. La acción permanece visible pero
deshabilitada hasta tener diez dígitos válidos; al pulsarla utiliza el mismo flujo existente para
abrir la llamada telefónica con el número capturado.

El número secundario conserva su comportamiento vigente y su espacio reservado, porque esta
decisión corresponde específicamente a la confirmación del número principal.

**MOTIVO**: Hacer explícita la intención de confirmar el teléfono principal y reducir el ancho del
campo sin comprometer legibilidad ni validación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-28 | Selector de canal después de confirmar el teléfono

**DECISION**: El campo del teléfono principal recupera el ancho disponible para mantener el botón
`Confirmar`, sin agrandarlo, alineado con el margen derecho del formulario. Al pulsarlo con diez
dígitos válidos abre un selector con `Llamada telefónica` y `Llamada por WhatsApp`.

Ambos canales reutilizan el proceso persistente de Llamada: apertura de la aplicación correspondiente,
declaración `Sí contestó / No contestó`, ubicación y continuación de la encuesta cuando contesta.
Se conserva la regla vigente que habilita WhatsApp sólo después de registrar al menos un intento
telefónico; mientras no exista, la opción se muestra deshabilitada con su explicación.

Esta decisión amplía DEC-074 en alineación y selección de canal sin cambiar el tamaño del botón.

**MOTIVO**: Aprovechar el ancho disponible, alinear la acción al borde del formulario y evitar un
flujo de llamadas paralelo o sin trazabilidad desde Entrevista.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-28 | Confirmación y canal para el teléfono secundario

**DECISION**: El teléfono secundario adopta exactamente el mismo campo, dimensiones y botón
`Confirmar` del teléfono principal. El botón permanece visible pero deshabilitado cuando el campo
está vacío o no contiene diez dígitos; sólo con diez dígitos válidos permite elegir entre llamada
telefónica y llamada por WhatsApp.

Ambos números reutilizan un único selector y el proceso persistente de Llamada, incluida la regla
que habilita WhatsApp después de registrar un intento telefónico. El teléfono secundario continúa
siendo opcional: dejarlo vacío no bloquea la Entrevista.

**MOTIVO**: Mantener consistencia visual y funcional entre ambos medios de contacto sin convertir
el teléfono secundario en un dato obligatorio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-28 | Selección de número después de elegir el canal de Llamada

**DECISION**: En la primera vista del proceso `Llamada`, el verificador selecciona primero
`Llamada por teléfono` o `Llamada por WhatsApp`. Después de elegir el canal, cuando la integrante
tiene un teléfono principal y un teléfono secundario válidos y distintos, la aplicación muestra
un selector explícito para escoger `Principal` o `Secundario` antes de abrir la aplicación
correspondiente.

Si sólo existe un número válido, no se agrega un paso innecesario: la aplicación continúa
directamente con ese número. Un teléfono secundario vacío, incompleto o igual al principal no
genera una segunda opción. Los contadores, la ubicación, el resultado y la encuesta continúan
perteneciendo al mismo proceso persistente de Llamada y se conserva la regla que exige un intento
telefónico antes de habilitar WhatsApp.

Esta decisión amplía DEC-032 y sustituye únicamente su restricción de utilizar siempre un solo
número vigente; no agrega otro número a la bitácora de intentos ni cambia su contrato de datos.

**MOTIVO**: Permitir que el verificador elija el medio de contacto disponible sin obligarlo a
regresar a otra pantalla, conservando un flujo directo cuando la asesora no capturó teléfono
secundario.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-28 | Confirmación telefónica de Entrevista con evidencia, sin encuesta de Llamada

**DECISION**: Cuando `Confirmar` se origina en cualquiera de los dos teléfonos de
`DATOS PERSONALES`, la aplicación abre el canal elegido y después registra `Sí contestó / No
contestó` con la misma ubicación e historial de intentos del proceso de Llamada. `No contestó`
termina ese intento y conserva a la persona usuaria en Entrevista. `Sí contestó` no abre la encuesta
del proceso de Llamada: muestra únicamente la captura de evidencia de esa comunicación.

El renglón se identifica con borde y círculo verdes con palomita sólo después de que la API confirma
la evidencia y guarda el teléfono normalizado, su tipo `PRINCIPAL / SECUNDARIO`, el intento, actor,
fecha, metadatos y hash. El indicador se recupera del servidor entre sesiones y deja de aplicar si
se edita el campo a un número distinto. El proceso independiente `Llamada` conserva íntegra su
encuesta vigente cuando se inicia desde su propio acceso.

Esta decisión sustituye únicamente en DEC-075 y DEC-076 la continuación desde Entrevista hacia la
encuesta completa de Llamada; conserva el selector de canal, la ubicación, la regla previa de
WhatsApp y el historial inmutable de intentos.

**MOTIVO**: Confirmar que el número efectivamente fue atendido y respaldarlo sin obligar a repetir
una encuesta que pertenece a otro proceso, ni mostrar éxito antes de recibir confirmación del
servidor.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE MEDIANTE MIGRACIÓN 026

---

## 2026-09-28 | Reutilizar evidencia previa de Llamada y bloquear el teléfono confirmado

**DECISION**: Cada intento nuevo del proceso `Llamada` conserva explícitamente el número de diez
dígitos utilizado y si corresponde al teléfono `PRINCIPAL` o `SECUNDARIO`. Cuando una llamada
contestada cuenta con evidencia confirmada por el servidor, Entrevista reutiliza esa evidencia,
muestra la palomita en el número exacto y no solicita otra llamada ni otra fotografía.

Un número que muestra palomita queda bloqueado para edición y su botón `Confirmar` permanece
deshabilitado. La misma regla aplica a confirmaciones realizadas directamente desde Entrevista. Los
intentos históricos creados antes de guardar el número permanecen sin atribución; no se infiere ni
se bloquea un teléfono porque el sistema no puede demostrar cuál se utilizó.

**MOTIVO**: Evitar duplicar una verificación ya respaldada, impedir que una edición posterior rompa
la correspondencia entre número y evidencia y conservar trazabilidad sin inventar datos históricos.

**ESTADO**: CERRADA E IMPLEMENTADA EN API, MOBILE Y DATABASE MEDIANTE MIGRACIÓN 027

---

## 2026-09-28 | Confirmar el proceso Llamada desde Entrevista

**DECISION**: Cuando un teléfono se confirma directamente desde Entrevista mediante una llamada
contestada y evidencia persistida, el servidor considera realizado también el proceso `Llamada` y
el menú muestra su palomita. No se exige entrar después al proceso ni contestar su encuesta. Una
llamada no contestada no confirma el número ni completa `Llamada`.

Mientras no exista evidencia confirmada, Entrevista permite editar el número. Después de confirmar
la evidencia, DEC-079 bloquea el campo y su acción.

**MOTIVO**: La llamada y evidencia obtenidas durante la entrevista ya demuestran la localización;
repetir el proceso y su encuesta agregaría captura duplicada sin aportar otra verificación.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE

---

## 2026-09-28 | Historial único y versionado de evidencias de llamada

**DECISION**: Toda fotografía que demuestre una llamada, tanto la obtenida desde el proceso formal
`Llamada` como la capturada al confirmar un teléfono dentro de Entrevista, se conserva en
`verificacion_llamada_evidencias` y se relaciona con el intento correspondiente mediante
`llamada_id`. La finalidad se distingue con `ENCUESTA` o `CONFIRMACION_TELEFONO` y cada nueva imagen
del mismo propósito incrementa `version`; ninguna versión anterior se modifica ni se elimina.

`verificacion_entrevista_telefono_confirmaciones` conserva el teléfono confirmado, su tipo y la
referencia `evidencia_id`, pero no constituye otro almacén de imágenes. Cuando un teléfono ya está
confirmado, el campo permanece bloqueado y su acción cambia de `Confirmar` a `Ver`. Esta acción abre
la evidencia vigente protegida y permite sustituirla; el cambio crea otra versión dentro del mismo
historial de Llamada y deja la anterior disponible para auditoría.

**MOTIVO**: Evitar que el historial quede fragmentado según la pantalla donde se originó la llamada,
permitir al verificador revisar o corregir la imagen y conservar trazabilidad completa sin
sobrescrituras destructivas.

**ESTADO**: CERRADA E IMPLEMENTADA EN API, MOBILE Y DATABASE MEDIANTE MIGRACIÓN 028

---

## 2026-09-28 | Evidencia telefónica ampliable a pantalla completa

**DECISION**: La acción `Ver` de un teléfono confirmado abre directamente la evidencia vigente en
un visor opaco casi a pantalla completa. La imagen admite pellizco, arrastre y controles visibles
para acercar, alejar o restablecer el porcentaje, hasta cuatro aumentos. Desde el mismo visor se
puede iniciar `Cambiar evidencia`; la selección y confirmación del reemplazo permanecen separadas
para no sustituir una versión por accidente.

Si la persona cancela el selector de imágenes, el visor vuelve a mostrar la evidencia vigente. El
reemplazo conserva el historial versionado definido en la decisión anterior.

**MOTIVO**: Permitir al verificador comprobar detalles de la fotografía antes de aceptarla o
reemplazarla, sin depender de una miniatura dentro de una hoja inferior.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-28 | El teléfono confirmado actualiza el dato maestro de la persona

**DECISION**: Cuando una llamada iniciada desde Entrevista queda contestada y su evidencia es
confirmada por el servidor, el número validado se guarda también en la persona permanente:
`personas.telefono` para el principal o `personas.telefono_secundario` para el secundario. No se
regresa el expediente a Documentación ni se duplica el dato en otra entidad; todos los módulos lo
recuperan desde `personas` al volver a consultar a la integrante.

La evidencia, la confirmación y la actualización del teléfono maestro se ejecutan en una sola
transacción. Si cualquiera falla, no se confirma el número ni se muestra la palomita. Cada cambio
registra auditoría con el campo, origen, integrante, llamada y evidencia, sin copiar el número en
`audit_log`. El historial anterior permanece demostrado por las llamadas y evidencias versionadas.

Las confirmaciones existentes sólo completan un teléfono maestro vacío; una migración no
sobrescribe valores anteriores distintos. Las confirmaciones nuevas sí sustituyen el campo exacto
que la persona verificadora acaba de validar con llamada y evidencia.

**MOTIVO**: El teléfono es un dato de identidad/contacto de la persona que debe acompañarla entre
expedientes y ciclos, mientras la llamada conserva la prueba histórica de cuándo y cómo se validó.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y DATABASE MEDIANTE MIGRACIÓN 029

---

## 2026-09-28 | Apariencia celeste de la acción Ver teléfono

**DECISION**: El botón conserva el estilo ocre de Verificación mientras su acción es `Confirmar`.
Después de confirmar la evidencia y mostrar la palomita verde, la acción cambia a `Ver` y utiliza
fondo celeste claro, borde azul ligeramente más oscuro y texto azul oscuro. Sus dimensiones,
posición y comportamiento no cambian.

**MOTIVO**: Diferenciar visualmente una acción pendiente de confirmación de una consulta de
evidencia ya guardada, manteniendo el lenguaje visual informativo utilizado en el resto de la app.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-29 | Conocimiento del bono en la encuesta de tesorería

**DECISION**: La encuesta exclusiva de la tesorera con historial termina con la pregunta obligatoria
`¿Conoce nuestro bono para tesorera?`, respondida mediante selección única en burbujas `Sí / No`
con los colores del módulo de Verificación. Se presenta después de la recomendación y de su motivo,
antes de iniciar la encuesta general que la tesorera también responde como integrante.

**MOTIVO**: Identificar de forma directa si la tesorera conoce este beneficio, sin mezclar la
respuesta con la evaluación general del servicio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Premio al Buen Manejo para tesoreras

**DECISION**: La última pregunta de la encuesta exclusiva cambia a
`¿Conoce nuestro premio para tesoreras?`, con selección única obligatoria `Sí / No`. Cuando la
respuesta es `No`, la aplicación muestra un recuadro amarillo para indicar al verificador que debe
explicar que CRELEALTAD cuenta con un Premio al Buen Manejo que reconoce la labor de la tesorera y
compartir las condiciones vigentes. No se muestran montos, requisitos ni condiciones no aprobadas.

Esta decisión sustituye el nombre `bono para tesorera` establecido en la decisión anterior.

**MOTIVO**: Utilizar el nombre operativo correcto y asegurar que una tesorera que no conoce el
premio reciba una explicación durante la entrevista sin inventar reglas comerciales.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Contenido operativo del Premio al Buen Manejo para tesoreras

**DECISION**: Cuando la tesorera responda `No` a `¿Conoce nuestro premio para tesoreras?`, el
recuadro amarillo debe comunicar de forma breve que el premio equivale al `1%` del valor grupal
desembolsado del ciclo anterior y se paga en cada desembolso a partir del tercer ciclo. Para
recibirlo, el grupo debe cumplir tres condiciones: ningún pago atrasado, ningún pago menor a la
ficha y ahorro mínimo de `$70` por integrante.

Esta decisión completa la información comercial autorizada en la decisión anterior. El recuadro no
debe incluir ejemplos ni cálculos ilustrativos.

**MOTIVO**: Dar al verificador una explicación breve, exacta y suficiente del premio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Redacción final del Premio al Buen Manejo

**DECISION**: El recuadro amarillo debe indicar que el premio corresponde al `1%` del valor grupal
desembolsado en el ciclo anterior y se paga en el desembolso a partir del tercer ciclo. Las únicas
condiciones mostradas son: todos los pagos puntuales y ningún pago menor a la ficha. Se elimina del
mensaje la condición de ahorro mínimo de `$70` por integrante.

Esta decisión sustituye el contenido operativo definido en la decisión inmediatamente anterior.

**MOTIVO**: Mostrar únicamente las condiciones finales indicadas por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Ahorro mínimo dentro de las condiciones del premio

**DECISION**: El recuadro amarillo conserva como tercera condición `Ahorro mínimo de $70 por
integrante`, además de todos los pagos puntuales y ningún pago menor a la ficha.

Esta decisión completa y sustituye la lista de condiciones de la decisión inmediatamente anterior.

**MOTIVO**: Mostrar las tres condiciones finales indicadas por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Ampliación del catálogo de financieras grupales de Nuevo León

**DECISION**: La lista de la pregunta `¿Con qué financiera tuvo el crédito grupal?` se muestra en
orden alfabético con `Banco BanFeliz`, `Came`, `Compartamos Banco`, `Credi Ok`, `Crediclub`,
`CrediMujer`, `Crédito Sí (Afirme)`, `Exitus Contigo`, `Seamos Socios`, `Todo Fácil` y
`Tuiio (Santander)`.
La opción `Otra` permanece al final para instituciones no contempladas.

Esta decisión amplía y sustituye el catálogo inicial definido el 2026-09-27, sin cambiar la lógica
condicional de la pregunta.

**MOTIVO**: Incorporar las financieras que las integrantes mencionan con mayor frecuencia en Nuevo
León y facilitar su búsqueda visual.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Identificación de Tuiio como parte de Santander

**DECISION**: En el catálogo de financieras grupales, la opción `Tuiio` se muestra como
`Tuiio (Santander)`.

**MOTIVO**: Facilitar que la integrante y el verificador identifiquen la institución correspondiente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Selección visible de la financiera del último crédito grupal

**DECISION**: La pregunta cambia a `¿Con qué financiera tuvo su último crédito grupal?`. El
desplegable permite seleccionar exclusivamente una institución. La opción tocada permanece visible
dentro de la lista con fondo del tema de Verificación, borde, texto destacado y palomita; la elección
se aplica al pulsar `Confirmar selección`.

**MOTIVO**: Precisar que se solicita la institución del antecedente más reciente y evitar dudas
sobre cuál opción se está marcando.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Incorporación de Mi Tandita y Solidar

**DECISION**: El catálogo de financieras grupales incorpora `Mi Tandita` y `Solidar` en su posición
alfabética. `Otra` permanece como última opción.

**MOTIVO**: Completar el catálogo operativo utilizado durante la entrevista.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Evaluación de la asesora como apartado visual

**DECISION**: Dentro de la encuesta exclusiva de la tesorera, `EVALUACIÓN DEL SERVICIO DE LA
ASESORA` se muestra en una franja amarilla independiente, con el mismo formato de apartado utilizado
por `CONTROL DE PAGOS`. Sus preguntas permanecen inmediatamente debajo de la franja.

**MOTIVO**: Separar visualmente la evaluación del servicio respecto del bloque de control de pagos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Cámara operable para la evidencia del control de pagos

**DECISION**: La cámara y la galería de la evidencia del control de pagos se presentan únicamente
después de cerrar el diálogo de origen y sin mantener activo el bloqueo global de procesamiento. La
cámara conserva captura de imágenes, sin edición y con el mismo destino local vigente.

**MOTIVO**: Evitar que el selector nativo quede congelado o con sus controles bloqueados en ciertos
dispositivos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA PROTEGIDA PENDIENTE

---

## 2026-09-29 | Visor ampliable de la evidencia del control de pagos

**DECISION**: Al tocar la vista previa de la fotografía del control de pagos, la aplicación abre el
visor compartido a pantalla completa. El visor permite ampliar hasta `400%` mediante pellizco o
controles visibles, arrastrar la imagen ampliada y cerrar para volver a la entrevista.

**MOTIVO**: Permitir al verificador revisar que la evidencia sea legible y corresponda al control de
pagos antes de continuar.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA PROTEGIDA PENDIENTE

---

## 2026-09-29 | Desglose de integrantes y montos solicitados

**DECISION**: Al responder `¿Está de acuerdo con los montos de sus compañeras?`, se abre
automáticamente un pop-up con cada una de las demás integrantes del grupo y su monto solicitado. La
entrevistada no aparece en su propio desglose. Cuando un monto no está disponible, se muestra `SIN
MONTO` y nunca `$0`. Cerrar el pop-up conserva la respuesta `Sí / No` elegida.

**MOTIVO**: Permitir que el verificador y la integrante revisen los montos que sustentan la respuesta.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Monto solicitado obligatorio en el desglose de compañeras

**DECISION**: El pop-up de montos toma `monto_solicitado` de la solicitud vigente como dato canónico.
Todas las demás integrantes deben mostrar un importe positivo porque el expediente ya llegó a
Verificación. No se permite mostrar `SIN MONTO`, `$0` ni otro sustituto. Si el servidor entrega una
respuesta incompleta o inválida, la aplicación no registra la respuesta `Sí / No`, no abre un
desglose parcial y solicita actualizar la entrevista.

Esta decisión sustituye el tratamiento de monto ausente definido en la decisión anterior.

**MOTIVO**: Respetar la precondición del envío a Verificación y evitar ocultar errores de contrato o
integridad mediante valores aparentes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Selección de integrantes con cuyo monto no está de acuerdo

**DECISION**: Cuando la respuesta a `¿Está de acuerdo con los montos de sus compañeras?` es `No`,
se abre automáticamente el selector múltiple compartido utilizado para familiares. Cada renglón
muestra una casilla, el nombre de la integrante y su monto solicitado. Se debe marcar una o varias
integrantes antes de habilitar `Guardar selección`; `Cancelar` no guarda cambios. Las selecciones
confirmadas permanecen visibles debajo de la pregunta como `Integrantes con monto no aceptado`.

Cuando la respuesta es `Sí`, se conserva el desglose informativo de todas las compañeras y se limpia
cualquier selección negativa previa.

**MOTIVO**: Identificar exactamente con cuáles solicitudes existe desacuerdo y unificar la interacción
con los demás selectores múltiples de Verificación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Eliminación del pop-up informativo de montos

**DECISION**: Al responder `Sí` a `¿Está de acuerdo con los montos de sus compañeras?`, la aplicación
guarda la respuesta, limpia cualquier selección negativa previa y no abre ningún pop-up. El selector
múltiple con nombres y montos se conserva únicamente cuando la respuesta es `No`.

Esta decisión sustituye el desglose informativo de la respuesta `Sí` definido en las decisiones
anteriores sobre montos de compañeras.

**MOTIVO**: Evitar una pantalla adicional que no requiere acción y mostrar el detalle sólo cuando se
debe identificar con cuáles integrantes existe desacuerdo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Tratamiento visual de integrantes con monto no aceptado

**DECISION**: El selector se titula `¿Con qué integrantes NO está de acuerdo?`, con `NO` en
mayúsculas y el peso fuerte del encabezado. Cada integrante marcada muestra una `X` en lugar de una
palomita y todo su renglón utiliza fondo rojo claro y borde rojo. El resumen de selecciones conserva
el mismo tratamiento negativo.

**MOTIVO**: Distinguir visualmente un desacuerdo de una confirmación positiva sin depender sólo del
texto ni del color.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Selector uniforme para tesorera y domicilio de pagos

**DECISION**: Las preguntas `¿Quién es la tesorera del grupo?` y `¿En el domicilio de qué
integrante se recolectarán los pagos?` reutilizan el mismo pop-up compartido de selección de
integrantes utilizado para familiares: encabezado ocre con instrucción breve, casilla visible por
renglón y acciones `Cancelar / Guardar selección`. En ambas preguntas la selección es única;
elegir otra integrante sustituye la marca anterior y la respuesta sólo se aplica al guardar.

La integrante confirmada permanece visible debajo de su pregunta. Este ajuste no cambia la
persistencia local ni el criterio pendiente de conclusión general de Entrevista.

**MOTIVO**: Mantener una interacción uniforme y reconocible al elegir personas del grupo, sin usar
un desplegable visual distinto para dos preguntas consecutivas del mismo bloque.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Eliminar preguntas duplicadas de la evaluación de tesorería

**DECISION**: La evaluación exclusiva de la tesorera deja de preguntar `¿Cómo le ha parecido el
crédito con nosotros?` y `¿Nos recomendaría como financiera?`, incluido el motivo asociado a esta
última. Ambas respuestas ya se solicitan en la `ENCUESTA DE SERVICIO` que la tesorera contesta como
integrante con historial.

El apartado exclusivo conserva únicamente la asistencia semanal de la asesora, la firma semanal
del control, el trato de la asesora y el conocimiento del premio para tesoreras.

Esta decisión sustituye en DEC-073 y DEC-094 únicamente la inclusión de opinión del crédito,
recomendación y motivo dentro de la evaluación exclusiva; no elimina la encuesta general ni las
preguntas propias del trabajo de tesorería.

**MOTIVO**: Evitar que la misma integrante responda dos veces la opinión del crédito y la
recomendación de CRELEALTAD durante una sola entrevista.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Datos laborales cuando el ingreso proviene de sueldo

**DECISION**: En `DATOS PERSONALES` de Entrevista, seleccionar `Sueldo` dentro de `¿De dónde
provienen sus ingresos?` muestra dos preguntas obligatorias: `¿Dónde trabaja?` y `¿Desde hace
cuánto tiempo trabaja ahí?`. La antigüedad admite una sola respuesta entre `1 año`, `2 años`,
`De 3 a 5 años` y `Más de 5 años`.

La condición también aplica cuando se seleccionan simultáneamente `Sueldo` y `Negocio`. Si
`Sueldo` se desmarca, ambas respuestas laborales se limpian y dejan de mostrarse. Elegir únicamente
`Negocio` no presenta estas preguntas.

**MOTIVO**: Capturar el lugar y la estabilidad laboral únicamente cuando la integrante declara un
ingreso salarial, sin pedir información que no corresponde a quienes obtienen ingresos sólo de un
negocio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Etiquetas finales de antigüedad laboral

**DECISION**: En la pregunta `¿Desde hace cuánto tiempo trabaja ahí?`, las dos últimas opciones se
muestran como `3 a 5 años` y `≥ 5 años`. Esta redacción sustituye las etiquetas `De 3 a 5 años` y
`Más de 5 años` definidas previamente.

**MOTIVO**: Utilizar la redacción y el signo solicitados por Dirección dentro de las opciones
visibles de antigüedad laboral.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Apartado condicional de Sueldo en Datos Personales

**DECISION**: Cuando `¿De dónde provienen sus ingresos?` incluye `Sueldo`, la aplicación muestra
una franja amarilla con el título `SUELDO` y agrupa debajo, en este orden, tres preguntas
obligatorias: `¿Cuánto gana semanalmente?`, `¿Dónde trabaja?` y `¿Desde hace cuánto tiempo trabaja
ahí?`.

El ingreso semanal deja de mostrarse como un campo general fuera del apartado. Si `Sueldo` se
desmarca, se oculta el bloque y se limpian el importe semanal, el lugar de trabajo y la antigüedad.
La condición también aplica cuando se seleccionan simultáneamente `Sueldo` y `Negocio`.

**MOTIVO**: Presentar juntos y en el orden operativo correcto los datos que pertenecen al ingreso
salarial, distinguiéndolos visualmente de las demás fuentes de ingreso.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Redacción de la pregunta de sueldo semanal

**DECISION**: La primera pregunta del apartado `SUELDO` se muestra como `¿Cuál es su sueldo
semanal?`, conservando la captura monetaria y su posición antes de `¿Dónde trabaja?` y la
antigüedad laboral. Esta redacción sustituye `¿Cuánto gana semanalmente?`.

**MOTIVO**: Utilizar la formulación indicada por Dirección y nombrar de forma directa el dato
salarial solicitado.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Pregunta de mejora siempre visible al final de la encuesta

**DECISION**: Inmediatamente debajo de `¿Nos recomendaría como financiera?`, la `ENCUESTA DE
SERVICIO` muestra siempre la pregunta escrita obligatoria `¿En qué cree usted que podemos
mejorar?`. Su aparición ya no depende de que una respuesta anterior sea regular, negativa, lenta
o poco clara.

Esta decisión sustituye únicamente la condición y la redacción de `¿Qué podríamos mejorar?`
definidas previamente; conserva la encuesta para integrantes con historial y su persistencia local
pendiente.

**MOTIVO**: Recabar una oportunidad de mejora de todas las integrantes entrevistadas y mantenerla
como cierre visible de la encuesta de servicio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Evidencia de entrega del folleto para tesorera

**DECISION**: Cuando la tesorera responde `No` a `¿Conoce nuestro premio para tesoreras?`, la
aplicación muestra un recuadro amarillo con la instrucción exacta `"Entregar folleto de premio a
tesorera"` y habilita la captura de una evidencia fotográfica.

La evidencia se toma exclusivamente con la cámara en ese momento, sin acceso al carrete. Después
de capturarla, la pantalla muestra una vista previa que puede tocarse para abrir el visor compartido
a pantalla completa con pellizco, desplazamiento y controles de zoom; también permite volver a
tomar la evidencia. Si la respuesta cambia a `Sí`, la evidencia local se limpia y se oculta.

Mientras no exista el contrato de persistencia general de Entrevista, la fotografía se identifica
como `EVIDENCIA LOCAL` y no se presenta como guardada o confirmada por el servidor. Esta decisión
sustituye en DEC-086 a DEC-089 el contenido del recuadro amarillo de la respuesta `No`; conserva
sin cambios la pregunta sobre conocimiento del premio.

**MOTIVO**: Indicar al verificador la acción concreta y conservar evidencia visual tomada en el
momento, sin permitir imágenes anteriores ni simular una confirmación inexistente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA PROTEGIDA PENDIENTE

---

## 2026-09-29 | Tipografía de la instrucción para entregar el folleto

**DECISION**: El recuadro amarillo `"Entregar folleto de premio a tesorera"` utiliza la misma
tipografía negra y de peso fuerte empleada en el texto del recuadro `TESORERA · CON HISTORIAL`.
La instrucción se presenta sin signo de admiración ni otro icono previo.

**MOTIVO**: Igualar la jerarquía visual indicada por Dirección y dejar el mensaje limpio, directo y
consistente con el recuadro de referencia.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-29 | Orden de preguntas en Datos personales

**DECISION**: El bloque `DATOS PERSONALES` de Entrevista presenta primero estas siete preguntas,
en el orden indicado:

1. `¿Renta, o es Dueña del domicilio?`.
2. `¿Hace cuántos años vive en este domicilio?`.
3. `¿Cuántas personas viven en casa?`.
4. `¿Quién vive actualmente con usted?`.
5. `¿Tienen algún otro ingreso aparte del suyo?`.
6. `¿Me puede confirmar su número?`.
7. `¿Tiene algún número secundario?`.

Si la quinta respuesta es `Sí`, su importe semanal obligatorio se muestra inmediatamente debajo
de esa pregunta. Las demás preguntas quedan después de estas siete sin alterar sus condiciones,
validaciones ni persistencia actual; la decisión siguiente establece su orden vigente.

Esta decisión sustituye únicamente el orden visual definido en las decisiones de Datos personales
del 2026-09-25 al 2026-09-27.

**MOTIVO**: Seguir la secuencia operativa marcada por Dirección en las referencias anotadas y
conservar juntas las respuestas condicionales relacionadas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Orden de preguntas posterior al teléfono secundario

**DECISION**: Después de `¿Tiene algún número secundario?`, `DATOS PERSONALES` presenta estas
cinco preguntas principales en el orden indicado:

1. `¿Ha estado en algún otro crédito grupal?`.
2. `¿Cuánto puede pagar por semana?`.
3. `¿En qué va a utilizar el crédito?`.
4. `¿De dónde provienen sus ingresos?`.
5. `¿En caso de tener negocio, de qué es?`.

Los campos dependientes no se separan de su contexto: la financiera aparece debajo del crédito
grupal cuando corresponde; el apartado `SUELDO` aparece debajo del origen de ingresos cuando se
selecciona esa fuente; la ubicación y las fotografías aparecen debajo del tipo de negocio.

**MOTIVO**: Completar la secuencia de captura marcada por Dirección en la referencia numerada y
mantener cada contenido condicional junto a la pregunta que lo habilita.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-29 | Apartado condicional de Negocio en Datos personales

**DECISION**: Cuando `¿De dónde provienen sus ingresos?` incluye `Negocio`, la aplicación muestra
una franja amarilla con el título `NEGOCIO`. La primera pregunta obligatoria del apartado es `¿En
caso de tener negocio, de qué es?`.

Después de capturar el tipo de negocio, el mismo apartado muestra `¿Dónde se ubica el negocio?` y
la captura opcional de fotografías existente. Cuando `Negocio` no está seleccionado, el apartado
completo permanece oculto. La condición funciona también cuando se eligen simultáneamente
`Sueldo` y `Negocio`, mostrando ambos apartados en ese orden.

**MOTIVO**: Identificar visualmente el inicio de la información del negocio y asegurar que su
primera pregunta sea la indicada por Dirección, sin mostrar campos que no corresponden a la fuente
de ingreso seleccionada.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Signos de interrogación en las preguntas de Verificación

**DECISION**: Todas las preguntas literales visibles del módulo de Verificación deben comenzar con
`¿` y terminar con `?`. Se corrigen las siete etiquetas que carecían de apertura o la tenían a
mitad del texto:

- `¿Conoce a todas las integrantes del grupo?`.
- `¿Desde hace cuánto?`.
- `¿Sabe cuánto están pidiendo sus compañeras?`.
- `¿Renta, o es Dueña del domicilio?`.
- `¿Hace cuántos años vive en este domicilio?`.
- `¿Quién vive actualmente con usted?`.
- `¿En caso de tener negocio, de qué es?`.

La corrección es exclusivamente textual; no modifica opciones, validaciones, condiciones,
permisos, persistencia ni contratos de API.

**MOTIVO**: Aplicar correctamente los signos de interrogación del español y mantener consistencia
visual en todas las preguntas del módulo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-30 | Redacción sobre el uso del crédito

**DECISION**: La pregunta `¿Por qué pidió el crédito?` cambia a `¿En qué va a utilizar el
crédito?`. Conserva la misma posición después de la capacidad de pago semanal, continúa siendo
obligatoria y utiliza el mismo estado de captura. El placeholder cambia a `Uso del crédito`.

**MOTIVO**: Preguntar de forma directa por el destino previsto del financiamiento.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Contexto individual en el encabezado de Verificación

**DECISION**: La tarjeta fija de Verificación Individual muestra, después del rol de la integrante,
tres burbujas en este orden:

1. Cantidad de créditos individuales previos confirmados.
2. Edad.
3. Distancia aproximada en línea recta al domicilio de la tesorera.

El conteo pertenece a la persona, no al grupo. La API une por `persona_id` los expedientes distintos
presentes en solicitudes con `monto_autorizado > 0` y en créditos reales; `UNION` evita contar dos
veces el mismo expediente y se excluye el expediente actual mientras no exista desembolso. La
pantalla muestra `N/D` cuando falta identidad, edad o distancia y no infiere historial individual
legacy que todavía no esté vinculado al sistema normalizado.

La burbuja de créditos utiliza fondo verde claro con borde y texto verde oscuro. La edad reutiliza el gris existente y
la advertencia amarilla si supera 70 años. La distancia reutiliza el celeste informativo y cambia a
rojo cuando supera el límite operativo vigente de 5 km.

**MOTIVO**: Dar al verificador contexto inmediato de la trayectoria y situación individual sin
confundirla con los ciclos del grupo ni inventar datos históricos.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE; SIN CAMBIO DE ESQUEMA

---

## 2026-09-30 | Color de la burbuja de créditos individuales

**DECISION**: La burbuja que muestra los créditos individuales previos utiliza fondo verde claro,
borde verde oscuro y texto verde oscuro. Las burbujas de edad y distancia permanecen sin cambios.

**MOTIVO**: Dar a la trayectoria crediticia un tratamiento positivo, legible y consistente con los
colores institucionales existentes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-30 | Etiqueta Ciclos en el resumen individual

**DECISION**: La burbuja individual muestra `CICLO` para una participación y `CICLOS` para cero o
varias, sustituyendo visualmente `CRÉDITO / CRÉDITOS`. El conteo sigue perteneciendo a la persona,
no al grupo, y conserva la misma fuente de datos, posición y colores.

El contrato interno `creditos_participados` no se renombra porque su significado técnico y su
cálculo no cambian.

**MOTIVO**: Utilizar en la tarjeta la denominación operativa indicada por Dirección sin ampliar el
alcance técnico del cambio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-30 | Contraste del borde de la burbuja de Edad

**DECISION**: El borde normal de la burbuja de edad utiliza el gris medio institucional en lugar del
gris claro. El fondo gris, el texto y la variante amarilla de advertencia para edades mayores de 70
años permanecen sin cambios.

**MOTIVO**: Dar al borde un contraste semejante al de las burbujas de Ciclos y Distancia.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-30 | Preguntas y evidencia del apartado Negocio

**DECISION**: Cuando el origen de ingresos incluye `Negocio`, la franja amarilla `NEGOCIO`
presenta, en este orden:

1. `¿De qué es el negocio?`, obligatoria.
2. `¿Cuál es el ingreso libre semanal?`, obligatoria y con formato monetario.
3. `Fotografías del negocio`, evidencia opcional disponible inmediatamente.
4. `¿Dónde se ubica el negocio?`.

La evidencia se toma exclusivamente con la cámara del teléfono, sin acceso al carrete o galería.
Puede agregarse cualquier cantidad de fotografías; cada archivo confirmado permanece protegido en
el servidor y al tocar su miniatura se abre el visor compartido a pantalla completa con zoom. La
captura ya no depende de haber escrito previamente el tipo de negocio. Desmarcar `Negocio` oculta
el apartado y limpia sus respuestas textuales y monetarias locales, sin borrar las evidencias ya
confirmadas. Esta decisión sustituye la redacción, el orden y el disparador visual de las decisiones
anteriores sobre el apartado, sin convertir las fotografías en requisito de cierre.

**MOTIVO**: Registrar primero el giro y el ingreso libre semanal, y permitir evidencia tomada en el
momento inmediatamente después de esas preguntas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Conclusiones en el menú de Verificación

**DECISION**: El concentrador individual agrega como última opción un botón `Conclusiones`. Reutiliza
el mismo componente visual de los demás accesos y muestra un signo de pesos a la izquierda. La
acción abre las preguntas locales existentes sobre inconsistencias, residencia, recomendación y
observaciones del verificador.

Este acceso no representa un dictamen financiero, no concluye la Verificación y no habilita
aprobación, reducción, rechazo ni transición de estado. Esas acciones permanecen bloqueadas hasta
contar con contrato persistente, auditoría y permisos funcionales aprobados.

**MOTIVO**: Hacer visible la captura de conclusiones dentro del menú solicitado, manteniéndola
separada de la autorización financiera definitiva.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA Y DICTAMEN PENDIENTES

---

## 2026-09-30 | Conclusiones visible pero deshabilitado

**DECISION**: El botón `Conclusiones` permanece visible como última opción del concentrador y
conserva el signo de pesos a la izquierda, pero se presenta deshabilitado y no abre ninguna
pantalla. Esta restricción temporal suspende la acción definida previamente sin retirar el botón.

**MOTIVO**: Comunicar la posición futura de Conclusiones sin habilitar por ahora un flujo que aún
carece de persistencia, dictamen y transición aprobados.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE

---

## 2026-09-30 | Porcentaje individual dentro del monto grupal solicitado

**DECISION**: En el selector `¿Con qué integrantes NO está de acuerdo?`, cada opción presenta en
este orden: porcentaje, nombre de la integrante y monto solicitado. El porcentaje representa el
`monto_solicitado` individual respecto de la suma de los montos solicitados por todas las integrantes
activas del expediente, incluida la entrevistada; ésta continúa excluida únicamente de la lista de
opciones. El valor se muestra con un decimal.

La aplicación exige que todos los montos del grupo sean finitos y mayores que cero antes de guardar
la respuesta o abrir el selector. No calcula porcentajes con datos parciales ni sustituye importes
ausentes por cero.

**MOTIVO**: Mostrar la proporción real que cada solicitud representa dentro del crédito grupal total
sin ocultar faltantes ni producir porcentajes engañosos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Datos adicionales del crédito grupal anterior

**DECISION**: Responder `Sí` a `¿Ha estado en algún otro crédito grupal?` muestra, debajo de la
financiera del último crédito, estas preguntas obligatorias en orden:

1. `¿Actualmente está activo?`, con `Sí / No`.
2. `¿En qué semana van?`, numérica.
3. `¿En qué semana se desembolsó?`, numérica.
4. `¿Cuántos ciclos ha tenido?`, numérica.
5. `¿Cuál es el nombre de la asesora?`.
6. `¿Cuál es el teléfono de la asesora?`, de diez dígitos.
7. `¿Qué tasa manejan?`, con teclado decimal.

Responder `No` oculta el bloque completo y limpia la financiera y las siete respuestas locales.

**MOTIVO**: Incorporar a la entrevista los datos operativos anotados en la referencia física para
conocer el estado y las condiciones del antecedente grupal.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Selectores acotados del crédito grupal anterior

**DECISION**: Después de confirmar la financiera del último crédito, su valor permanece visible en
un recuadro amarillo con borde lateral ocre, texto fuerte y palomita, replicando el tratamiento de
la opción seleccionada para distinguirlo de una casilla editable.

`¿En qué semana van?` y `¿En qué semana se desembolsó?` dejan de ser campos escritos y se eligen
en una lista desplazable del `1` al `16`. `¿Cuántos ciclos ha tenido?` se elige del `1` al `40` con
el mismo patrón. Ninguno de los tres acepta valores fuera de su catálogo ni escritura manual.

**MOTIVO**: Hacer inequívocas las selecciones y restringir semanas y ciclos a los rangos operativos
indicados por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Confirmación explícita de semanas y ciclos

**DECISION**: En los dos selectores de semana y en el selector de ciclos, tocar un número lo marca
visualmente dentro de la lista, pero no reemplaza todavía la respuesta del formulario. El valor se
aplica únicamente al pulsar `Confirmar selección`. Cerrar el selector sin confirmar conserva la
respuesta anterior.

**MOTIVO**: Permitir que el verificador compruebe exactamente qué número eligió antes de guardarlo
en la captura local.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Selector y posición de la tasa del crédito anterior

**DECISION**: `¿Qué tasa maneja?` aparece inmediatamente después de `¿Cuántos ciclos ha tenido?`.
La respuesta se elige mediante una lista desplazable del `69%` al `84%`, sin escritura manual.
Tocar una opción la marca como borrador y sólo `Confirmar selección` aplica el valor; cerrar conserva
la respuesta anterior.

**MOTIVO**: Agrupar la tasa con los datos numéricos del antecedente y restringirla al rango operativo
indicado por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Tasa sin unidad porcentual

**DECISION**: Los valores de `¿Qué tasa maneja?` son números simples del `69` al `84`. El selector
no muestra ni almacena el símbolo `%`. Se conservan su posición debajo de ciclos, la lista
desplazable y `Confirmar selección`.

**MOTIVO**: Corregir la unidad de la tasa conforme a la precisión indicada por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Valor de la ficha del crédito grupal activo

**DECISION**: Cuando `¿Actualmente está activo?` se responde `Sí`, se muestra inmediatamente
`¿De qué valor es su ficha?` antes de `¿En qué semana van?`. La respuesta es obligatoria mientras
la condición permanezca activa y acepta únicamente pesos enteros, sin decimales. Se presenta con
signo de pesos separado por un espacio y coma de miles, por ejemplo `$ 18,000`.

Responder `No` o retirar el antecedente de crédito grupal oculta la pregunta y limpia su valor
local.

**MOTIVO**: Registrar el importe semanal vigente antes de conocer el avance del crédito grupal y
mostrarlo con el formato monetario operativo indicado por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Bloque Historial crediticio en Entrevista

**DECISION**: `Entrevista` agrega una franja amarilla `HISTORIAL CREDITICIO` inmediatamente
después de `PREGUNTAS GENERALES` y antes de `DATOS PERSONALES`. Dentro agrupa, sin duplicar y en
este orden: antecedente de crédito grupal, financiera, vigencia, valor de la ficha cuando el crédito
sigue activo, semana actual, mes de desembolso, ciclos, tasa, nombre de la asesora y teléfono de
la asesora. Se conservan los catálogos, confirmaciones, condiciones, formatos y limpiezas ya
aprobados para esas respuestas.

**MOTIVO**: Separar el historial financiero de la información personal y reflejar el orden
operativo indicado en las referencias de Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Resumen editable único para montos no aceptados

**DECISION**: Después de guardar una o varias respuestas de `¿Con qué integrantes NO está de
acuerdo?`, se ocultan el campo desplegable y el título repetido del resumen. Permanecen únicamente
los renglones rojos de las integrantes seleccionadas. Cada renglón rojo funciona como acceso para
abrir otra vez el selector, conservar las marcas vigentes y agregar, retirar o corregir integrantes.
Mientras todavía no exista una selección guardada, se conserva el campo inicial para abrir el
selector.

**MOTIVO**: Evitar mostrar dos veces la misma selección y usar el resultado negativo visible como
control directo de edición.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Mes de desembolso del crédito grupal anterior

**DECISION**: En `HISTORIAL CREDITICIO`, `¿En qué semana se desembolsó?` se sustituye por
`¿En qué mes se desembolsó?`. La respuesta se elige de una lista ordenada de `Enero` a `Diciembre`,
con el mismo selector desplazable y la misma confirmación explícita utilizados por las demás listas
del bloque. Ya no se captura una semana numérica de desembolso.

**MOTIVO**: Registrar el periodo de desembolso con la unidad mensual indicada por Dirección y
evitar confundirlo con la semana actual del crédito.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Ciclos cursados en la financiera seleccionada

**DECISION**: En `HISTORIAL CREDITICIO`, la pregunta `¿Cuántos ciclos ha tenido?` se sustituye por
`¿Cuántos ciclos lleva en esa financiera?`. Se conserva el selector del `1` al `40`, la marca
temporal y la aplicación del valor mediante `Confirmar selección`.

**MOTIVO**: Aclarar que el conteo corresponde específicamente a la financiera seleccionada y no al
historial total de la integrante.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Preguntas para un crédito grupal anterior inactivo

**DECISION**: En `HISTORIAL CREDITICIO`, responder `No` a `¿Actualmente está activo?` muestra, en
este orden, las preguntas obligatorias `¿De qué valor era su ficha?`, `¿Cuándo fue su último pago?`,
`¿Cuántos ciclos estuvo en esa financiera?`, `¿Qué tasa manejaba?`, nombre de la asesora, teléfono
de la asesora y `¿Por qué no renovó en esa financiera?`.

El último pago se captura mediante dos listas confirmadas: mes de `Enero` a `Diciembre` y año desde
el actual hacia atrás cien años. Los ciclos conservan el rango del `1` al `40`, la tasa el rango
simple del `69` al `84`, la ficha admite sólo pesos enteros y el teléfono exige diez dígitos. El
motivo de no renovación es texto obligatorio. Cambiar la respuesta de actividad limpia los datos
de la ruta anterior para no conservar respuestas con un significado distinto.

**MOTIVO**: Capturar el cierre y la causa de no continuidad del último crédito cuando ya no se
encuentra activo, sin mezclar esos datos con la ruta vigente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Selector conjunto de mes y año para el último pago

**DECISION**: `¿Cuándo fue su último pago?` se presenta como un solo campo. Al tocarlo abre un
único pop-up que contiene simultáneamente dos scrolls: `Mes` y `Año`. Ambos valores se marcan dentro
del mismo pop-up y se aplican juntos mediante un único botón `Confirmar selección`. Fuera del
pop-up se muestra la combinación confirmada, por ejemplo `Septiembre 2026`.

**MOTIVO**: Evitar dos aperturas separadas para una sola respuesta temporal y permitir comprobar
mes y año antes de incorporarlos al formulario.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Semanas transcurridas desde el último pago

**DECISION**: Después de confirmar el mes y año del último pago, el campo muestra en el mismo
renglón la fecha a la izquierda y, a la derecha, el número de semanas completas transcurridas con
el formato `25 SEM`. Como la captura no incluye día, el cálculo toma el primer día del mes
seleccionado y lo compara con la fecha calendario actual mediante fechas UTC para evitar diferencias
por cambio de horario.

**MOTIVO**: Dar contexto inmediato sobre el tiempo transcurrido desde el último pago sin agregar
otra pregunta ni exigir una precisión diaria inexistente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; VALOR DERIVADO NO PERSISTIDO

---

## 2026-09-30 | Aportaciones de otras personas al hogar

**DECISION**: En `DATOS PERSONALES`, `¿Tienen algún otro ingreso aparte del suyo?` se sustituye por
`¿Alguien más aporta ingresos al hogar?`. Se conserva la respuesta obligatoria `Sí / No`; `Sí`
mantiene visible el importe semanal condicional y `No` lo oculta y limpia.

**MOTIVO**: Preguntar directamente por aportaciones económicas de otras personas al hogar, sin
confundirlas con otro ingreso propio de la integrante.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Importe de la aportación semanal al hogar

**DECISION**: La pregunta condicional `¿A cuánto asciende el otro ingreso semanal?` se sustituye por
`¿A cuánto asciende la aportación semanal?`. Conserva la captura obligatoria en pesos enteros y sólo
aparece cuando `¿Alguien más aporta ingresos al hogar?` se responde `Sí`.

**MOTIVO**: Mantener la misma terminología de aportación al hogar en la pregunta habilitadora y en
su importe asociado.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Forma en que conoció a la asesora

**DECISION**: En `PREGUNTAS GENERALES`, responder `Sí` a `¿Conoce a la asesora?` abre
automáticamente el pop-up obligatorio `¿Cómo la conoció?` con selección única entre `Por otra
integrante`, `En otra financiera`, `A través de Facebook` y `Otro`. La opción sólo se aplica al
pulsar `Confirmar selección` y permanece visible en el campo. Responder `No` oculta y limpia la
selección condicional.

**MOTIVO**: Registrar el canal de conocimiento mediante opciones consistentes y sin texto libre
innecesario.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-09-30 | Redacción explícita del canal de conocimiento

**DECISION**: El título condicional `¿Cómo la conoció?` se sustituye por
`¿Cómo conoció a la asesora?`. Se conservan las cuatro opciones, la apertura automática y
`Confirmar selección`.

**MOTIVO**: Mantener explícito el sujeto de la pregunta dentro del pop-up, aun cuando se consulte
fuera del contexto visual inmediato de la respuesta anterior.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA DE RESPUESTAS PENDIENTE

---

## 2026-10-01 | Imágenes del domicilio disponibles dentro de Entrevista

**DECISION**: En `Entrevista`, inmediatamente después de la aportación semanal condicional y antes
de la confirmación del teléfono principal, se muestran las mismas tres evidencias del proceso
`Imágenes del domicilio`: `Fachada`, `Medidor de luz` y `Fachada con la integrante`.

No se crea una copia ni un segundo historial. Ambos accesos reutilizan las mismas evidencias
persistentes, estados, cámara, ubicación, reintentos y confirmación del servidor. Fachada y medidor
continúan siendo obligatorios para considerar realizado `Imágenes del domicilio`; la fachada con la
integrante continúa opcional. Capturar o reemplazar una evidencia desde Entrevista actualiza el
mismo proceso y su palomita del concentrador.

**MOTIVO**: Permitir que el verificador obtenga las evidencias del domicilio en el momento natural
de la entrevista sin repetir capturas ni fragmentar el historial auditable.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API NI ESQUEMA

---

## 2026-10-01 | Tarjetas de domicilio sin instrucciones repetidas

**DECISION**: Las tarjetas `Fachada`, `Medidor de luz` y `Fachada con la integrante` dejan de
mostrar la oración descriptiva situada entre su encabezado y la acción de cámara. Conservan título,
estado y acción. Dentro de Entrevista se agrega separación vertical entre la última tarjeta y
`¿Me puede confirmar su número?`.

**MOTIVO**: Reducir texto redundante y evitar que la siguiente pregunta se perciba unida a la
última evidencia.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO FUNCIONAL, DE API NI ESQUEMA

---

## 2026-10-01 | Visor ampliable para Imágenes del domicilio

**DECISION**: Tocar la vista previa de `Fachada`, `Medidor de luz` o `Fachada con la integrante`
abre la evidencia en el visor compartido a pantalla completa. El visor permite ampliar con pellizco,
arrastrar la imagen y usar los controles visibles de zoom. Aplica tanto en el proceso independiente
como dentro de Entrevista, incluso para una imagen local pendiente de envío.

**MOTIVO**: Permitir revisar el detalle de la evidencia domiciliaria sin abandonar la captura ni
depender del tamaño reducido de la tarjeta.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API NI ESQUEMA

---

## 2026-10-01 | Resumen del historial individual con CRELEALTAD

**DECISION**: Dentro de `HISTORIAL CREDITICIO`, inmediatamente debajo de la franja amarilla y
antes de `¿Ha estado en algún otro crédito grupal?`, se muestra una tarjeta `CON CRELEALTAD` sólo
cuando la integrante tiene historial interno confirmado y existen importes autorizados utilizables.

La tarjeta presenta el monto máximo y el monto mínimo manejados por la integrante. Junto a cada
importe muestra todos los números de ciclo en los que se repitió ese extremo. Debajo lista hasta
los cinco ciclos más recientes, del más reciente al más antiguo, con su monto autorizado. Cuando
hay menos de cinco, muestra únicamente los disponibles.

La API conserva el contrato individual de DEC-116: identifica a la persona mediante `persona_id`,
excluye el expediente actual, une solicitudes con monto autorizado y créditos reales y cuenta una
sola participación por expediente. Cuando ambas fuentes representan el mismo expediente prevalece
el crédito real. La recencia usa la fecha confirmada disponible de desembolso o del ciclo histórico;
si falta, usa el ciclo descendente como desempate. No se infiere historial legacy no vinculado ni
se escribe información nueva.

**MOTIVO**: Dar al verificador un resumen comprobable de la trayectoria interna antes de consultar
el antecedente declarado en otras financieras, sin mezclar ambas fuentes ni saturar la entrevista.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE; SIN MIGRACIÓN NI ESCRITURA DE DATOS

---

## 2026-10-02 | Ciclo grupal visible en encabezados de Verificación

**DECISION**: Los encabezados contextuales de `Verificación de Grupo` y `Verificación Individual`
mantienen el nombre del grupo centrado y muestran `CICLO N` en el extremo derecho del mismo
renglón. El valor corresponde a `solicitudes.ciclo_numero` del expediente que se está verificando.

Este valor no se obtiene de la burbuja de ciclos individuales previos. Si el ciclo falta o no es
consistente entre las integrantes activas, la interfaz muestra `CICLO N/D` y no infiere un número.

**MOTIVO**: Permitir identificar de inmediato qué ciclo grupal se está verificando sin confundirlo
con el historial crediticio individual de la integrante.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA NI DATOS

---

## 2026-10-02 | Domicilio familiar en Entrevista

**DECISION**: En `DATOS PERSONALES`, la pregunta `¿Renta, o es Dueña del domicilio?` incorpora una
tercera burbuja `Familiar`. Al seleccionarla, la aplicación abre el selector desplazable compartido
y exige confirmar una opción entre `Papás`, `Hijos`, `Abuelos` y `Otro familiar`.

La relación confirmada permanece visible. Si la respuesta principal cambia a `Renta` o `Dueña`, la
relación familiar se limpia y el selector deja de mostrarse.

Esta respuesta forma parte del formulario local parcial de Entrevista; no se crea persistencia nueva
ni se interpreta como propiedad legal del inmueble.

**MOTIVO**: Representar los domicilios proporcionados por familiares sin obligar a clasificarlos
incorrectamente como renta o propiedad de la integrante.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-02 | Respuesta desconocida para identificar a la tesorera

**DECISION**: El selector de `¿Quién es la tesorera del grupo?` muestra siempre la opción
`NO SÉ QUIÉN ES LA TESORERA` al final de la lista, después de todas las integrantes y con la misma
capitalización visual.

La opción es exclusiva, igual que seleccionar a una integrante, y sólo representa la respuesta de
la persona entrevistada. No cambia ni elimina `expedientes.tesorera_integrante_id`.

**MOTIVO**: Registrar el desconocimiento explícito sin obligar a identificar incorrectamente a una
integrante como tesorera.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-02 | Rango ampliado de tasas en historial crediticio

**DECISION**: Las preguntas `¿Qué tasa maneja?` y `¿Qué tasa manejaba?` comparten una lista
desplazable con todos los valores enteros desde `65` hasta `100`, ambos incluidos. Se conservan la
selección única, la confirmación explícita y la prohibición de escritura manual.

Esta decisión sustituye únicamente el rango `69–84` aprobado previamente; los valores continúan
mostrándose como números simples, sin agregar el signo de porcentaje.

**MOTIVO**: Cubrir el rango operativo completo declarado durante la entrevista sin cambiar la
unidad ni el patrón de captura.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-02 | Redacción de la asesora en otra financiera

**DECISION**: La pregunta `¿Cuál es el nombre de la asesora?` cambia a
`¿Qué asesora la atendía en esa financiera?` dentro de las rutas activa e inactiva del historial
crediticio. El campo conserva su captura libre, obligatoriedad y comportamiento actuales.

**MOTIVO**: Relacionar de forma explícita a la asesora con la financiera seleccionada y usar una
pregunta directa durante la entrevista.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA NI DATOS

---

## 2026-10-02 | Datos opcionales de la asesora en otra financiera

**DECISION**: Las preguntas `¿Qué asesora la atendía en esa financiera?` y
`¿Cuál es el teléfono de la asesora?` son opcionales en las rutas activa e inactiva del historial
crediticio. No muestran asterisco y pueden quedar vacías sin bloquear la Entrevista.

Si se captura un teléfono, se conserva la validación de diez dígitos. Esta decisión sustituye
únicamente la obligatoriedad que DEC-149 había mantenido para el nombre; no cambia la redacción ni
el resto del flujo.

**MOTIVO**: Permitir continuar cuando la integrante no recuerda o no dispone de los datos de la
asesora de esa financiera, sin aceptar números parcialmente capturados como válidos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA NI DATOS

---

## 2026-10-02 | Conocimiento del crédito en el hogar

**DECISION**: Dentro de `DATOS PERSONALES`, inmediatamente después de
`¿Quién vive actualmente con usted?`, se agrega la pregunta obligatoria
`¿Saben los que viven con usted del crédito?` mediante una selección única `Sí / No`.

La pregunta aparece antes de `¿Alguien más aporta ingresos al hogar?`. Su respuesta permanece en el
estado local del formulario hasta que se defina la persistencia general de Entrevista.

**MOTIVO**: Registrar si las personas que viven con la integrante conocen el compromiso crediticio,
manteniendo juntas las preguntas sobre la composición y participación del hogar.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-02 | Confirmación nominal del domicilio de la integrante

**DECISION**: La primera pregunta de `DATOS PERSONALES`, inmediatamente debajo de su encabezado, es
`[nombres de la integrante], ¿vive en este domicilio?`. La aplicación toma dinámicamente los
nombres de pila de la solicitud vigente y presenta una selección única y obligatoria `Sí / No`.

La pregunta aparece antes de `¿Renta, o es Dueña del domicilio?`. Su respuesta permanece en el
estado local del formulario hasta que se defina la persistencia general de Entrevista.

**MOTIVO**: Confirmar expresamente que la integrante entrevistada vive en el domicilio que se está
verificando, evitando una pregunta genérica que pueda confundirse entre integrantes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-02 | Apellido paterno en la confirmación del domicilio

**DECISION**: La pregunta nominal de domicilio muestra los nombres de pila y el apellido paterno de
la integrante: `[nombres y apellido paterno], ¿vive en este domicilio?`. Ambos valores se toman de
la solicitud vigente. Se conservan su posición, obligatoriedad y selección única `Sí / No`.

Esta decisión complementa DEC-152 y no agrega el apellido materno.

**MOTIVO**: Identificar con mayor precisión a la integrante durante la confirmación del domicilio.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-03 | Catálogos desplazables para motivos condicionales de Entrevista

**DECISION**: Cinco seguimientos condicionales dejan de depender de escritura libre o de una
respuesta sin causa y reutilizan el selector compartido en pop-up, con lista desplazable, selección
única, confirmación explícita y obligatoriedad mientras su rama esté visible:

1. Después de responder `No` a `¿Está de acuerdo con los montos de sus compañeras?`, se conserva la
   selección de las integrantes involucradas y se agrega `¿Por qué no está de acuerdo con esos
   montos?` con `Considera que los montos son muy altos`, `Duda de la capacidad de pago`, `No conoce
   bien a alguna integrante`, `Ha tenido problemas previos con alguna integrante`, `No conoce para
   qué usarán el crédito` y `Otro motivo`.
2. `¿Por qué no renovó en esa financiera?` ofrece `Terminó de pagar y ya no necesitó otro crédito`,
   `No estuvo de acuerdo con la tasa o los costos`, `El monto ofrecido no le convenía`, `Tuvo
   problemas con la asesora`, `Tuvo problemas con el grupo`, `No pudo seguir pagando`, `La
   financiera no le renovó`, `Cambió a otra financiera` y `Otro motivo`.
3. `¿Qué pasó con el control de pagos?` ofrece `Lo extravió`, `Se dañó`, `Lo conserva otra
   integrante`, `Lo tiene la asesora`, `Nunca se lo entregaron`, `No sabe dónde está` y `Otro motivo`.
4. `¿Nos recomendaría como financiera?` exige un motivo para ambas respuestas. `Sí` ofrece `Buen
   trato de la asesora`, `Crédito entregado a tiempo`, `Pagos y condiciones claras`, `Monto
   adecuado`, `Facilidad del proceso`, `Confianza en CRELEALTAD` y `Otro motivo`. `No` ofrece `Mala
   atención`, `Demora en el desembolso`, `Información poco clara`, `Monto insuficiente`, `Pagos o
   condiciones no le convenían`, `Problemas con el grupo` y `Otro motivo`.
5. Después de responder `No` a `[nombres y apellido paterno], ¿vive en este domicilio?`, se agrega
   `¿Por qué no vive en este domicilio?` con `Se mudó a otro domicilio`, `Vive temporalmente en otro
   lugar`, `Sólo recibe correspondencia aquí`, `El domicilio es de un familiar`, `El domicilio fue
   proporcionado por error`, `No quiso informar dónde vive` y `Otro motivo`.

Cada seguimiento se limpia cuando cambia la respuesta que lo habilita. Las respuestas permanecen
locales hasta definir la persistencia general de Entrevista; estos catálogos iniciales pueden
ajustarse posteriormente con evidencia operativa sin convertirlos en reglas financieras.

**MOTIVO**: Reducir escritura en campo, uniformar causas frecuentes y conservar el contexto de cada
respuesta para revisión posterior.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-03 | Apertura automática de motivos condicionales

**DECISION**: Los cinco pop-ups definidos para los motivos condicionales de Entrevista se abren
automáticamente al seleccionar la respuesta `Sí / No` que habilita cada rama. La usuaria no necesita
tocar después el campo de la pregunta consecuencia para ver sus opciones.

En el desacuerdo con los montos se conserva la secuencia necesaria: al responder `No` se abre primero
la selección de integrantes y, después de confirmarla, se abre automáticamente el pop-up del motivo.
En recomendación, cambiar de `Sí` a `No` o de `No` a `Sí` vuelve a abrir el catálogo correspondiente.

**MOTIVO**: Eliminar un toque adicional y dar continuidad a la captura de campo sin superponer dos
pop-ups simultáneos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE CATÁLOGOS, API, ESQUEMA NI DATOS

---

## 2026-10-03 | Causa individual por cada desacuerdo de monto

**DECISION**: La rama `No` de `¿Está de acuerdo con los montos de sus compañeras?` ya no presenta
una causa general después de seleccionar varias integrantes. Dentro del selector múltiple, cada vez
que se marca una integrante el mismo pop-up cambia inmediatamente al catálogo
`¿Por qué no está de acuerdo con [nombre]?`.

Al guardar la causa, el pop-up vuelve a la lista de integrantes y permite marcar otra; esa segunda
integrante abre nuevamente su propio catálogo. Volver sin confirmar una causa desmarca únicamente
la integrante pendiente. `Guardar selección` permanece deshabilitado si alguna seleccionada no
tiene causa.

Fuera del pop-up se conservan los renglones rojo claro con `X`, porcentaje, nombre e importe. Debajo
de cada integrante aparece `Causa: [respuesta]`. Tocar los renglones vuelve a abrir la selección para
agregar, retirar o corregir; retirar una integrante elimina también su causa.

Esta decisión sustituye únicamente la causa general y la secuencia del desacuerdo de montos
definidas en DEC-154 y DEC-155. El catálogo de causas no cambia; DEC-170 conserva cada alta, cambio
y retiro como evento inmutable relacionado con la integrante.

**MOTIVO**: Relacionar sin ambigüedad cada desacuerdo con la integrante correspondiente cuando se
seleccionan varias compañeras.

**ESTADO**: CERRADA; PERSISTENCIA COMPLETADA POR DEC-170 Y MIGRACIÓN 031

---

## 2026-10-03 | Conocimiento e identificación de la tesorera del grupo

**DECISION**: La captura deja de iniciar con `¿Quién es la tesorera del grupo?` y pregunta primero
`¿Conoce a la tesorera del grupo?` mediante una selección obligatoria `Sí / No`.

- `Sí` abre automáticamente el pop-up `¿Quién es la tesorera del grupo?`, que contiene únicamente a
  las integrantes y permite seleccionar una. Se elimina de esa lista la antigua opción de
  desconocimiento.
- `No` no abre el pop-up y asigna directamente `NO CONOZCO A LA TESORERA`. La respuesta se muestra
  en un recuadro rojo claro con borde, texto y `X` rojos.

Cambiar entre `Sí` y `No` limpia la selección anterior. La respuesta sólo representa lo declarado
durante la Entrevista y no cambia `expedientes.tesorera_integrante_id`.

Esta decisión sustituye DEC-147 y su texto `NO SÉ QUIÉN ES LA TESORERA`.

**MOTIVO**: Separar claramente si la integrante conoce a la tesorera de la selección de su nombre y
evitar mezclar una respuesta negativa con integrantes seleccionables.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA GENERAL DE ENTREVISTA PENDIENTE

---

## 2026-10-03 | Resumen único de la tesorera seleccionada

**DECISION**: Después de confirmar una integrante como tesorera, la interfaz oculta la pregunta
secundaria `¿Quién es la tesorera del grupo?`, el campo desplegable que repite su nombre y el título
`Tesorera seleccionada`.

Permanece únicamente un recuadro en tonos ocre con palomita y el nombre de la integrante. El
recuadro completo es tocable y vuelve a abrir el pop-up para corregir la selección.

**MOTIVO**: Evitar mostrar dos veces el mismo nombre y conservar una lectura más limpia sin perder
la posibilidad de modificar la respuesta.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA NI DATOS

---

## 2026-10-03 | Altura uniforme en la respuesta de tesorería

**DECISION**: El recuadro rojo claro `NO CONOZCO A LA TESORERA` utiliza el mismo alto mínimo,
relleno vertical, radio de borde y margen inferior que el recuadro ocre de la tesorera seleccionada.
La `X` adopta el mismo tamaño visual que la palomita; sólo se conservan distintos el color y el
sentido de la respuesta.

**MOTIVO**: Hacer que ambos resultados ocupen un renglón equivalente y evitar que la respuesta
negativa parezca una tarjeta de mayor jerarquía.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; AJUSTE EXCLUSIVAMENTE VISUAL

---

## 2026-10-03 | Resumen único del domicilio de recolección

**DECISION**: Después de confirmar en qué domicilio se recolectarán los pagos, la interfaz oculta
la pregunta, el campo desplegable que repite el nombre y el título `Domicilio seleccionado`.

Permanece únicamente un recuadro en tonos ocre con palomita y el nombre de la integrante. El
recuadro completo es tocable y vuelve a abrir el pop-up para corregir la selección, siguiendo el
mismo patrón compacto de la tesorera seleccionada.

**MOTIVO**: Evitar mostrar dos veces el mismo nombre y uniformar las respuestas confirmadas de
selección única.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA NI DATOS

---

## 2026-10-03 | Etiqueta contextual del domicilio de recolección

**DECISION**: El resumen compacto conserva un solo recuadro ocre con el nombre seleccionado y agrega
encima la etiqueta breve `DOMICILIO DE RECOLECCIÓN`. No reaparecen la pregunta completa ni otro campo
con el mismo nombre.

La etiqueta no se formula como domicilio de la tesorera porque el selector permite elegir a cualquier
integrante y esa persona puede ser distinta de la tesorera identificada.

**MOTIVO**: Distinguir el propósito del segundo recuadro sin duplicar información ni presentar como
domicilio de la tesorera una selección que puede corresponder a otra integrante.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; AJUSTE EXCLUSIVAMENTE VISUAL

---

## 2026-10-03 | Resumen compacto de familiares en el grupo

**DECISION**: Después de confirmar una o varias familiares, la interfaz oculta la pregunta
secundaria `¿Quiénes son sus familiares en el grupo?`, el campo desplegable, el título `Familiares
seleccionadas` y la instrucción auxiliar.

Permanece la etiqueta `FAMILIARES EN EL GRUPO` y debajo un solo recuadro ocre con palomita por cada
nombre elegido. Cualquiera de esos recuadros es tocable y vuelve a abrir el selector múltiple para
agregar o retirar integrantes.

**MOTIVO**: Eliminar la repetición de cada nombre y conservar el contexto del conjunto seleccionado
con el mismo patrón compacto del domicilio de recolección.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA NI DATOS

---

## 2026-10-03 | Formato uniforme de respuestas confirmadas y editables

**DECISION**: Las respuestas confirmadas que permanecen tocables para corregirse utilizan un mismo
renglón visual dentro de Verificación: palomita a la izquierda, valor con texto fuerte, flecha a la
derecha, borde completo ocre, fondo ocre suave y alto mínimo de 40. La pregunta o una etiqueta breve
permanece visible cuando se necesita para identificar el significado del valor.

El patrón se aplica tanto a los selectores de catálogo resaltados —cómo conoció a la asesora,
financiera anterior y familiar propietario del domicilio— como a los resúmenes de integrantes ya
uniformados. No cambia opciones, obligatoriedad, confirmación, limpieza condicional ni persistencia.

**MOTIVO**: Eliminar diferencias de alto, borde y posición de iconos originadas por el uso de
componentes técnicos distintos y comunicar de una sola forma que la respuesta está guardada pero
puede modificarse.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; AJUSTE EXCLUSIVAMENTE VISUAL

---

## 2026-10-03 | Motivo de no vivir en el domicilio como respuesta negativa

**DECISION**: La opción confirmada de `¿Por qué no vive en este domicilio?` se presenta siempre en
un renglón de alerta con fondo rojo claro, borde rojo, texto rojo y una tacha roja a la izquierda.
Conserva la flecha a la derecha porque el renglón sigue siendo tocable para corregir la respuesta.

Esta excepción negativa sustituye el tono ocre general sólo para dicho motivo. No cambia las
opciones disponibles, la confirmación explícita, la obligatoriedad, la limpieza al modificar la
respuesta principal ni la persistencia local vigente.

**MOTIVO**: Comunicar inmediatamente que el valor explica una respuesta negativa y evitar que el
motivo parezca una selección afirmativa o neutral.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; AJUSTE EXCLUSIVAMENTE VISUAL

---

## 2026-10-03 | Espesor uniforme entre respuestas y burbujas

**DECISION**: Todos los renglones que resumen respuestas confirmadas dentro de Entrevista utilizan
un borde de espesor `2`, igual al de las burbujas de selección `Sí / No`. Aplica a respuestas ocres
y rojas, incluidos catálogos, integrantes, desacuerdos y la tesorera desconocida.

El ajuste no modifica alto, relleno, colores, contenido, validaciones, apertura de selectores ni
persistencia.

**MOTIVO**: Dar el mismo peso visual a las respuestas guardadas y a las burbujas que originan la
selección, evitando que los renglones parezcan más débiles.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; AJUSTE EXCLUSIVAMENTE VISUAL

---

## 2026-10-03 | Formato automático para todo selector confirmado

**DECISION**: Cualquier selector que requiera `Confirmar selección` presenta automáticamente el
valor aplicado mediante el renglón-respuesta uniforme: palomita izquierda, texto fuerte, flecha
derecha, fondo suave del módulo, borde de espesor `2` y alto mínimo común.

La regla incluye selectores simples y el selector combinado de mes y año. En Entrevista cubre, entre
otros, semana actual, mes de desembolso, ciclos, tasa, último pago y motivos condicionales. Los
importes, nombres y teléfonos de escritura manual conservan formato de campo mientras sigan
editables porque no representan una selección confirmada por pop-up.

**MOTIVO**: Evitar que el formato dependa de habilitar una propiedad pregunta por pregunta y
eliminar omisiones visuales entre respuestas con la misma interacción.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE DATOS NI PERSISTENCIA

---

## 2026-10-03 | Desconocimiento del domicilio de recolección

**DECISION**: El pop-up de `¿En el domicilio de qué integrante se recolectarán los pagos?` incorpora
como último renglón, después de todas las integrantes, la opción `NO SÉ DÓNDE SE RECOLECTARÁ`.

Al confirmarla, el resumen `DOMICILIO DE RECOLECCIÓN` utiliza fondo rojo claro, borde y texto rojos,
tacha a la izquierda y flecha a la derecha para corregirlo. Si se sustituye por una integrante, el
resumen vuelve al formato ocre con palomita. Sólo la opción negativa adopta el tono rojo.

**MOTIVO**: Permitir registrar el desconocimiento sin obligar a elegir un domicilio incorrecto y
distinguir visualmente esa respuesta de la identificación positiva de una integrante.

**ESTADO**: CERRADA E IMPLEMENTADA LOCALMENTE EN MOBILE; SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-03 | Identificación visual de escritura libre contestada

**DECISION**: En Verificación, los campos de escritura libre vacíos utilizan fondo blanco y borde
gris de espesor `1`. Desde que contienen texto o un importe, mantienen el fondo blanco y cambian a
borde ocre de espesor `2`.

No incorporan palomita ni fondo ocre porque siguen siendo entradas editables y no selecciones de
catálogo. Si existe error, el borde rojo prevalece. Los teléfonos editables aplican la misma regla
mientras no estén confirmados; después conservan los estados verde y azul respaldados por evidencia.

**MOTIVO**: Distinguir de inmediato las respuestas escritas ya capturadas de los campos pendientes
sin presentar la escritura libre como una selección confirmada.

**ESTADO**: CERRADA E IMPLEMENTADA LOCALMENTE EN MOBILE; AJUSTE VISUAL SIN CAMBIO DE DATOS

---

## 2026-10-03 | Persistencia general y geolocalización de Entrevista

**DECISION**: La pantalla `Entrevista` conserva una captura parcial por integrante en
`verificacion_entrevistas`. PostgreSQL utiliza tipos de dominio: booleanos trivalentes para
respuestas sí/no/pendiente, `NUMERIC(12,2)` para importes, enteros acotados para meses, semanas,
años, ciclos y tasa, texto de diez caracteres para teléfonos, códigos controlados para catálogos y
UUID para relaciones. Familiares y desacuerdos por monto se registran en tablas de eventos
inmutables, de modo que retirar una selección no borra su historia.

El guardado es parcial y recuperable entre sesiones. `entrevistada_por` conserva al usuario que
inició la captura, `actualizada_por` al último usuario que la modificó y ambos valores son derivados
por la API desde el JWT; el cliente no puede declararlos. Cada confirmación aumenta una revisión y
audita los nombres de campos modificados sin copiar respuestas personales al log.

Toda fotografía nueva propia de Entrevista —negocio, control de pagos o entrega del folleto del
premio— se toma exclusivamente con la cámara y exige hora de la toma, latitud, longitud, hora de la
lectura de ubicación, fuente `DISPOSITIVO` y el actor autenticado. La precisión horizontal se guarda
cuando el sistema operativo la proporciona. No se acepta una captura nueva sin ubicación y no se
usan la dirección escrita ni la ubicación de otra evidencia como sustituto. Las fotografías previas
a esta decisión se identifican como legado sin ubicación y no reciben coordenadas reconstruidas.

Esta decisión sustituye expresamente en DEC-063 la regla de no guardar ubicación y reemplaza las
referencias a respuestas o fotografías exclusivamente locales de Entrevista. No define campos
obligatorios finales, paloma, dictamen ni criterio de conclusión; esa decisión funcional continúa
abierta. Las confirmaciones telefónicas y las imágenes del domicilio conservan sus contratos e
historiales existentes y no se duplican en la tabla general.

**MOTIVO**: Evitar pérdida de captura, conservar relaciones auditables y demostrar dónde y por
quién se obtuvo cada fotografía durante la entrevista sin inventar información histórica.

**ESTADO**: CERRADA E IMPLEMENTADA MEDIANTE MIGRACIÓN 031, API AUTENTICADA Y MOBILE; CRITERIO DE
CONCLUSIÓN Y COLA OFFLINE DURABLE PENDIENTES

---

## 2026-10-03 | Fotografías ilimitadas en el comprobante de línea de crédito

**DECISION**: El documento opcional `Comprobante Línea de Crédito` del Paso 7 permite adjuntar
todas las fotografías necesarias dentro de una misma versión documental. Mobile habilita selección
múltiple desde galería sin imponer un conteo máximo y, en la pantalla documental con cámara,
permite repetir `Agregar otra` hasta que la asesora indique `Terminar`.

La previsualización conserva el orden de selección y reutiliza el mismo carrusel horizontal de
Verificaciones. Al tocar cualquier fotografía se abre el visor opaco de pantalla completa con
pellizco, arrastre y controles visibles de zoom; la consulta posterior mantiene el mismo patrón.
La API acepta cantidad ilimitada exclusivamente para `comprobante_credito`, valida cada archivo y
mantiene el máximo individual de 10 MB. INE y los demás documentos conservan sus cantidades
anteriores. Reemplazar genera una versión nueva y no borra la previa. La ausencia del comprobante
continúa sin bloquear `SUJETA_CREDITO` ni el envío a Verificación.

**MOTIVO**: Un comprobante de línea puede contener varias hojas o capturas y debe resguardarse como
un solo conjunto ordenado sin obligar a omitir evidencia ni alterar el contrato de otros documentos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API; SIN CAMBIO DE ESQUEMA

---

**Última actualización**: 2026-10-03
**Responsable**: Ricardo Elizondo (ricardoelizondo8078@gmail.com)
