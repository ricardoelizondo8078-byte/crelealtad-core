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

## 2026-10-04 | Matriz institucional de acceso y gobierno de Administración (DEC-175)

**DECISION**: Se aprueba la versión 1.0 de `docs/modules/M12_ADMINISTRACION.md` como matriz
institucional inicial de acceso. La autorización productiva se modelará mediante capacidades por
par módulo–acción, alcance de datos y condición operativa. Los alcances oficiales son `PROPIO`,
`SUCURSAL`, `ZONA` y `GLOBAL`; la falta de una asignación válida deniega el acceso y nunca amplía el
alcance.

La matriz aprobada establece:

1. El contrato productivo elimina el producto cartesiano entre listas independientes y no utiliza
   comodines de módulo o acción.
2. `ASESOR` conserva M02 Documentación con alcance propio y no recibe M03 Verificación al terminar
   la excepción temporal DEC-023.
3. `VERIFICADOR` opera M03 con lectura y registro por sucursal; Coordinación y Gerencia sólo reciben
   la lectura supervisora indicada en la matriz.
4. M04 a M10 permanecen denegados hasta que la especificación de cada módulo apruebe sus pares,
   alcances y segregación. Esto incluye resolver por separado los roles faltantes de
   Análisis/Autorización y Control interno/Auditoría antes de M04.
5. M11 Parámetros y M12 Administración utilizan doble control: Gerencia decide funcionalmente y
   Administración publica técnicamente. Nadie solicita, aprueba o ejecuta su propia elevación.
6. Las excepciones individuales son restrictivas por defecto. Una ampliación exige justificación,
   aprobación independiente, vigencia y expiración automática.
7. `ADMINISTRADOR` gobierna identidad y acceso, pero no hereda permisos operativos, financieros o
   de riesgo.
8. El cambio de rol, alcance, estado o permisos invalida las sesiones afectadas y conserva
   auditoría de solicitud, decisión, ejecución, antes, después y resultado.

La aprobación no modifica por sí sola PostgreSQL, API o mobile. Su implementación requiere contrato
v2 compatible, migración aditiva, pruebas de permiso y territorio, ensayo en `crelealtad_test`,
respaldo verificado, plan de reversión y corte controlado. DEC-023 continúa vigente sólo durante el
desarrollo hasta que ese corte sea aprobado y verificado.

**MOTIVO**: Aplicar menor privilegio y segregación de funciones sin inventar accesos para módulos
incompletos, evitar combinaciones futuras no intencionales y dar una base escalable y auditable a
M12 y a los módulos posteriores.

**ESTADO**: CERRADA Y APROBADA; IMPLEMENTACIÓN TÉCNICA PENDIENTE

---

## 2026-10-05 | PIN universal acotado al desarrollo local (DEC-176)

**DECISION**: Durante el desarrollo local, M01 puede aceptar un PIN universal configurado mediante
`DEV_UNIVERSAL_PIN` únicamente cuando `NODE_ENV=development`. El valor vive en el `.env` protegido,
no se incorpora al código, documentación, logs, auditoría ni respuestas HTTP y se ignora si falta,
es inválido o el entorno no es exactamente de desarrollo.

La validación individual bcrypt permanece vigente. Cuando el acceso utiliza el PIN universal, el
JWT identifica esa sesión de desarrollo, `LOGIN` registra únicamente el método
`PIN_UNIVERSAL_DESARROLLO` y la sesión omite temporalmente `requiere_cambio_pin`. PostgreSQL conserva
sin cambios el hash individual y la marca persistida. Desactivar la variable o salir de
`development` elimina la excepción; los usuarios inactivos, roles inactivos, permisos y alcances
continúan bloqueados normalmente.

**MOTIVO**: Permitir pruebas operativas multiusuario durante la construcción de la app sin restaurar
una credencial literal en el repositorio, sobrescribir PIN individuales o abrir un acceso de
producción.

**REVERSIÓN**: Retirar `DEV_UNIVERSAL_PIN` del entorno local. No requiere migración ni modificación
de datos.

**ESTADO**: CERRADA, TEMPORAL E IMPLEMENTADA EN API; DEBE RETIRARSE ANTES DE PRODUCCIÓN

---

## 2026-10-06 | Oportunidad de mejora opcional en Entrevista (DEC-177)

**DECISION**: La pregunta `¿En qué cree usted que podemos mejorar?` permanece visible inmediatamente
después de la recomendación dentro de la encuesta de servicio, pero su respuesta deja de ser
obligatoria. Puede quedar vacía y no bloqueará el criterio de conclusión de la Entrevista cuando
éste sea implementado.

La API y PostgreSQL conservan `oportunidad_mejora` como campo nullable. Mobile retira únicamente la
marca visual de obligatoriedad y continúa autoguardando cualquier respuesta que sí se capture.

Esta decisión sustituye sólo la obligatoriedad definida en DEC-108 y en la decisión del 2026-09-29;
no cambia la visibilidad, posición, redacción, longitud máxima ni persistencia del campo.

**MOTIVO**: Permitir terminar la captura aunque la integrante no proporcione una oportunidad de
mejora, sin retirar la posibilidad de registrarla cuando exista.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-06 | Cierre operativo derivado de Entrevista y apertura contextual del selector (DEC-178)

**DECISION**: Mobile muestra siempre la acción inferior `Terminar entrevista`. La acción se habilita
cuando están contestados todos los campos visibles marcados como obligatorios y sus seguimientos
condicionales, están confirmados el teléfono principal y la ruta vigente de Imágenes del domicilio,
las evidencias obligatorias aplicables de control de pagos o entrega del folleto están confirmadas,
la versión visible de la entrevista está sincronizada con el servidor y no existen evidencias en
proceso o pendientes de envío.

Cuando todavía no se satisface el criterio, la pantalla enumera las respuestas o confirmaciones
faltantes en lenguaje operativo. `¿En qué cree usted que podemos mejorar?`, el teléfono secundario,
el nombre y teléfono de la asesora de otra financiera, la ubicación escrita del negocio, las
fotografías del negocio y las fotografías adicionales de otra financiera continúan siendo
opcionales. Una captura opcional ya iniciada sí debe terminar de guardarse antes de cerrar.

Al pulsar `Terminar entrevista`, la app regresa al concentrador y muestra la paloma de Entrevista
derivada de esas confirmaciones; no crea un estado paralelo, no cambia el expediente y no representa
dictamen ni autorización. El pop-up `¿Cómo conoció a la asesora?` se abre automáticamente sólo como
consecuencia inmediata de elegir `Sí` en `¿Conoce a la asesora?` cuando todavía no existe una
respuesta para ese seguimiento. Abrir, consultar o restaurar una entrevista que ya contiene esa
respuesta nunca lo despliega por sí solo, aunque exista una orden de apertura anterior en memoria.

**MOTIVO**: Permitir identificar exactamente qué falta, distinguir la terminación operativa de una
simple salida y evitar interrupciones al consultar entrevistas ya capturadas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA O ESTADO DEL EXPEDIENTE

---

## 2026-10-06 | Pop-ups condicionales de Entrevista sólo por una respuesta nueva (DEC-179)

**DECISION**: Ningún selector condicional de Entrevista se abre automáticamente por entrar al
proceso, consultar una captura o restaurar respuestas guardadas. La apertura automática ocurre
únicamente como consecuencia inmediata de que la usuaria elija la respuesta que habilita ese
seguimiento y sólo si el seguimiento todavía está vacío.

La regla aplica a cómo conoció a la asesora, financiera del crédito externo, causa de no renovación,
desacuerdos de monto, reconocimiento de tesorera, familiares del grupo, causa de no vivir en el
domicilio, familiar propietario del domicilio, causa de falta del control de pagos y motivo de
recomendación. Una respuesta ya capturada se muestra cerrada y puede corregirse tocando su renglón.

**MOTIVO**: Evitar que al abrir una entrevista completa aparezca en cascada el primer selector
condicional restaurado, interrumpiendo la consulta y dando la impresión de que falta responderlo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; AJUSTE DE INTERACCIÓN SIN CAMBIO DE DATOS

---

## 2026-10-07 | Habilitación de Conclusiones en Verificación (DEC-180)

**DECISION**: El botón `Conclusiones` del concentrador individual queda habilitado y abre la captura
local existente de inconsistencias, residencia, recomendación y observaciones del verificador.

La captura continúa limitada al estado local de la pantalla. No representa un dictamen financiero,
no persiste en el servidor, no autoriza ni rechaza un crédito y no cambia el estado del expediente.
Esta decisión sustituye únicamente la restricción temporal de DEC-122 y restablece el alcance
acotado aprobado en DEC-121.

**MOTIVO**: Permitir el acceso operativo a la captura ya construida sin adelantar el contrato,
auditoría, permisos ni transiciones que todavía requieren definición.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; PERSISTENCIA Y DICTAMEN PENDIENTES

---

## 2026-10-07 | Resumen operativo al inicio de Conclusiones (DEC-181)

**DECISION**: `Conclusiones` inicia con un resumen compacto de respuestas ya capturadas en
Entrevista y no vuelve a formular preguntas. El primer renglón muestra `NUEVO` dentro de una
burbuja amarilla cuando no existen ciclos previos confirmados, o el número de `CICLO / CICLOS` en
verde cuando sí existen. Si el historial no está disponible, presenta `HISTORIAL N/D` sin inferir
que la integrante sea nueva.

Los renglones siguientes indican si la integrante sabe cuánto pidieron sus compañeras y si está de
acuerdo con esos montos. Cuando no está de acuerdo, el resumen muestra en rojo los nombres de todas
las integrantes seleccionadas. El conocimiento de la tesorera y del domicilio de recolección se
presenta en verde para respuestas afirmativas y en rojo para negativas; cuando existe una selección
positiva también muestra el nombre relacionado. Una respuesta ausente se identifica como pendiente.

El resumen aporta contexto para la futura determinación del `Monto verificado`, pero esta entrega no
crea el importe, una regla de cálculo, persistencia, dictamen, autorización ni transición de estado.

**MOTIVO**: Permitir que el verificador comprenda de inmediato los datos relevantes para revisar el
monto sin recorrer nuevamente una entrevista extensa ni confundir el resumen con una decisión
financiera confirmada.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; MONTO VERIFICADO Y DICTAMEN PENDIENTES

---

## 2026-10-07 | Ciclo individual vigente en Conclusiones (DEC-182)

**DECISION**: La primera burbuja del resumen de `Conclusiones` representa exclusivamente el ciclo
individual vigente de la integrante y nunca el ciclo del grupo. Se calcula sumando el expediente
actual al conteo de ciclos individuales previos confirmados, cuya consulta ya excluye el expediente
en revisión.

Una integrante sin ciclos previos confirmados muestra `CICLO 1` dentro de una burbuja amarilla con
signo de advertencia `!`. Desde `CICLO 2`, la burbuja se presenta en verde. Cuando no existe una
fuente individual suficiente y tampoco una marca explícita de integrante nueva, se muestra
`CICLO INDIVIDUAL N/D` sin reutilizar ni inferir la numeración grupal.

Esta decisión sustituye en DEC-181 la etiqueta `NUEVO` y la referencia visual al conteo de ciclos
previos; el resto del resumen permanece sin cambios.

**MOTIVO**: Identificar correctamente a la integrante que cursa su primer crédito y evitar que la
trayectoria personal se confunda con el ciclo vigente del grupo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-07 | Fuente única del ciclo individual en encabezado y Conclusiones (DEC-183)

**DECISION**: El encabezado de Verificación Individual y la primera burbuja del resumen de
`Conclusiones` utilizan exactamente la misma presentación derivada del conteo individual
`creditos_participados`. El resumen no suma el expediente actual ni realiza un segundo cálculo.

El valor `1` se presenta como `1 CICLO` en amarillo con el signo `!`; desde `2 CICLOS` se presenta
en verde. Un conteo cero acompañado por la marca explícita de integrante nueva muestra `NUEVO` en
amarillo. Si el conteo individual no está disponible, ambos lugares muestran la indisponibilidad
sin sustituirla por `solicitudes.ciclo_numero` ni por el ciclo del grupo.

Esta decisión sustituye el cálculo de DEC-182 que sumaba uno al historial. El ciclo grupal continúa
visible exclusivamente en el encabezado contextual derecho y no interviene en las burbujas de
trayectoria individual.

**MOTIVO**: Eliminar la contradicción observada donde el encabezado mostraba `1 CICLO` y
Conclusiones `CICLO 2` para la misma integrante, preservando una sola fuente individual.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-08 | Historiales crediticios dentro de Conclusiones (DEC-184)

**DECISION**: Antes de `Conclusiones del verificador`, la pantalla muestra dos apartados separados
mediante la franja ocre oficial de Verificación.

