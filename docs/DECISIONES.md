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

**Última actualización**: 2026-08-06
**Responsable**: Ricardo Elizondo (ricardoelizondo8078@gmail.com)