`HISTORIAL CRELEALTAD` reutiliza exclusivamente el resumen individual confirmado que ya entrega la
API: monto máximo, monto mínimo y hasta cinco ciclos recientes. Cuando la fuente confirma que la
integrante no tiene historial, muestra un renglón rojo `SIN HISTORIAL`. Si la fuente es nula o
inconsistente, muestra indisponibilidad neutral y no infiere ausencia. No usa la simulación visual
de desarrollo.

`HISTORIAL OTRAS FINANCIERAS` reutiliza las respuestas persistidas de Entrevista y resume la
financiera, vigencia, ficha, semana y desembolso o último pago, ciclos, tasa declarada, asesora,
teléfono, motivo de no renovación cuando aplica y conteo de evidencias. Una respuesta explícita
`No` muestra en rojo `SIN HISTORIAL EN OTRAS FINANCIERAS`; una respuesta ausente permanece neutral.

El cambio es de consulta y presentación: no crea una segunda fuente, no modifica Entrevista, no
persiste conclusiones, no calcula el monto verificado y no emite dictamen o transición.

**MOTIVO**: Concentrar la trayectoria crediticia necesaria para revisar el monto y distinguir
claramente una ausencia confirmada de un dato pendiente o no disponible.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API, ESQUEMA O DICTAMEN

---

## 2026-10-08 | Ficha y antigüedad estimada del desembolso externo (DEC-185)

**DECISION**: En `HISTORIAL OTRAS FINANCIERAS`, el valor semanal de la ficha se presenta como
moneda mediante el patrón `$ #,###`, con espacio después del signo y separador de miles.

Cuando el crédito externo está activo, el renglón `MES DE DESEMBOLSO` coloca el mes al inicio del
espacio de valor y, a su derecha, muestra dos cantidades de semanas completas separadas por guion.
La primera se calcula desde el día 1 del mes declarado hasta la fecha de captura de la Entrevista;
la segunda, desde el último día de ese mes hasta la misma fecha. Por ejemplo, una captura del 8 de
octubre con desembolso declarado en julio muestra `14 - 9 SEM`.

La fecha de referencia es `updated_at` de la Entrevista confirmada por el servidor. Mientras existe
un borrador local pendiente se usa su `updatedAt`, para conservar el momento real de captura y no
recalcular contra la fecha posterior de consulta. Como Entrevista sólo solicita el mes, se utiliza la
ocurrencia más reciente de ese mes que no sea posterior a la captura; si la captura pertenece al
mismo mes, el extremo final se limita a la propia fecha de captura. Si falta el mes o la fecha, no se
inventa el rango.

**MOTIVO**: Facilitar la lectura del compromiso semanal y estimar la antigüedad posible del crédito
sin aparentar una fecha exacta de desembolso que la entrevista no captura.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-08 | Validación de semana actual contra rango externo (DEC-186)

**DECISION**: En el crédito externo activo, el rango estimado se presenta de menor a mayor: primero
las semanas completas desde el último día del mes declarado y después las semanas desde el primer
día. El ejemplo anterior de julio al 8 de octubre se muestra como `9 - 14 SEM`.

El rango aparece dentro de una burbuja verde con marca de confirmación cuando `SEMANA ACTUAL` es un
entero comprendido entre ambos extremos, inclusive. Si la semana actual no pertenece al intervalo,
falta o no es válida, la burbuja es roja y muestra una marca de rechazo. El texto y la marca evitan
que el resultado dependa únicamente del color.

Los renglones `ASESORA` y `TELÉFONO DE LA ASESORA` se retiran exclusivamente del resumen de
`Conclusiones`; la captura y persistencia originales de Entrevista permanecen sin cambios.

Esta decisión sustituye en DEC-185 únicamente el orden visual del rango y complementa su lectura
con la validación de `SEMANA ACTUAL`.

**MOTIVO**: Leer el intervalo en orden natural y señalar de inmediato si la semana declarada es
compatible con el mes y la fecha de captura, eliminando datos que no son necesarios para esta
revisión.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-08 | Alineación del desembolso y consulta de evidencia externa (DEC-187)

**DECISION**: El renglón `MES DE DESEMBOLSO` centra verticalmente la etiqueta y sus valores. El mes
y el rango se agrupan hacia la derecha con separación breve. El mes usa su propia burbuja con el
mismo tono verde o rojo derivado de la compatibilidad entre `SEMANA ACTUAL` y el rango; el rango
conserva además la marca visible de confirmación o rechazo.

Cuando existe al menos una fotografía guardada, el valor del renglón `EVIDENCIA` se presenta como
una acción táctil de tamaño accesible. Al tocarla abre el visor institucional a pantalla completa con
las evidencias guardadas de esa financiera y navegación entre páginas. Incluye tanto las imágenes
vigentes del comprobante de línea de crédito provenientes de Documentación como las evidencias
confirmadas agregadas en Entrevista; no incluye capturas todavía pendientes de guardar. Si no hay
evidencia confirmada, el renglón permanece informativo y no simula una acción disponible.

**MOTIVO**: Corregir la alineación visual del dato comparado y permitir revisar la evidencia desde
el mismo resumen donde el verificador analiza el historial externo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; REUTILIZA EVIDENCIA EXISTENTE, SIN CAMBIO DE API O ESQUEMA

---

## 2026-10-08 | Catálogo de financieras competidoras en Parámetros (DEC-188)

**DECISION**: M11 Parámetros incorpora un catálogo institucional versionado de financieras
competidoras. Cada financiera conserva nombre oficial y alias; cada versión define motivo
obligatorio, vigencia, estado activo/inactivo y una clasificación cerrada: `OBJETIVO`, `REVISION`
o `NO_PRIORITARIA`.

La señal se presenta en Conclusiones con texto y color: verde para cartera objetivo, amarillo para
revisión y rojo para cartera no prioritaria. Si no existe una versión publicada vigente a la fecha
de captura de la Entrevista, se muestra `SIN CLASIFICAR`; nunca se infiere una clasificación a
partir del nombre ni se precargan criterios no aprobados. Esta señal orienta la revisión, pero no
autoriza, rechaza ni modifica automáticamente el monto verificado.

Se aplica el doble control de DEC-175: Administración propone y publica; Gerencia aprueba o
rechaza; quien aprobó no puede publicar y quien propuso no puede decidir. No se borra historial:
las bajas se expresan mediante una versión inactiva. La consulta de Conclusiones usa la fecha de
captura para que una publicación posterior no cambie retroactivamente una entrevista anterior.

**MOTIVO**: Centralizar una política variable que hoy no tiene gobierno, permitir que operación
clasifique la competencia con trazabilidad y dar al verificador una señal compacta sin hardcodear
financieras ni convertir el catálogo en un motor automático de crédito.

**ESTADO**: CERRADA E IMPLEMENTADA EN API, MOBILE Y POSTGRESQL MEDIANTE MIGRACIÓN 037.

---

## 2026-10-08 | Consulta temporal de Parámetros para todos los usuarios (DEC-189)

**DECISION**: Durante la revisión operativa de M11, todos los roles activos pueden consultar el
módulo Parámetros. La concesión se expresa como capacidad exacta `parametros:leer` y también se
agrega a los permisos personalizados existentes, porque éstos sustituyen el permiso heredado del
rol.

Esta excepción no concede proponer, modificar, aprobar, rechazar ni publicar. Administración y
Gerencia conservan las responsabilidades y la separación de actores establecidas por DEC-175 y
DEC-188. No se habilitan usuarios inactivos ni rutas sin autenticación.

La migración registra permisos antes/después en `audit_log`. La reversión restaura exactamente el
valor anterior y se detiene si detecta cambios posteriores, para no sobrescribir administración de
acceso legítima.

**MOTIVO**: Permitir que todo el personal revise temporalmente la pantalla recién construida sin
aprovechar el producto cartesiano del contrato heredado, que podría ampliar acciones distintas de
lectura.

**ESTADO**: CERRADA, TEMPORAL E IMPLEMENTADA EN API, MOBILE Y POSTGRESQL MEDIANTE MIGRACIONES 038–039.

---

## 2026-10-08 | Lista base y semáforo visible de financieras competidoras (DEC-190)

**DECISION**: M11 muestra como catálogo base las trece financieras reales que existían en el
selector de historial crediticio: Banco BanFeliz, Came, Compartamos Banco, Credi Ok, Crediclub,
CrediMujer, Crédito Sí (Afirme), Exitus Contigo, Mi Tandita, Seamos Socios, Solidar, Todo Fácil y
Tuiio (Santander). `Otra` continúa como opción funcional al final del selector de Entrevista y no
se registra como si fuera una financiera.

Cada financiera presenta tres casillas de selección exclusiva con texto y marca además del color:
`Óptima` verde (`OBJETIVO`), `Atención` amarilla (`REVISION`) y `No interesa` roja
(`NO_PRIORITARIA`). Elegir una casilla prepara la propuesta correspondiente; el motivo obligatorio,
la aprobación de Gerencia y la publicación por Administración continúan vigentes. Agregar y quitar
financieras usa el mismo gobierno. Quitar significa publicar una versión inactiva y nunca borrar la
identidad ni su historial.

Cuando la API responde, el pop-up de Entrevista usa únicamente las financieras disponibles en
Parámetros y conserva una selección histórica aunque después se dé de baja. Si no hay conexión,
usa las trece financieras iniciales como respaldo sin inventar clasificación. Las identidades base
pueden aparecer `SIN CLASIFICAR` hasta que exista una versión aprobada y publicada.

**MOTIVO**: Convertir Parámetros en la fuente operativa del selector, hacer inmediata la lectura del
semáforo solicitado y permitir mantenimiento del catálogo sin perder captura offline ni historial.

**ESTADO**: CERRADA E IMPLEMENTADA EN API, MOBILE Y POSTGRESQL MEDIANTE MIGRACIÓN 040.

---

## 2026-10-08 | Nombre oficial separado del alias visible en Verificación (DEC-191)

**DECISION**: Cada financiera conserva en Parámetros su nombre oficial o razón social y uno o más
alias operativos. El primer alias es el nombre principal con el que las integrantes identifican a la
financiera y es el texto que muestra el pop-up de historial crediticio. Si todavía no existe alias,
el pop-up usa temporalmente el nombre oficial para no perder la opción.

El nombre oficial también forma parte de cada versión: Administración puede proponer su corrección,
pero la identidad sólo cambia cuando Gerencia aprueba y Administración publica. El historial conserva
el nombre oficial y el alias correspondientes a cada revisión. Para las trece identidades base, el
texto conocido actual funciona inicialmente como alias visible aunque aún no exista una versión.

**MOTIVO**: Mantener la razón social correcta para gobierno y auditoría, mientras la captura en campo
usa el nombre cotidiano que reconocen las integrantes.

**ESTADO**: CERRADA E IMPLEMENTADA EN API, MOBILE Y POSTGRESQL MEDIANTE MIGRACIÓN 041.

---

## 2026-10-08 | Captura inicial opcional y simplificada de financieras (DEC-192)

**DECISION**: La propuesta de una financiera muestra, en este orden, únicamente: alias visible en
el pop-up, nombre oficial y clasificación. Ninguno de esos tres datos es obligatorio de manera
individual. La clasificación puede permanecer vacía y se representa como `SIN CLASIFICAR`.

Motivo, vigencia y disponibilidad se retiran de esta captura. El servidor asigna como vigencia la
fecha de propuesta y conserva la financiera activa salvo que la acción explícita sea quitarla o
reactivarla. No se permite enviar una propuesta completamente vacía o sin cambios; para crear una
identidad nueva se requiere al menos alias o nombre oficial, porque el catálogo necesita un texto
visible. El doble control, la publicación, la auditoría y el historial permanecen vigentes.

Esta decisión sustituye exclusivamente la obligatoriedad de clasificación y motivo establecida en
DEC-188 y DEC-190; no modifica los roles ni convierte el semáforo en una decisión crediticia.

**MOTIVO**: Permitir que Administración capture primero el nombre cotidiano reconocido por las
integrantes y complete gradualmente la razón social o la clasificación sin inventar datos.

**ESTADO**: CERRADA E IMPLEMENTADA EN API, MOBILE Y POSTGRESQL MEDIANTE MIGRACIÓN 042.

---

## 2026-10-08 | Catálogo separado por presencia en el pop-up (DEC-193)

**DECISION**: La pantalla `Financieras competidoras` elimina la explicación introductoria y muestra
primero el botón `Agregar financiera`. El catálogo se divide en dos secciones visibles:
`SE MUESTRAN EN EL POP-UP` y `NO SE MUESTRAN`. Cada financiera ocupa un renglón delimitado que
presenta únicamente su alias y un círculo con el color seleccionado; sin clasificación, el círculo
permanece blanco.

La sección se determina con la disponibilidad que ya está publicada. Las identidades del catálogo
base se muestran mientras no exista una versión publicada que las desactive; una financiera nueva no
se muestra hasta publicar su primera versión activa. Una propuesta pendiente no mueve el renglón antes
de la aprobación de Gerencia y la publicación por Administración.

**MOTIVO**: Hacer evidente qué opciones están disponibles durante la entrevista, reducir texto y
separar visualmente las financieras incluidas de las excluidas sin romper el doble control.

**ESTADO**: CERRADA E IMPLEMENTADA EN API Y MOBILE; SIN CAMBIO DE ESQUEMA.

---

## 2026-10-08 | Disponibilidad del pop-up dentro de la edición (DEC-194)

**DECISION**: La pantalla `Propuesta de financiera` incorpora al final la pregunta
`¿Se muestra en el pop-up?` con selección exclusiva `Sí / No`. La opción se presenta tanto al crear
como al modificar una financiera. `Sí` propone incluirla en nuevas capturas y `No` propone retirarla
del pop-up sin borrar su identidad ni su historial.

La selección no se aplica al enviar el formulario: conserva la aprobación de Gerencia y la
publicación por Administración. Hasta que se publique, la financiera permanece en la sección que
corresponde a su versión vigente.

**MOTIVO**: Permitir que Administración controle la presencia en el pop-up desde la misma pantalla
en la que modifica alias, nombre y clasificación, sin depender de una acción separada ni confundir
ocultar con eliminar.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; REUTILIZA EL CONTRATO Y ESQUEMA VIGENTES.

---

## 2026-10-08 | Datos complementarios y disponibilidad compacta (DEC-195)

**DECISION**: La propuesta de una financiera conserva primero alias, nombre oficial y clasificación,
y agrega después `Motivo de la clasificación` y `Vigencia desde`. El motivo continúa opcional, pero
si se captura exige al menos cinco caracteres. La vigencia se precarga con la fecha local actual,
acepta el formato `AAAA-MM-DD` y no permite fechas anteriores.

La pregunta de disponibilidad se presenta exactamente como
`¿Disponible para captura y conclusiones?`, mediante dos círculos pequeños `Sí` y `No`. Ambos usan
escala de grises: la opción elegida queda con fondo gris claro y borde gris oscuro; no se usa verde o
rojo para esta decisión. El alias permanece al inicio porque es el texto principal del pop-up; no se
duplica como un segundo campo de alias conocidos.

Motivo, vigencia y disponibilidad forman parte de la versión propuesta y sólo producen efectos tras
la aprobación de Gerencia y la publicación por Administración.

**MOTIVO**: Recuperar los datos complementarios de la ficha original y reproducir el control compacto
solicitado sin alterar el orden previamente aprobado para alias y nombre oficial.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; REUTILIZA API Y POSTGRESQL VIGENTES.

---

## 2026-10-08 | Disponibilidad con selector institucional de Verificación (DEC-196)

**DECISION**: La pregunta final de la propuesta cambia a `¿Se muestran en el pop-up?`. Sus respuestas
`Sí / No` reutilizan directamente `SelectorField`, el mismo componente que emplean las preguntas
binarias de Entrevista en Verificación. Por tanto, conservan exactamente su altura mínima de 40,
borde redondeado tipo píldora, separación, tipografía y comportamiento de selección.

El color seleccionado procede del tema gris de Parámetros; no se mantienen tamaños ni estilos
locales para este control. Esta decisión sustituye el texto y el control circular específico definidos
en DEC-195, sin cambiar el significado versionado de la disponibilidad.

**MOTIVO**: Mantener consistencia visual con el resto de la aplicación y evitar círculos más grandes
que los controles binarios institucionales ya utilizados en Verificación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O ESQUEMA.

---

## 2026-10-08 | Márgenes y separación de franjas de sección (DEC-197)

**DECISION**: Las franjas de sección deben conservar el mismo patrón visual en todos los módulos.
Cuando la franja es hija directa de un cuerpo con el relleno institucional `spacing.lg`, usa
`StickySectionHeader` con `placement="standalone"`: compensa lateralmente `spacing.xs`, por lo que
queda ligeramente más larga que los campos y conserva un margen efectivo `spacing.md` respecto de
la pantalla, igual que Verificación. Deja `spacing.lg` respecto del bloque anterior y `spacing.sm`
antes del primer campo o dato.

`fullBleed` queda reservado para una franja integrada dentro de una tarjeta u otro contenedor con
relleno. En ese caso puede extenderse hasta los bordes del contenedor, como en los historiales de
Verificación, pero nunca cancelar el margen lateral del cuerpo de pantalla.

**MOTIVO**: Evitar franjas pegadas al bloque anterior, separar con claridad el primer dato y mantener
la misma anchura visual de Verificación en Parámetros y en los módulos futuros.

**ESTADO**: CERRADA E IMPLEMENTADA EN COMPONENTE COMPARTIDO Y M11; SIN CAMBIO DE API O ESQUEMA.

---

## 2026-10-08 | Descripción extensa del producto por financiera (DEC-198)

**DECISION**: La propuesta de financiera incorpora el dato opcional `Descripción` inmediatamente
después de `Refinanciamiento` y antes de `PARTICIPACIÓN MERCADO`. Es un área multilínea de texto
libre con un máximo de 10,000 caracteres. Al normalizar se eliminan únicamente los espacios de los
extremos; se conservan los espacios y saltos de línea internos.

La descripción forma parte de la versión de la financiera y recorre el mismo flujo de propuesta,
aprobación, publicación, ficha e historial. Se almacena como `TEXT NULL`; es un dato declarativo y no
se interpreta para calcular, autorizar, rechazar ni modificar un crédito.

**MOTIVO**: Permitir registrar explicaciones amplias del producto en el punto indicado sin forzarlas
dentro de los siete campos breves ni perderlas cuando cambie la versión publicada.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 045.

---

## 2026-10-08 | Administración como autoridad final de Parámetros (DEC-199)

**DECISIÓN**: El rol `ADMINISTRADOR` representa a las personas directoras de la financiera y es la
autoridad final del módulo M11 Parámetros. Administración captura, revisa y publica cada cambio en
un solo paso mediante `Guardar y publicar`; no lo envía a Gerencia ni existe devolución, aprobación
o rechazo intermedio para este módulo.

La API registra la versión directamente como `PUBLICADA` dentro de una transacción. Para conservar
el esquema histórico y su trazabilidad, el mismo administrador ocupa las columnas técnicas de
propuesta, decisión y publicación. Permanecen obligatorios JWT, capacidades exactas, rol
`ADMINISTRADOR`, revisión esperada, vigencias sin traslape, historial y el evento auditable
`FIN_PUBLICADA`. La migración 046 retira `parametros:aprobar` y `parametros:rechazar` de roles y
excepciones individuales, garantiza `parametros:leer`, `parametros:actualizar` y
`parametros:registrar` para Administración, y deja a Gerencia sólo con lectura de M11.

Esta decisión sustituye DEC-175 y DEC-188 a DEC-195 únicamente en lo relativo a aprobación de
Gerencia y publicación posterior de Administración en M11. M12 conserva el doble control aprobado;
el rol `ADMINISTRADOR` no hereda por esta decisión permisos operativos o financieros de otros
módulos. Las versiones y estados históricos anteriores no se borran ni se reinterpretan.

**MOTIVO**: Las personas administradoras serán las directoras de la financiera y definirán sus
parámetros. Un recorrido de envío, aprobación y regreso no agrega una separación real de autoridad y
sí retrasa la aplicación de la política.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 046.

---

## 2026-10-08 | Acceso directo a Parámetros de financiera (DEC-200)

**DECISIÓN**: Se elimina la pantalla intermedia `Detalle de financiera`. Cada renglón del catálogo
`Financieras competidoras` funciona como botón y abre directamente `Parámetros de financiera` con
los datos vigentes precargados. En ese único formulario Administración define la razón social, el
alias del pop-up, la clasificación, la disponibilidad, el producto y la participación de mercado.

El círculo del renglón inicial muestra exclusivamente la clasificación publicada vigente: verde para
`Óptima`, amarillo para `Atención`, rojo para `No interesa` y blanco cuando no existe clasificación.
Después de `Guardar y publicar`, la navegación regresa al catálogo actualizado. El historial se
conserva como acción secundaria dentro del formulario y no como pantalla obligatoria de paso. Los
usuarios sin permiso de modificación pueden consultar el mismo formulario en modo de sólo lectura.

**MOTIVO**: Evitar una pantalla duplicada que sólo obligaba a tocar nuevamente `Modificar datos` y
concentrar en un solo lugar la definición completa de cada financiera.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-08 | Vigencia visible en formato DD-MMM-AAAA (DEC-201)

**DECISIÓN**: En `Parámetros de financiera`, `Vigencia desde` se precarga, presenta y captura como
`DD-MMM-AAAA`, con la abreviatura española del mes en mayúsculas; por ejemplo,
`08-OCT-2026`. El historial del módulo usa el mismo formato visible.

Mobile convierte el valor a `AAAA-MM-DD` antes de enviarlo a la API. El contrato HTTP, el tipo
`DATE` de PostgreSQL, la comparación cronológica y la auditoría conservan su representación ISO.

**MOTIVO**: Facilitar la lectura cotidiana de la fecha sin sacrificar el formato canónico requerido
para persistencia, orden y validación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-08 | Nombre de financiera sin leyenda de clasificación en Conclusiones (DEC-202)

**DECISIÓN**: En `HISTORIAL OTRAS FINANCIERAS`, el renglón `FINANCIERA` muestra dentro de la
burbuja exclusivamente el nombre capturado o resuelto de la financiera. No agrega de forma visible
`OBJETIVO`, `REVISAR`, `NO PRIORITARIA`, `SIN CLASIFICAR` ni ninguna otra leyenda de clasificación.

La clasificación publicada vigente de M11 determina el color de la burbuja: verde para `OBJETIVO`,
amarillo para `REVISION` y rojo para `NO_PRIORITARIA`. Si no existe clasificación, la burbuja queda
con fondo blanco y marco oscuro. La semántica puede conservarse en la etiqueta de accesibilidad para
no depender únicamente del color, pero no se muestra como texto en la pantalla.

Esta decisión sustituye exclusivamente la presentación visible de la clasificación en Conclusiones
definida por DEC-188. No cambia la captura, el catálogo de Parámetros, la resolución histórica, el
monto verificado, la API ni PostgreSQL.

**MOTIVO**: Mantener el resumen limpio, dar prioridad al nombre de la financiera y respetar el color
configurado en Parámetros sin ocupar espacio con una leyenda redundante.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-08 | Clasificación vigente al revisar Conclusiones (DEC-203)

**DECISIÓN**: El color de la burbuja `FINANCIERA` en `HISTORIAL OTRAS FINANCIERAS` se resuelve con
la versión publicada vigente en M11 al momento de abrir o revisar la conclusión. Mobile consulta el
catálogo vigente sin enviar como filtro la fecha histórica de actualización de la entrevista.

La fecha de captura de la entrevista continúa siendo la referencia para calcular el rango de semanas
desde el mes de desembolso y no se altera. Tampoco cambian el nombre declarado, las respuestas, las
evidencias ni la auditoría de la entrevista. Una publicación posterior en Parámetros actualiza sólo
la señal visual de análisis: verde, amarillo, rojo o blanco con marco oscuro.

Esta decisión sustituye en DEC-188 la resolución de la clasificación a la fecha de captura y la
referencia a resolución histórica de DEC-202. No modifica el versionado de M11, el monto verificado,
el contrato HTTP de la API ni PostgreSQL.

**MOTIVO**: La clasificación representa la política de análisis vigente. Una entrevista capturada
antes de que Dirección clasifique la financiera no debe continuar apareciendo sin color cuando el
verificador revisa actualmente la conclusión.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-09 | Ciclo y evidencia compactos en Conclusiones (DEC-204)

**DECISIÓN**: La burbuja del ciclo individual elimina la marca de advertencia `!`. Únicamente
`1 CICLO` usa fondo amarillo; desde `2 CICLOS` conserva la presentación verde y los estados
`NUEVO` o no disponible permanecen neutrales. El texto usa el peso fuerte institucional de las
demás burbujas. La misma presentación se reutiliza en el encabezado individual y en `Conclusiones`,
sin cambiar la fuente `creditos_participados` ni sumar el expediente actual.

En `HISTORIAL OTRAS FINANCIERAS`, la acción `EVIDENCIA` muestra un icono de cámara y el conteo
compacto `N FOTO / N FOTOS`, sin la palabra `GUARDADA(S)`. La acción usa el patrón rectangular del
botón secundario de Verificación: fondo blanco, borde ocre reforzado de dos puntos, radio medio y
contenido centrado; no usa forma de píldora. Todos los datos de cada renglón del resumen quedan
centrados verticalmente; la acción continúa abriendo únicamente las fotografías confirmadas
mediante el visor institucional.

Esta decisión sustituye en DEC-183 exclusivamente la marca `!` y la presentación amarilla de
`NUEVO`, y precisa la presentación visual aprobada en DEC-187. No modifica datos, reglas de conteo,
API, esquema, permisos ni persistencia.

**MOTIVO**: Reducir ruido visual, reservar el amarillo para el primer ciclo y facilitar la lectura
de evidencia y valores dentro de renglones de distinta altura.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-09 | Círculos claros en el catálogo de financieras (DEC-205)

**DECISIÓN**: En `Financieras competidoras`, el círculo de clasificación usa fondo semántico claro
y borde sólido del color correspondiente: verde para `Óptima`, amarillo para `Atención` y rojo para
`No interesa`. `Sin clasificación` conserva fondo blanco y borde gris.

La clasificación publicada, el texto accesible del renglón y el comportamiento al abrir la
financiera permanecen sin cambios. Esta decisión precisa únicamente la presentación del círculo
definido en DEC-193 y DEC-200.

**MOTIVO**: Mantener el mismo tratamiento de color suave utilizado por los estados y resúmenes del
resto de la aplicación, sin perder la identificación mediante el borde.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-09 | Integrantes asociadas a Evidencia de otra financiera (DEC-206)

**DECISIÓN**: Después de tomar cada fotografía nueva en `Evidencia de otra financiera`, mobile
debe abrir obligatoriamente un selector con todas las integrantes participantes del expediente.
La usuaria puede marcar una, varias, cada una de forma individual o `Todas las integrantes`; no
puede guardar la fotografía con el conjunto vacío.

El archivo se almacena una sola vez y se relaciona con todas las integrantes seleccionadas. La API
deriva el expediente desde la integrante de origen, rechaza UUID de otro expediente o integrantes
que no participan en Verificación y conserva actor y fecha de cada asociación. La misma evidencia
aparece al consultar cualquiera de las integrantes seleccionadas, sin copiar el archivo. Las
evidencias existentes se asocian inicialmente sólo con su integrante de origen para preservar su
significado histórico.

Esta regla aplica únicamente a `HISTORIAL_CREDITO_ACTIVO` y `HISTORIAL_CREDITO_INACTIVO`; las
fotografías de negocio, control de pagos y folleto continúan perteneciendo a la integrante
entrevistada. Una captura que ya comenzó debe completar su selección y confirmación o permanecer
pendiente; nunca se presenta como guardada antes de la respuesta del servidor.

**MOTIVO**: La mayoría de los comprobantes externos son grupales y puede conservarlos físicamente
una sola integrante, aunque documenten a varias o a todas las participantes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 047.

---

## 2026-10-09 | Cancelar descarta la evidencia pendiente (DEC-207)

**DECISIÓN**: En el selector de integrantes que aparece después de tomar una fotografía de otra
financiera, `Cancelar` significa descartar por completo esa toma local. Debe cerrar el pop-up,
eliminar de memoria la imagen, ubicación, clave idempotente y selección temporal, y habilitar de
nuevo `Tomar fotografía` sin exigir que se elija ninguna integrante.

La misma regla aplica al retroceso nativo del dispositivo y al cierre del pop-up tocando fuera de
él. Cancelar no llama a la API, no crea asociaciones y no presenta la fotografía como guardada. La
confirmación `Guardar evidencia` continúa exigiendo al menos una integrante conforme a DEC-206.

**MOTIVO**: Permitir repetir una fotografía incorrecta sin obligar a relacionarla ni conservar una
captura que la usuaria decidió desechar.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-09 | Corrección de integrantes desde el visor de evidencia (DEC-208)

**DECISIÓN**: Las fotografías propias de `Evidencia de otra financiera` muestran en la base
izquierda de cualquier visor que las abra, incluido el carrusel dentro de Historial crediticio y el
visor desde Conclusiones, la acción `Integrantes` frente a los controles de zoom. La acción abre el
mismo selector de una, varias o todas las integrantes con la selección vigente precargada y exige
conservar al menos una antes de guardar. Los comprobantes heredados de Documentación permanecen
en modo de consulta y no muestran esta acción.

La API vuelve a validar permiso de registro, acceso a la evidencia, expediente y participación de
cada UUID. La corrección no duplica ni elimina el archivo. Las relaciones retiradas se marcan
inactivas y conservan su actor y fecha originales; altas o reactivaciones guardan el usuario y la
fecha de modificación. Cada cambio registra en `audit_log` el conjunto anterior y el nuevo. Si la
integrante desde cuya pantalla se hizo la corrección deja de estar seleccionada, la evidencia deja
de aparecer en esa pantalla después de la confirmación del servidor.

**MOTIVO**: Corregir directamente una asignación equivocada al revisar la fotografía, sin volver a
tomarla, duplicarla ni perder el historial de a quién correspondió.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 048.

---

## 2026-10-09 | Semáforo por fotografía de otra financiera (DEC-209)

**DECISIÓN**: Después de aceptar cada fotografía nueva en `Evidencia de otra financiera` y antes de
abrir la selección de integrantes, mobile debe exigir una clasificación `VERDE`, `AMARILLO` o
`ROJO`. La selección se presenta debajo de la vista previa mediante el control semántico oficial;
`Continuar con integrantes` permanece deshabilitado hasta elegir un color. `Cancelar y repetir`
descarta la toma local conforme a DEC-207 y no llama a la API.

La clasificación se conserva por fotografía. En el carrusel y en el visor ampliado, las evidencias
propias de Entrevista muestran una franja superior y otra inferior del color elegido, además del
nombre visible y accesible del color para no depender únicamente de la percepción cromática. Los
comprobantes heredados de Documentación no reciben clasificación ni marco.

La API exige el valor sólo para nuevas evidencias `HISTORIAL_CREDITO_ACTIVO` o
`HISTORIAL_CREDITO_INACTIVO` y rechaza aplicarlo a otros tipos. Las filas históricas permanecen con
`NULL` y no reciben una clasificación inventada. Los colores registran la clasificación declarada
por el verificador; por sí solos no determinan dictamen, autorización, estado ni consecuencia
financiera automática.

**MOTIVO**: Permitir identificar visualmente cómo clasificó el verificador cada fotografía de otra
financiera, manteniendo la decisión ligada al archivo correcto antes de su asociación grupal.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 049.

---

## 2026-10-10 | Visor blanco único y bandas amplias para evidencia (DEC-210)

**DECISIÓN**: La evidencia de otra financiera debe abrirse con el mismo `DocumentViewer` blanco
tanto desde el carrusel de Entrevista como desde Conclusiones. Se retira el visor oscuro paralelo de
`DocumentImageCarousel`; ambos accesos conservan título, ayuda de zoom, navegación, acción
`Integrantes`, controles de ampliación y botón `Cerrar` dentro del formato compartido.

Cuando la fotografía tiene semáforo, el espacio libre que produce `contain` alrededor de la imagen
usa el color clasificado y se garantiza además una banda mínima de `64 px` en la parte superior y
otra en la inferior. La etiqueta visible y accesible del color se conserva; el fondo de fotografías
sin clasificación es blanco y el legado no recibe un color inferido.

**MOTIVO**: Evitar que Entrevista y Conclusiones parezcan dos aplicaciones distintas y convertir el
semáforo en una señal dominante y legible, no en una línea delgada perdida alrededor de la foto.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-10 | Deslizamiento entre evidencias y controles dentro de la franja (DEC-211)

**DECISIÓN**: `DocumentViewer` sustituye las acciones `Anterior / Siguiente` por paginación
horizontal directa. Con zoom en `100 %`, deslizar a izquierda o derecha cambia de fotografía;
cuando la fotografía está ampliada, el gesto se reserva para recorrerla. El índice visible y la
indicación de deslizamiento permanecen debajo de la imagen.

En una evidencia clasificada, `Integrantes` y los controles de zoom se centran dentro de la banda
inferior del semáforo, próximos al borde inferior y sin cubrir la zona útil de la fotografía.

**MOTIVO**: Aprovechar el gesto natural de una galería móvil y evitar que los controles oculten la
parte baja de la evidencia.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-10 | Entrevista inmersiva blanca y Conclusiones en panel (DEC-212)

**DECISIÓN**: La evidencia de otra financiera conserva una sola implementación compartida en
`DocumentViewer`, pero admite dos presentaciones blancas. Desde Entrevista, el carrusel abre una
vista inmersiva opaca de pantalla completa: encabezado compacto con título, evidencia/índice y `X`,
seguido por la fotografía ocupando todo el espacio restante. Desde Conclusiones permanece el panel
blanco con ayuda, índice y acción `Cerrar`.

La presentación inmersiva conserva semáforo, `Integrantes`, zoom y deslizamiento horizontal. No
recupera ningún fondo oscuro. Esta decisión sustituye únicamente la igualdad visual declarada en
DEC-210; mantiene el componente compartido, la superficie blanca, las bandas y DEC-211.

**MOTIVO**: Recuperar en Entrevista el tamaño útil anterior de la fotografía sin perder la claridad
del fondo blanco ni crear dos implementaciones independientes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-10 | Bloqueo del carrusel durante pellizco y zoom (DEC-213)

**DECISIÓN**: En `DocumentViewer`, el inicio de un gesto con dos dedos bloquea inmediatamente la
paginación horizontal y devuelve el carrusel a la fotografía activa si alcanzó a desplazarse. El
bloqueo permanece mientras la imagen esté ampliada; durante ese tiempo, arrastrar recorre sólo la
misma fotografía y no puede traer una evidencia vecina, su semáforo ni sus controles.

La paginación entre fotografías vuelve a habilitarse únicamente al regresar al `100 %`. Los botones
`Integrantes` y zoom permanecen ligados a la banda inferior de su propia evidencia durante todo el
gesto.

**MOTIVO**: Evitar que un pellizco se interprete simultáneamente como cambio de fotografía y mezcle
en pantalla dos imágenes, dos clasificaciones o controles de páginas distintas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE; SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-10 | Un motivo obligatorio por fotografía clasificada (DEC-214)

**DECISIÓN**: M11 incorpora tres pantallas independientes para que Administración registre los
conceptos de evidencia verde, amarilla y roja. Cada concepto pertenece a un solo color, puede
desactivarse o reactivarse y no se borra. No se precarga ningún concepto ni se infieren opciones;
Administración debe capturar las definiciones reales de la operación.

Después de seleccionar el color de una nueva fotografía de otra financiera, mobile abre un segundo
selector con únicamente los conceptos activos de ese color. La usuaria debe elegir exactamente un
motivo antes de habilitar `Continuar con integrantes`. Si el color no tiene opciones activas o el
catálogo no pudo consultarse, la confirmación permanece bloqueada y no se simula un guardado.

La API vuelve a exigir el motivo para `HISTORIAL_CREDITO_ACTIVO` y
`HISTORIAL_CREDITO_INACTIVO`, valida que esté activo y que corresponda al color, y lo conserva como
referencia por fotografía. Desactivar un concepto impide nuevas selecciones, pero mantiene las
evidencias históricas que ya lo usaron. Las fotografías anteriores a esta decisión conservan
motivo `NULL`; no reciben una explicación inventada. Color y motivo continúan siendo información
declarada por el verificador y no determinan por sí solos dictamen, autorización, estado o monto.

**MOTIVO**: Registrar de manera uniforme por qué se asignó cada color, evitando texto libre,
múltiples explicaciones por una misma fotografía y cambios retroactivos en la evidencia histórica.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 050.

---

## 2026-10-10 | Cinco motivos iniciales por color y edición segura (DEC-215)

**DECISIÓN**: M11 debe iniciar con cinco motivos activos para cada parámetro de fotografía: verde,
amarillo y rojo. La carga es versionada y completa hasta cinco sin borrar ni sustituir conceptos
que Administración ya haya registrado. En producción se conservan los tres motivos amarillos
existentes y se agregan únicamente dos; verde y rojo reciben cinco cada uno.

Administración puede editar el texto de un motivo mientras ninguna fotografía lo haya utilizado.
Después del primer uso el concepto se vuelve histórico: puede desactivarse y reemplazarse mediante
un alta nueva, pero no renombrarse de forma que cambie la explicación de evidencias anteriores.
Cada edición registra actor, fecha, texto anterior y texto nuevo.

**MOTIVO**: Permitir trabajar de inmediato con un catálogo inicial y ajustarlo posteriormente sin
perder los conceptos ya capturados ni reescribir el significado histórico de una fotografía.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 051.

---

## 2026-10-10 | Orden configurable y encabezado fijo de motivos (DEC-216)

**DECISIÓN**: Cada catálogo verde, amarillo y rojo conserva un orden positivo y único que
Administración puede modificar con acciones explícitas de subir y bajar. El orden incluye motivos
activos e inactivos para permanecer estable; el pop-up de Verificación filtra los inactivos sin
alterar la secuencia de los restantes. Todo motivo nuevo se agrega al final.

El renglón `CONCEPTOS REGISTRADOS` reutiliza la franja institucional de M11, con borde superior e
inferior del color del módulo y extensión ligeramente mayor que las tarjetas. La franja permanece
fija en la parte superior de la lista mientras sólo los motivos continúan desplazándose.

Cada cambio de orden exige el catálogo completo del color, valida que no falte ni se duplique un
UUID y registra en auditoría cada posición modificada. No renombra conceptos, no cambia su estado y
no altera evidencias históricas.

**MOTIVO**: Permitir que Dirección controle la prioridad visible del pop-up con una interacción
precisa para uso móvil, sin depender de arrastre fino ni de un orden hardcodeado.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 052.

---

## 2026-10-10 | Cámara o carrete para evidencia de otra financiera (DEC-217)

**DECISIÓN**: En las ramas activa e inactiva de `Evidencia de otra financiera`, la acción
`Agregar evidencia` permite elegir entre tomar una fotografía con la cámara o seleccionar una
imagen del carrete. Ambas alternativas conservan el mismo flujo obligatorio: clasificación
`VERDE / AMARILLO / ROJO`, exactamente un motivo activo del mismo color y selección de una,
varias o todas las integrantes correspondientes.

La app registra la fuente real como `CAMARA` o `GALERIA`, obtiene la ubicación actual del
dispositivo y la API deriva el actor del JWT. Una imagen elegida del carrete no inventa la fecha
original de la fotografía: `foto_capturada_at` permanece `NULL`; la fecha y fuente de la lectura de
ubicación sí se registran. La API rechaza `GALERIA` para `NEGOCIO`, `CONTROL_PAGOS` y
`FOLLETO_PREMIO_TESORERA`, que continúan exclusivamente por cámara.

**MOTIVO**: Permitir usar un comprobante que ya se encuentra en el teléfono sin debilitar la
clasificación, asociación grupal, geolocalización actual, trazabilidad ni restricciones de las
demás evidencias de campo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API. NO REQUIERE MIGRACIÓN; EL CONSTRAINT VIGENTE
YA ADMITE `CAMARA` Y `GALERIA`.

---

## 2026-10-10 | Parámetros agrupados por módulo (DEC-218)

**DECISIÓN**: El inicio de M11 organiza sus familias de parámetros según el módulo operativo donde
se aplican. Presenta Documentación, Verificación, Análisis, Desembolsos, Cobranza, Recolección,
Mora, Convenios y Reportes. Verificación abre un segundo nivel con `Financieras competidoras`,
`Motivos verdes`, `Motivos amarillos` y `Motivos rojos`.

Los módulos que todavía no tienen una familia de parámetros aprobada permanecen visibles pero
deshabilitados con la etiqueta `Sin parámetros`. Su presencia no crea contratos, reglas, permisos ni
valores para módulos futuros. Toda nueva familia deberá aprobarse antes de habilitar su tarjeta.

**MOTIVO**: Mantener ordenado el crecimiento de Parámetros, hacer evidente a qué proceso pertenece
cada configuración y evitar que catálogos de distintos módulos se mezclen en una sola pantalla.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-10 | Identidad gris y catálogos en renglón para M11 (DEC-219)

**DECISIÓN**: Todas las tarjetas del primer nivel de Parámetros usan el tema gris de M11, incluidos
Documentación, Verificación, Análisis, Desembolsos, Cobranza, Recolección, Mora, Convenios y
Reportes. No muestran los colores institucionales de sus módulos porque esa composición se parece
al Menú principal y puede confundir el nivel de navegación actual.

Después de seleccionar un módulo con familias disponibles, cada catálogo se presenta en un renglón
rectangular de ancho completo. El renglón conserva icono, título, descripción y flecha accesible de
apertura mediante `TaskMenuButton`; no reutiliza la tarjeta cuadrada del selector de módulos.

**MOTIVO**: Distinguir visualmente el selector interno de M11 del Menú principal y comunicar que el
segundo nivel contiene parámetros concretos, no otros módulos de la aplicación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE MEDIANTE COMPONENTES COMPARTIDOS. SIN CAMBIO DE API O
POSTGRESQL.

---

## 2026-10-10 | Motivo visible y controles centrados en el semáforo (DEC-220)

**DECISIÓN**: El visor de `Evidencia de otra financiera` presenta el motivo de la clasificación
centrado dentro de la franja superior verde, amarilla o roja, con texto negro, fuerte y de tamaño
legible. Las acciones `Integrantes` y zoom se elevan y quedan centradas visualmente dentro de la
franja inferior. Las evidencias legacy sin clasificación o motivo no muestran texto inventado.

El motivo visible reutiliza el concepto persistido para la fotografía; no introduce texto libre,
no sustituye su etiqueta accesible y no cambia el dictamen, estado, monto ni asociaciones de la
evidencia.

**MOTIVO**: Hacer visible la razón del semáforo durante la revisión de la fotografía y evitar que
los controles parezcan pegados al borde inferior en teléfonos altos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE MEDIANTE `DocumentViewer` Y `ZoomableImage`. SIN CAMBIO
DE API O POSTGRESQL.

---

## 2026-10-10 | Catálogos administrables de Entrevista (DEC-221)

**DECISIÓN**: M11 incorpora `Entrevista` dentro de Parámetros de Verificación y administra 18
familias de opciones usadas por la captura: origen de contacto, antigüedades, motivos de desacuerdo,
no renovación y no residencia, domicilio y convivencia, fuentes de ingreso, control de pagos,
frecuencia, calificación, rapidez y razones de recomendación.

Cada opción conserva un código estable y permite editar su etiqueta, ordenarla, desactivarla o
reactivarla sin borrar historial. Las seis familias de motivos admiten nuevas opciones porque se
persisten como texto declarado. Las familias ligadas a enums cerrados permiten administrar sólo los
códigos existentes; una alta nueva exige ampliar explícitamente el contrato de API. Cada catálogo
debe conservar al menos una opción activa y toda mutación registra actor, fecha y antes/después.

Verificación muestra únicamente opciones activas, pero consulta también las inactivas para resolver
correctamente códigos de entrevistas previas. Si la consulta remota falla, mobile usa el catálogo
local conocido y no bloquea una captura por una configuración que no pudo descargarse.

No son parámetros los `Sí / No`, estados, permisos, tipos de evidencia, meses/años calendario,
identificadores de integrantes ni límites numéricos validados por la API. Cambiarlos alteraría la
estructura o una regla de negocio y requiere una decisión funcional distinta.

**MOTIVO**: Permitir que Dirección ajuste el lenguaje y las opciones operativas de Entrevista sin
desplegar código, sin admitir valores que la API no puede interpretar y sin reescribir el significado
de capturas históricas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 053.

---

## 2026-10-10 | Alcance visible y jerarquía de Parámetros de Entrevista (DEC-222)

**DECISIÓN**: `Parámetros de verificación` presenta `Entrevista` como acceso único. Dentro de
`Parámetros de entrevista` se agrupan Financieras competidoras, Motivos verdes, Motivos amarillos,
Motivos rojos y siete familias directas: Cómo conoció a la asesora, Desacuerdo con montos, No
renovación, No vive en el domicilio, Sin control de pagos, Razones para recomendarnos y Razones para
no recomendarnos.

Dejan de mostrarse como parámetros modificables Tiempo de conocer al grupo, Tipo de domicilio,
Familiar propietario, Antigüedad en domicilio, Personas en casa, Convivientes, Fuentes de ingreso,
Antigüedad laboral, Frecuencia del servicio, Calificación del servicio y Rapidez de desembolso. La
retirada es administrativa y no elimina sus datos, códigos, preguntas ni significado histórico.

`Cómo conoció a la asesora` admite altas con código estable generado por la API. Al guardar una
entrevista, el servidor comprueba que el código pertenezca a esa familia y continúe activo. Esta
decisión actualiza expresamente el alcance visible de DEC-218 y DEC-221 sin migración destructiva.

**MOTIVO**: Concentrar todos los catálogos relacionados con la entrevista en una sola jerarquía y
permitir que Dirección administre únicamente las opciones que deben variar operativamente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API. SIN BORRADO NI MIGRACIÓN DE POSTGRESQL.

---

## 2026-10-10 | Monto del último préstamo y formato monetario único (DEC-223)

**DECISIÓN**: Cuando la integrante declara otro crédito grupal, la Entrevista pregunta
`¿Qué monto fue su último préstamo?` inmediatamente después de `¿De qué valor es/era su ficha?`,
tanto si ese crédito continúa activo como si ya finalizó. La respuesta es obligatoria para concluir
esa rama y se persiste en `monto_ultimo_prestamo_credito_grupal` como `NUMERIC(12,2)` nullable para
conservar el autoguardado parcial.

Toda respuesta monetaria visible en la app utiliza el formato `$ 18,000`: signo de pesos, un espacio,
separador de miles con coma y sin centavos visibles. La captura monetaria admite sólo pesos enteros;
la regla de presentación no reduce la precisión contable almacenada por contratos existentes.

**MOTIVO**: Poder comparar el valor de la ficha con el capital realmente recibido en la otra
financiera y evitar que captura, reapertura y resúmenes presenten el mismo importe de formas distintas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 054.

---

## 2026-10-11 | Color institucional del módulo Análisis (DEC-224)

**DECISIÓN**: El módulo Análisis adopta el tono verde claro `#B5E6A2` de la muestra 2 para el
encabezado, la barra de título, la acción primaria y la identidad visual de su tarjeta. Los textos
sobre este tono se presentan en color oscuro para conservar su legibilidad. Las muestras 1
(`#DAF2D0`) y 3 (`#C8ECBA`) quedan descartadas y dejan de mostrarse en `Colores definidos`.

**MOTIVO**: Dirección seleccionó la muestra 2 después de comparar las tres alternativas en
pantallas completas dentro de la aplicación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Contraste de barra y botón de Análisis (DEC-225)

**DECISIÓN**: Análisis conserva `#B5E6A2` en el encabezado y adopta `#8ED973` en la barra de título
y el botón principal. La barra no utiliza el mismo tono del encabezado. El texto permanece oscuro
en ambos fondos. Esta decisión precisa la distribución de color aprobada en DEC-224.

**MOTIVO**: Diferenciar visualmente la barra y la acción principal sin perder la identidad verde
seleccionada para Análisis.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Combinación definitiva de color para Análisis (DEC-226)

**DECISIÓN**: Análisis adopta definitivamente `#DAF2D0` para el encabezado y `#8ED973` para la barra
de título y el botón principal, con texto oscuro. La muestra anterior con encabezado `#B5E6A2`
queda sustituida y se retira del visor de colores definidos. Esta decisión reemplaza la selección de
encabezado de DEC-224 y DEC-225, y conserva el contraste de barra establecido en DEC-225.

**MOTIVO**: Dirección seleccionó la combinación completa después de compararla en una pantalla real
de la aplicación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Orden y separación del historial externo en Conclusiones (DEC-227)

**DECISIÓN**: Cuando el crédito externo está activo, el cuadro de Conclusiones integra el número de
ciclos en el renglón `ESTADO`, entre la etiqueta y `ACTIVO`. A continuación muestra `SEMANA ACTUAL`
y `MES DE DESEMBOLSO`, seguido por un borde del color de Verificación.

`VALOR DE FICHA`, `ÚLTIMO PRÉSTAMO` y `TASA DECLARADA` forman una tabla donde la primera columna
usa 46% del ancho para mantener los conceptos completos en una sola línea. El 54% restante se
divide exactamente en dos columnas de 27%: el dato capturado ocupa la central y la derecha queda
vacía. Los datos quedan centrados horizontal y verticalmente dentro de sus renglones. Dos
divisiones verticales separan las columnas y un borde inferior cierra la tabla después de la tasa.
La celda derecha no muestra ni infiere información.

**MOTIVO**: Concentrar estado y antigüedad en una sola lectura, y reservar la tercera columna
para la siguiente etapa de Conclusiones sin inventar todavía su contenido.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Acceso independiente a Conclusiones en Parámetros (DEC-228)

**DECISIÓN**: `Parámetros de verificación` presenta dos renglones hermanos: `Entrevista` y
`Conclusiones`. Tocar `Conclusiones` abre `Parámetros de conclusiones` como una pantalla
independiente y el retroceso vuelve al selector de Verificación.

Mientras Dirección no defina qué parámetros contiene, la pantalla muestra un estado vacío explícito
y no crea opciones, reglas, cálculos, API, tablas ni persistencia. Esta decisión amplía la jerarquía
visible de DEC-222, que deja de considerar `Entrevista` como acceso único.

**MOTIVO**: Preparar un apartado separado para configurar Conclusiones sin mezclar sus futuras
decisiones con los catálogos de Entrevista ni anticipar su contrato funcional.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Calificación parametrizada de la semana externa (DEC-229)

**DECISIÓN**: El primer renglón de `Parámetros de conclusiones` es `Calificar semana del crédito`.
Su pantalla presenta, en orden vertical, un círculo verde, uno amarillo y uno rojo. Junto a cada
color existen dos selectores desplazables, `Desde` y `Hasta`, con valores del 1 al 16.

Los tres rangos son inclusivos y deben formar una sola partición continua de las semanas 1 a 16:
verde inicia en 1, amarillo inicia una semana después de terminar verde, rojo inicia una semana
después de terminar amarillo y rojo termina en 16. No se publican huecos, traslapes o semanas fuera
del intervalo. La configuración inicial es verde 1–10, amarillo 11–13 y rojo 14–16.

Sólo ADMINISTRADOR puede guardar y publicar el cambio. La API vuelve a validar la partición, la
mutación queda auditada y PostgreSQL conserva la misma restricción. Verificación consulta el valor
vigente y colorea con éste el dato `SEMANA ACTUAL` del crédito en otra financiera; si no hay una
consulta confirmada, el dato permanece neutral. El color no autoriza, rechaza, modifica montos ni
emite dictamen.

Esta decisión sustituye el estado vacío temporal de DEC-228, sin mezclar el parámetro con los
catálogos de Entrevista.

**MOTIVO**: Permitir que Dirección cambie la interpretación visual de las semanas externas desde un
solo lugar, con cobertura completa y una regla verificable en UI, API y datos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 055.

---

## 2026-10-11 | Rangos de semana independientes y sin traslapes (DEC-230)

**DECISIÓN**: Los rangos verde, amarillo y rojo de `Calificar semana del crédito` no tienen un
orden obligatorio entre colores y no necesitan cubrir continuamente todas las semanas 1 a 16.
Cada color conserva extremos inclusivos dentro de 1–16 y su valor `Desde` debe ser menor o igual
que `Hasta`. La única relación obligatoria entre colores es que sus rangos no se traslapen: una
misma semana no puede pertenecer a dos colores.

Son válidos, por ejemplo, verde 13–16, amarillo 9–12 y rojo 1–8; también son válidos rangos que
dejen semanas sin color. Una semana no incluida en ningún rango permanece neutral en Conclusiones.

Esta decisión sustituye expresamente la exigencia de orden, continuidad y cobertura completa de
DEC-229. Conserva la administración exclusiva, la auditoría, el intervalo 1–16 y el carácter
visual del parámetro, que no autoriza, rechaza, modifica montos ni emite dictamen.

**MOTIVO**: Los colores representan rangos operativos independientes; su orden puede cambiar y la
regla necesaria es evitar una clasificación ambigua de la misma semana.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API; POSTGRESQL MEDIANTE MIGRACIÓN 056.

---

## 2026-10-11 | Calificación parametrizada de ciclos externos (DEC-231)

**DECISIÓN**: `Parámetros de conclusiones` incorpora `Calificar número de ciclos`, con la misma
presentación y reglas del parámetro de semanas. Verde, amarillo y rojo tienen extremos inclusivos
seleccionables del 1 al 40, que es el mismo intervalo capturado por `Verificación > Entrevista >
Ciclos en otra financiera`. Los colores pueden estar en cualquier orden y dejar números sin color,
pero un mismo número de ciclos no puede pertenecer a dos rangos.

El parámetro se persiste y audita de forma independiente. Su configuración inicial copia los rangos
vigentes del parámetro de semanas para no inventar una segunda política; Administración puede
publicar después sus límites propios. Verificación consulta el valor vigente y colorea únicamente
`CICLOS EN ESA FINANCIERA` en Conclusiones. Si la consulta falla o el número queda fuera de los tres
rangos, el dato permanece neutral. El color no autoriza, rechaza, modifica montos ni emite dictamen.

**MOTIVO**: Permitir que Dirección configure desde Conclusiones la interpretación visual del número
de ciclos declarado, usando exactamente el universo de valores ya capturado en Entrevista.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 058.

---

## 2026-10-11 | Tolerancia parametrizada de semana de desembolso (DEC-232)

**DECISIÓN**: `Parámetros de conclusiones` incorpora `Calificar semana de desembolso`. El valor
clasificado es la distancia de la `SEMANA ACTUAL` al rango estimado desde el mes de desembolso:
vale 0 cuando está dentro del rango, o el número de semanas que queda antes o después del límite
más cercano. La escala se limita a 0–10; el valor 10 representa diez semanas o más.

Verde, amarillo y rojo tienen rangos inclusivos configurables con scroll de 0 a 10, admiten
cualquier orden y huecos y no pueden traslaparse. La configuración inicial es verde 0, amarillo
1–3 y rojo 4–10. La publicación es independiente, auditada y sólo cambia el tono de `MES DE
DESEMBOLSO` y su rango estimado en Conclusiones; no modifica capturas, montos ni dictámenes. Si no
se confirma el parámetro o faltan los datos para calcular la distancia, ambos valores permanecen
neutrales.

**MOTIVO**: Sustituir la comparación fija dentro/fuera por una tolerancia operativa graduable y
administrable, simétrica para semanas anteriores o posteriores al rango estimado.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 059.

---

## 2026-10-11 | Cálculos cruzados de ficha y préstamo en Conclusiones (DEC-233)

**DECISIÓN**: Cuando existe una tasa declarada positiva, la tercera columna del bloque económico de
otras financieras muestra dos cálculos:

- En `VALOR DE FICHA`: `(ÚLTIMO PRÉSTAMO de la columna 2 ÷ 1,000) × TASA DECLARADA`.
- En `ÚLTIMO PRÉSTAMO`: `(VALOR DE FICHA de la columna 2 ÷ TASA DECLARADA) × 1,000`.

Si la tasa declarada está vacía, no se calculan las terceras celdas de ficha ni préstamo. En la
segunda columna de `TASA DECLARADA` se muestra `——` y la tercera calcula la tasa implícita mediante
`VALOR DE FICHA ÷ (ÚLTIMO PRÉSTAMO ÷ 1,000)`, equivalente a
`(VALOR DE FICHA ÷ ÚLTIMO PRÉSTAMO) × 1,000`. La tasa calculada se redondea al entero más cercano,
en congruencia con el catálogo entero de tasas de Entrevista.

Los resultados monetarios usan el formato institucional sin centavos. Cuando falta cualquiera de
los operandos positivos requeridos, la celda calculada permanece vacía y no presenta un resultado
ficticio.

Estos valores son informativos para Conclusiones: no sustituyen la captura declarada, no se
persisten, no modifican montos y no producen por sí mismos autorización, rechazo o dictamen.

**MOTIVO**: Permitir que el verificador compare de inmediato la ficha y el préstamo declarados
contra los valores que ambos implican al aplicar la tasa registrada.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Concordancia porcentual parametrizada de ficha y préstamo (DEC-234)

**DECISIÓN**: `Parámetros de conclusiones` incorpora dos configuraciones independientes:
`Calificar concordancia en ficha` y `Calificar concordancia en préstamo`. Cada una define rangos
inclusivos verde, amarillo y rojo entre 0% y 100%, admite cualquier orden y huecos y prohíbe que un
mismo porcentaje pertenezca a dos colores. La configuración inicial de ambas es verde 0–5%,
amarillo 6–10% y rojo 11–100%.

El valor clasificado es la diferencia porcentual absoluta entre el importe declarado y el importe
calculado según DEC-233: `|calculado − declarado| ÷ declarado × 100`, redondeada al entero más
cercano. Cero representa coincidencia exacta y 100 agrupa diferencias de 100% o mayores. Ficha y
préstamo consultan y aplican exclusivamente su propio parámetro. Cuando falta la tasa, un importe
positivo o la confirmación del parámetro, los valores permanecen neutrales.

La publicación es exclusiva de Administración, independiente y auditada. El semáforo es informativo
y se aplica únicamente a la tercera columna calculada. La segunda columna permanece neutral porque
contiene el dato proporcionado por la integrante. No sustituye importes declarados, no persiste el
cálculo derivado y no autoriza, rechaza ni emite dictamen.

**MOTIVO**: Hacer visible y administrable la tolerancia operativa entre los importes declarados por
la integrante y los valores que implica la tasa registrada, sin mezclar los criterios de ficha y
préstamo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 060.

---

## 2026-10-11 | Tasa opcional de otra financiera (DEC-235)

**DECISIÓN**: En ambas ramas del historial crediticio externo, `¿Qué tasa maneja?` y
`¿Qué tasa manejaba?` son preguntas opcionales. Mobile no muestra asterisco ni considera su ausencia
como pendiente para `Terminar entrevista`. Si la tasa se captura, conserva el selector de enteros
entre 65 y 100, el autoguardado y la restauración vigentes.

La ausencia se conserva como `NULL`; no se sustituye por cero ni se infiere una respuesta. Esta
decisión no modifica los cálculos informativos de Conclusiones definidos por DEC-233, que ya
contemplan el caso sin tasa declarada.

**MOTIVO**: Permitir completar la verificación cuando la integrante desconoce la tasa de la otra
financiera, sin descartar el dato cuando sí puede proporcionarlo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Porcentaje visible y proporción final del bloque económico (DEC-236)

**DECISIÓN**: La tercera columna de `VALOR DE FICHA` y `ÚLTIMO PRÉSTAMO` muestra el importe
calculado y el porcentaje absoluto de diferencia respecto al valor declarado de la segunda
columna, en burbujas separadas y sobre la misma línea. Ese mismo entero porcentual se entrega al
parámetro independiente de concordancia de la fila y determina su tono.

Las columnas quedan en proporción explícita `37% / 27% / 36%`: concepto, valor declarado y
resultado calculado. La segunda columna conserva exactamente 27%; la tercera recibe el espacio
retirado de la primera para presentar importe y porcentaje sin mezclar sus responsabilidades.

**MOTIVO**: Mostrar la magnitud que explica el semáforo parametrizado y mantener legible la
comparación entre declarado y calculado.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Etiquetas abreviadas y mayor espacio para el resultado (DEC-237)

**DECISIÓN**: En la tabla económica de Conclusiones, las etiquetas visibles se presentan como
`VALOR DE FICHA`, `ÚLT. PRÉSTAMO` y `TASA`. Las columnas quedan en proporción explícita
`33% / 27% / 40%`: concepto, valor declarado y resultado calculado. La primera columna reduce su
relleno horizontal para conservar `VALOR DE FICHA` en una sola línea; todo el espacio liberado se
asigna a la tercera columna.

**MOTIVO**: Priorizar la lectura conjunta del importe calculado y su porcentaje sin perder la
identificación completa de los conceptos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE REGLAS, API O POSTGRESQL.

---

## 2026-10-11 | Acción destacada para revisar evidencia (DEC-238)

**DECISIÓN**: El renglón final del historial de otras financieras se identifica como
`REVISAR EVIDENCIA`. Cuando existe al menos una fotografía confirmada que puede abrirse, el botón
usa el ocre oscuro del módulo de Verificación como fondo y borde, con el icono de cámara y el
conteo de fotografías en blanco. Sin fotografías disponibles no se simula una acción habilitada.

**MOTIVO**: Expresar claramente que el siguiente paso es revisar las fotografías y aumentar el
contraste de la acción disponible.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE DATOS, API O POSTGRESQL.

---

## 2026-10-11 | Calificación independiente de evidencia por integrante (DEC-239)

**DECISIÓN**: En el visor de evidencia de otra financiera, el verificador califica cada fotografía
confirmada con `TACHA` o `PALOMITA` para la integrante que está revisando. La decisión pertenece a
la relación evidencia–integrante: una misma fotografía compartida puede tener una calificación
distinta para cada integrante sin duplicar el archivo ni modificar su clasificación original
`VERDE / AMARILLO / ROJO` y su motivo.

La API exige `verificacion:registrar`, valida que la asociación esté activa y pertenezca al mismo
expediente y conserva usuario, fecha y auditoría de cada cambio. El legado permanece sin calificar.
Mobile sólo cambia la selección después de la confirmación del servidor; ante error conserva el
valor anterior. Los comprobantes procedentes de Documentación continúan sólo como consulta porque
no pertenecen a la relación de evidencias de Entrevista.

El botón `Cerrar` permanece habilitado y alineado en la misma barra inferior que la revisión. Salir
del visor no califica automáticamente imágenes pendientes ni modifica decisiones ya confirmadas.

**MOTIVO**: Permitir que el verificador emita una valoración precisa por imagen y por integrante,
incluso cuando la fotografía fue asociada a varias personas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 061.

---

## 2026-10-11 | Formato uniforme del visor sin color lateral (DEC-240)

**DECISIÓN**: Todas las páginas del visor de evidencia de otra financiera reservan exactamente la
misma banda superior de `64 px` y la misma banda inferior de controles de `72 px`, tengan o no una
clasificación. En fotografías clasificadas, el color del semáforo se muestra exclusivamente en esas
dos bandas; los laterales y el espacio libre alrededor de la imagen permanecen blancos. Las páginas
sin clasificación usan bandas blancas de las mismas dimensiones.

**MOTIVO**: Mantener idénticos el inicio, el final y el alto útil de cada fotografía al deslizar,
evitando que una evidencia clasificada parezca más corta o más alta que una neutral.

Esta decisión sustituye en DEC-210 únicamente el uso del semáforo para llenar el espacio libre
alrededor de la fotografía; conserva el visor blanco compartido, la etiqueta y la accesibilidad.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Calificación roja, amarilla o verde por evidencia (DEC-241)

**DECISIÓN**: La revisión independiente de cada fotografía por integrante incorpora una tercera
opción amarilla entre la tacha roja y la palomita verde. En reposo, las tres opciones usan un tono
claro con borde y símbolo más oscuros; la opción confirmada cambia a fondo sólido y conserva un
símbolo contrastante. La selección amarilla se persiste como `AMARILLO`, junto con los valores
vigentes `TACHA` y `PALOMITA`, y mantiene actor, fecha y auditoría.

Esta decisión amplía DEC-239 sin sustituir la clasificación original de la fotografía ni su motivo.
Cada valor continúa perteneciendo exclusivamente a la relación evidencia–integrante y mobile sólo
cambia la selección visible después de la confirmación del servidor.

**MOTIVO**: Permitir una valoración intermedia y hacer inequívoca la opción vigente al revisar
varias fotografías consecutivas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 062.

---

## 2026-10-11 | Indicador de revisión junto al acceso de fotografías (DEC-242)

**DECISIÓN**: En el renglón `REVISAR EVIDENCIA` de Conclusiones, el botón ocre de fotografías
reduce su proporción horizontal y se incorpora entre la etiqueta y la acción un círculo blanco de
`44 px`, con borde negro de dos puntos y signo de interrogación negro centrado. El círculo es un
indicador visual de sólo lectura; no crea una segunda acción y el renglón completo continúa abriendo
el mismo visor de evidencias.

**MOTIVO**: Separar visualmente la indicación de revisión del conteo de fotografías y conservar una
composición clara dentro del último renglón del historial externo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Zona táctil exclusiva del botón de fotografías (DEC-243)

**DECISIÓN**: En `REVISAR EVIDENCIA`, únicamente el rectángulo ocre con cámara y `N FOTO(S)` abre
el visor. La etiqueta, el círculo con signo de interrogación y el espacio restante del renglón son
elementos informativos y no reaccionan al toque. El botón conserva su rol, etiqueta accesible y
altura táctil institucional.

Esta decisión sustituye en DEC-242 únicamente la apertura desde el renglón completo; conserva su
composición, tamaños y colores.

**MOTIVO**: Hacer que la respuesta táctil coincida exactamente con el control que comunica la
acción y evitar aperturas accidentales al tocar información contigua.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-11 | Conteo semaforizado de fotografías revisadas (DEC-244)

**DECISIÓN**: En el renglón `REVISAR EVIDENCIA` de Conclusiones, la etiqueta se presenta arriba de
una cápsula alargada dividida en tres secciones iguales: verde claro a la izquierda, amarillo claro
al centro y rojo claro a la derecha. La cápsula usa una altura intermedia de `32 px` y números
con jerarquía de cuerpo reforzado para facilitar su lectura. Cada sección muestra cuántas fotografías de Entrevista fueron
calificadas respectivamente con `PALOMITA`, `AMARILLO` o `TACHA` para la integrante consultada.

Las fotografías sin calificación no se suman a ningún segmento. Las imágenes del comprobante
procedentes de Documentación permanecen incluidas en el total del botón de fotografías, pero no en
los conteos semaforizados porque no pertenecen a la relación calificable evidencia–integrante. La
cápsula es informativa; conserva como única acción táctil el botón ocre de fotografías definido en
DEC-243.

**MOTIVO**: Permitir conocer de un vistazo la distribución de la revisión individual sin abrir el
visor ni mezclar calificaciones de otras integrantes o fotografías que todavía no fueron valoradas.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-12 | Promedio de calificación de evidencias completas (DEC-245)

**DECISIÓN**: El círculo blanco del renglón `REVISAR EVIDENCIA` muestra un promedio de `0` a `100`
únicamente cuando todas las fotografías calificables de Entrevista asociadas a la integrante
consultada tienen una decisión. Cada fotografía verde aporta `100` puntos, cada amarilla `50` y
cada roja `0`; la suma se divide entre el número de fotografías calificables y el resultado se
redondea al entero más cercano para presentarlo en el círculo.

Si no existen fotografías calificables o al menos una continúa sin decisión, el círculo conserva
el signo de interrogación. Las imágenes del comprobante procedentes de Documentación no forman
parte del denominador porque no pertenecen a la relación calificable evidencia–integrante. El
promedio es informativo y no convierte el círculo en un botón.

**MOTIVO**: Resumir la calidad de la evidencia individual sólo cuando la revisión está completa,
sin presentar resultados parciales ni penalizar fotografías que no admiten esa calificación.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-12 | Semáforo parametrizable del promedio de fotografías (DEC-246)

**DECISIÓN**: Administración configura en `Parámetros > Verificación > Conclusiones` tres rangos
inclusivos e independientes, verde, amarillo y rojo, para calificar el promedio de fotografías en
una escala entera de `0` a `100`. Los rangos pueden ir en cualquier orden y dejar huecos, pero no
pueden traslaparse. La configuración inicial es rojo `0–33`, amarillo `34–66` y verde `67–100`.

Cuando el promedio definido en DEC-245 está completo, el círculo que contiene el número usa el
color del rango publicado. Mientras no existan fotografías calificables, falte calificar alguna o
no pueda confirmarse el parámetro, conserva el signo `?` o el número correspondiente en presentación
neutral; no se inventa una clasificación. El círculo sigue siendo informativo y no táctil.

**MOTIVO**: Permitir que Dirección ajuste la interpretación visual del promedio sin hardcodear una
política variable y sin comunicar resultados parciales como definitivos.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 063.

---

## 2026-10-12 | Accesos agrupados a fotografías en Conclusiones (DEC-247)

**DECISIÓN**: Antes de `Conclusiones del verificador`, el resumen incorpora un divisor ocre largo
`FOTOGRAFÍAS` y dos botones tipo cápsula: `Casa` y `Negocio`. `Casa` abre un solo visor con las
imágenes confirmadas de fachada, medidor de luz y fachada con la integrante, en ese orden y sólo
cuando cada una exista. `Negocio` abre todas las evidencias fotográficas confirmadas del negocio de
la integrante consultada.

Los dos accesos permanecen visibles y cada uno se deshabilita cuando su grupo no contiene imágenes
confirmadas. Las fotografías locales pendientes de envío no se presentan en Conclusiones ni se
cuentan como disponibles. Ambos visores son de consulta, conservan zoom y navegación horizontal y
no crean copias ni cambian las evidencias originales.

**MOTIVO**: Permitir que el verificador consulte rápidamente la evidencia física y comercial antes
de emitir sus conclusiones, manteniendo separados los dos contextos y la fuente de verdad vigente.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-12 | Formato principal para accesos de fotografías (DEC-248)

**DECISIÓN**: Los botones `Casa` y `Negocio` del bloque `FOTOGRAFÍAS` adoptan el mismo formato del
botón `Cerrar` del visor: fondo ocre sólido del módulo, texto blanco, forma rectangular con esquinas
redondeadas mediante `radius.md` y altura táctil principal. Ambos conservan el mismo ancho dentro
del renglón y mantienen su estado deshabilitado cuando no existen fotografías confirmadas.

Esta decisión sustituye en DEC-247 únicamente la presentación tipo cápsula; conserva la agrupación,
el contenido de cada visor y la exclusión de capturas pendientes.

**MOTIVO**: Unificar visualmente las acciones de consulta con el botón de cierre ya reconocido por
las usuarias y reducir la apariencia de selectores cuando en realidad son acciones.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-12 | Iconos de los accesos Casa y Negocio (DEC-249)

**DECISIÓN**: Los botones del bloque `FOTOGRAFÍAS` incorporan un icono blanco antes de su texto:
`Casa` usa una casa y `Negocio` un maletín. Ambos iconos usan el tamaño de acción institucional y
el mismo blanco del texto sobre el fondo ocre definido en DEC-248. El texto permanece visible; el
icono no lo sustituye ni constituye una acción independiente.

**MOTIVO**: Facilitar la identificación inmediata de cada grupo fotográfico sin depender únicamente
de la lectura, conservando una señal visual coherente y accesible.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-18 | Opciones múltiples parametrizadas en Visita al vecino (DEC-250)

**DECISIÓN**: Al tocar `Sí` o `No` en `¿La conoce? ¿Sabe dónde vive?`, mobile abre
automáticamente un pop-up de selección múltiple. Cada rama usa un catálogo independiente de M11:
`VISITA_VECINO_RESPUESTA_SI` o `VISITA_VECINO_RESPUESTA_NO`. Una respuesta nueva sólo puede
confirmarse con una o más opciones activas de la familia correspondiente y una ubicación actual
válida; respuesta, opciones y ubicación se guardan en la misma transacción.

Administración puede agregar, editar, ordenar, desactivar y reactivar las opciones desde
`Parámetros > Verificación > Visita al vecino`. Ambos catálogos comienzan vacíos: no se inventan
textos operativos. Si el catálogo requerido está vacío o no puede consultarse, el guardado se
bloquea y se informa que debe configurarse. Cada selección histórica conserva una instantánea de
etiqueta y orden; cambios posteriores del catálogo no alteran visitas confirmadas. Las visitas
anteriores a la migración 064 permanecen sin opciones inferidas.

**MOTIVO**: Permitir que Dirección defina las explicaciones reales de cada resultado y que campo
registre más de una circunstancia, sin hardcodear políticas variables ni reescribir historial.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 064.

---

## 2026-10-18 | Respuesta única en los dos pop-ups de Visita al vecino (DEC-251)

**DECISIÓN**: Los pop-ups que se abren después de responder `Sí` o `No` a `¿La conoce? ¿Sabe
dónde vive?` permiten seleccionar exactamente una opción de su catálogo. Si la persona usuaria
toca otra alternativa, la selección anterior se sustituye. `Guardar respuesta` continúa bloqueado
hasta elegir una opción y no admite confirmar dos o más.

La API conserva `opcion_ids` como arreglo compatible, pero exige cardinalidad exacta de uno y
rechaza cualquier envío con cero o más de una opción. La base protege el máximo de una relación por
visita mediante una restricción única. Se mantienen sin cambio los catálogos independientes de
`Sí` y `No`, su administración en M11, el guardado atómico con ubicación, las instantáneas de
etiqueta y orden y las visitas históricas sin explicaciones inferidas.

**MOTIVO**: Registrar una sola explicación inequívoca para cada respuesta de Visita al vecino y
evitar combinaciones ambiguas en campo.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 065. SUSTITUYE
ÚNICAMENTE LA MULTIPLICIDAD DE DEC-250.

---

## 2026-10-21 | Pasos obligatorios por tipo de integrante en Verificación (DEC-252)

**DECISIÓN**: M11 incorpora `Parámetros > Verificación > Pasos obligatorios` con una matriz de los
seis procesos `Documentos`, `Llamada`, `Visita al vecino`, `Imágenes del domicilio`, `Entrevista` y
`Conclusiones` para cuatro tipos calculados exclusivamente por la API: `NUEVA`,
`NUEVA_CON_EVIDENCIA`, `CICLO_2_MAS` y `CICLO_2_MAS_CON_EVIDENCIA`.

El historial con CRELEALTAD se deriva de créditos anteriores vinculados por `persona_id`; una
participación anterior convierte la solicitud actual en ciclo 2 o posterior. La evidencia externa
existe únicamente cuando la solicitud vigente conserva en servidor una ruta no local para
`doc_comprobante_credito_ruta`. No se infiere por respuestas de Entrevista ni por archivos todavía
pendientes de sincronización.

Los procesos pueden abrirse y realizarse en cualquier orden. Marcar un proceso como opcional no lo
oculta ni lo deshabilita: únicamente evita que bloquee el cierre formal cuando dicho cierre sea
aprobado e implementado. `Conclusiones` también es configurable. La API es la autoridad para
clasificar a la integrante y devolver la versión y las reglas aplicables; mobile sólo presenta ese
resultado.

Administración publica siempre la matriz completa, con control de revisión optimista, versión
inmutable, actor, fecha y auditoría. La configuración inicial conserva los seis procesos como
obligatorios para los cuatro tipos, de modo que la migración no relaja silenciosamente la operación.
La publicación no habilita el dictamen ni las transiciones finales todavía pendientes de M03.

**MOTIVO**: Permitir que Dirección ajuste la obligatoriedad del proceso a la situación crediticia
real de cada integrante sin hardcodear políticas, imponer una secuencia artificial ni confundir una
evidencia local con un comprobante confirmado por el servidor.

**ESTADO**: CERRADA E IMPLEMENTADA EN M11, MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 066; EL
BLOQUEO DEL CIERRE FORMAL QUEDA PREPARADO PARA LA FUTURA TRANSICIÓN APROBADA DE M03.

---

## 2026-10-21 | Obligatoriedad condicional por días en Verificación (DEC-253)

**DECISIÓN**: Cada regla de la matriz de DEC-252 admite tres modalidades: `OBLIGATORIO`,
`OPCIONAL` y `OBLIGATORIO_DESPUES_DIAS`. La tercera conserva un plazo entero configurable entre 1
y 3650 días para cada proceso y tipo de integrante. Mientras no venza el plazo desde la última
terminación confirmada del mismo proceso, el paso se considera opcional; al cumplirlo se vuelve
obligatorio. Sin terminación previa confirmada, la modalidad condicional es obligatoria.

La publicación continúa siendo completa, versionada, inmutable, optimista y auditada. Las versiones
anteriores se convierten sin pérdida a obligatorio u opcional. Esta parametrización no habilita por
sí misma el dictamen o la transición final pendiente de M03. `Conclusiones` no calcula todavía el
plazo porque carece de cierre persistido en servidor; no se usará una fecha local o inferida.

**MOTIVO**: Permitir que una revisión reciente siga disponible sin bloquear el cierre y exigirla
nuevamente cuando su antigüedad supere el plazo definido por Dirección.

**ESTADO**: CERRADA E IMPLEMENTADA EN CONFIGURACIÓN M11, MOBILE, API Y POSTGRESQL MEDIANTE
MIGRACIÓN 067; EL CONSUMO DEL VENCIMIENTO EN EL CIERRE FORMAL DE M03 CONTINÚA PENDIENTE.

---

## 2026-10-22 | Contacto del asesor en Verificación de Grupo (DEC-254)

**DECISIÓN**: La tarjeta superior de `Verificación de Grupo` comienza con un solo renglón que
presenta `ASESOR`, el nombre de la persona responsable del expediente y, al extremo derecho, su
teléfono celular dentro de una acción con icono que abre el marcador del dispositivo. El resumen de
integrantes aprobadas y monto total aprobado se presenta inmediatamente debajo.

Se eliminan por completo los cuatro indicadores secundarios `TOTAL`, `APROBADAS`, `PENDIENTES` y
`NO APROBADAS`. La API entrega únicamente el identificador, nombre y teléfono celular de la asesora
asignada; si no existe teléfono válido, la casilla permanece visible como no disponible y no simula
una llamada.

**MOTIVO**: Priorizar el contacto operativo inmediato con la asesora responsable y retirar un bloque
de conteos redundante que ocupaba espacio antes de la lista de integrantes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API. SIN CAMBIO DE POSTGRESQL NI REGLAS DE ESTADO.

---

## 2026-10-22 | Resumen solicitado y verificado de Verificación de Grupo (DEC-255)

**DECISIÓN**: El recuadro de resumen de `Verificación de Grupo` contiene dos renglones. El primero
presenta en azul la cantidad total de integrantes activas y la suma de sus montos solicitados. El
segundo presenta en el ocre del módulo la cantidad de integrantes cuya revisión ya concluyó y la
suma de sus montos verificados reales.

Una revisión concluida puede ser aprobada o rechazada; por ello el conteo verificado incluye ambos
resultados y excluye únicamente las pendientes. El monto verificado no se infiere del solicitado ni
del autorizado. Mientras no exista ninguna integrante verificada se muestra `$ 0`; si ya existe una
revisión concluida pero falta su importe persistido, el total muestra `—`. La interfaz queda lista
para consumir `monto_verificado` cuando se aprueben e implementen su captura, persistencia y contrato
de servidor.

**MOTIVO**: Distinguir de un vistazo lo pedido por el grupo de lo efectivamente determinado durante
la revisión, sin confundir conceptos financieros ni simular un dato que todavía no existe.

**ESTADO**: CERRADA E IMPLEMENTADA EN PRESENTACIÓN MOBILE. LA CAPTURA Y PERSISTENCIA DEL MONTO
VERIFICADO CONTINÚAN PENDIENTES DE SU CONTRATO FUNCIONAL.

---

## 2026-10-22 | Azul suave para el resumen solicitado de grupo (DEC-256)

**DECISIÓN**: El primer renglón del resumen de `Verificación de Grupo`, correspondiente a
integrantes activas y monto total solicitado, usa el mismo fondo celeste claro de la burbuja de
distancia respecto a la tesorera y conserva sus cifras en azul legible. El segundo renglón de
integrantes y monto verificados mantiene el ocre del módulo.

Esta decisión sustituye en DEC-255 únicamente la intensidad visual del renglón solicitado; no
modifica conteos, cálculos, estados ni fuentes de datos.

**MOTIVO**: Disminuir la intensidad del azul y mantener continuidad con una señal informativa ya
reconocible en las tarjetas de integrantes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-22 | Resumen grupal más compacto (DEC-257)

**DECISIÓN**: Los renglones solicitado y verificado del resumen de `Verificación de Grupo` reducen
su relleno vertical y eliminan la separación adicional entre la etiqueta y la cifra. Conservan la
tipografía de los valores, el celeste informativo del solicitado, el ocre del verificado y la
separación visual entre ambos conceptos.

**MOTIVO**: Mostrar la misma información ocupando menos altura antes de la lista de integrantes.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE. SIN CAMBIO DE API O POSTGRESQL.

---

## 2026-10-22 | Contacto compacto del asesor por abreviatura (DEC-258)

**DECISIÓN**: El renglón de contacto de `Verificación de Grupo` muestra `usuarios.abreviatura` en
lugar del nombre completo del asesor. La acción telefónica adopta una franja celeste compacta con el
número en azul oscuro reforzado, y un cuadro reducido del mismo fondo con el icono telefónico oscuro
al extremo derecho. Ambos segmentos forman una sola acción accesible de al menos 44 puntos que abre
el marcador y deja mayor ancho disponible para la abreviatura.

`GET /expedientes/:id` incorpora `asesora.abreviatura` junto con el resumen de contacto ya aprobado.
Si la cuenta no tiene abreviatura, mobile muestra `SIN ABREV.` sin inventar iniciales.

**MOTIVO**: Permitir que abreviatura, teléfono e icono permanezcan completos en un solo renglón y
alinear el contacto con el formato visual de datos telefónicos usado en las tarjetas individuales.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE Y API. SIN CAMBIO DE POSTGRESQL.

---

## 2026-10-22 | Integrantes verificadas requeridas para finalizar el grupo (DEC-259)

**DECISIÓN**: El primer acceso de `Parámetros > Verificación` permite que Administración publique
un número entero mayor que cero de integrantes verificadas requeridas. `Finalizar Verificación de
Grupo` se habilita cuando el conteo de revisiones individuales concluidas alcanza esa cantidad,
aunque otras integrantes continúen pendientes. Conforme a DEC-255, cuentan tanto las revisiones
aprobadas como las rechazadas y no cuentan las pendientes ni las integrantes retiradas.

La política se conserva en versiones inmutables con revisión optimista, actor, fecha y auditoría.
No se precarga una cantidad inicial: mientras Administración no publique el valor, o si la consulta
operativa falla, mobile bloquea el botón y explica la causa. Alcanzar el umbral habilita únicamente
el control visual; no simula éxito ni crea el dictamen, monto verificado o transición final de M03,
cuyos contratos funcionales continúan pendientes.

**MOTIVO**: Permitir que Dirección determine cuántas revisiones individuales necesita un grupo
antes de habilitar su cierre, sin hardcodear la cantidad, exigir que termine todo el grupo ni perder
trazabilidad de cambios.

**ESTADO**: CERRADA E IMPLEMENTADA EN M11, MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 068; LA
TRANSICIÓN FINAL DEL GRUPO CONTINÚA PENDIENTE.

---

## 2026-10-22 | Selector de integrantes verificadas de 0 a 12 (DEC-260)

**DECISIÓN**: El parámetro `Integrantes para finalizar` se captura mediante un selector desplazable
con todos los valores enteros de 0 a 12, donde 12 es el límite vigente del producto. El valor 0 es
válido y significa que no se exige ninguna revisión individual concluida para habilitar el botón;
los valores de 1 a 12 conservan el conteo aprobado en DEC-259.

Esta decisión sustituye en DEC-259 únicamente el rango anteriormente descrito como mayor que cero.
La ausencia de una publicación y los errores de consulta continúan bloqueando el botón. La
habilitación sigue siendo exclusivamente visual mientras permanezca pendiente el contrato de
dictamen y transición final de M03.

**MOTIVO**: Ajustar el control al límite real del producto, facilitar la captura en campo y permitir
expresamente una política sin mínimo de revisiones individuales.

**ESTADO**: CERRADA E IMPLEMENTADA EN M11, MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 069; LA
TRANSICIÓN FINAL DEL GRUPO CONTINÚA PENDIENTE.

---

## 2026-10-30 | Control de pagos CRELEALTAD obligatorio desde ciclo individual 2 (DEC-261)

**DECISIÓN**: El Paso 7 de Documentación incorpora `Control de pagos CRELEALTAD` como documento
independiente. Se presenta en la primera posición y es obligatorio únicamente cuando la integrante
tiene al menos una participación individual previa confirmada con CRELEALTAD, es decir, desde su
ciclo individual 2. La clasificación se deriva en la API por `persona_id`; no se usa el ciclo del
grupo ni se infiere historial cuando la fuente es indeterminada.

El documento contiene exactamente dos imágenes. Mobile permite obtener ambas desde la cámara o
seleccionarlas del carrete, y la API rechaza cualquier versión con una cantidad distinta de dos.
Sólo una versión confirmada y existente en servidor completa este requisito. Las integrantes nuevas
conservan los tres documentos obligatorios anteriores.

`Control de pagos CRELEALTAD` no sustituye ni modifica `Comprobante Línea de Crédito`: este último
continúa siendo la evidencia opcional de otra financiera y admite todas las fotografías necesarias
conforme a DEC-172.

**MOTIVO**: Incorporar la evidencia interna que corresponde a renovaciones sin mezclarla con el
historial de otras financieras ni exigirla a una integrante que participa por primera vez dentro de
un grupo con ciclos anteriores.

**ESTADO**: CERRADA E IMPLEMENTADA EN MOBILE, API Y POSTGRESQL MEDIANTE MIGRACIÓN 070.

---

## 2026-10-30 | Composición responsive para formularios y revisión documental (DEC-263)

**DECISIÓN**: Los formularios largos y flujos por pasos de la aplicación web para computadora usan
dos columnas como composición predeterminada. La columna izquierda mantiene visibles los siete
pasos, identifica el paso activo y distingue los concluidos; la columna derecha concentra el
formulario del paso actual, su progreso, autoguardado, validaciones y acciones de navegación.

La aplicación móvil conserva sus pantallas actuales de una sola columna y no adopta la composición
de escritorio comprimida. El modal centrado queda reservado para tareas breves y contenidas. La
presentación inmersiva se utiliza únicamente cuando la tarea principal sea revisar documentos o
imágenes en grande, con el visor institucional aprobado en DEC-262; no se emplea como contenedor
general para formularios.

Esta regla define la composición responsive, pero no cambia permisos, validaciones, reglas de
negocio, secuencia de pasos ni contratos de guardado.

**MOTIVO**: Hacer la captura de escritorio más ágil e intuitiva al mantener el contexto del flujo
visible, reducir regresos y evitar que la navegación compita con el formulario. Al mismo tiempo se
conserva la experiencia móvil diseñada para teléfono y se reserva el máximo espacio visual para la
revisión documental que realmente lo necesita.

**ESTADO**: CERRADA E IMPLEMENTADA EN EXPO WEB PARA EL FLUJO ACTIVO DE SOLICITUD. MOBILE CONSERVA
SU COMPOSICIÓN DE UNA COLUMNA. SIN CAMBIO DE API O POSTGRESQL.

---

**Última actualización**: 2026-10-30
**Responsable**: Ricardo Elizondo (ricardoelizondo8078@gmail.com)
