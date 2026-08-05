# CLAUDE.md - CRELEALTAD CORE

Documentación permanente del proyecto para Claude Code y futuras sesiones.

---

## MODELO DE DATOS Y REGLAS INVARIANTES

### PERSONAS
Identidad permanente con folio inmutable.
El campo monto_solicitado es PROSPECCION (lo que la clienta pretende en el primer acercamiento).
Este monto se sobrescribe y NO es el monto formal.
El monto formal vive en solicitudes.

### SOLICITUDES
Estructura normalizada en 8 tablas:
- solicitudes (core): 13 columnas con FKs e integrante_id, persona_id, expediente_id, grupo_id
- solicitudes_datos_personales: 17 columnas
- solicitudes_domicilios: 14 columnas
- solicitudes_negocios: 18 columnas
- solicitudes_referencias: 15 columnas
- solicitudes_beneficiarios: 8 columnas
- solicitudes_validaciones: 7 columnas
- solicitudes_documentos: 12 columnas

Todas las tablas hijas usan upsert por solicitud_id.
La vista solicitudes_completo une las 8 tablas con LEFT JOIN.

### FUENTE DE VERDAD
La fuente de verdad de los nombres de campo es la COLUMNA EN POSTGRESQL.
DTO, service, frontend y cualquier mapeo se alinean a la base, NUNCA al revés.

### REGLA DE NOMENCLATURA (CRÍTICA)
TODOS los DTOs, entities y campos de API usan los nombres EXACTOS de las columnas PostgreSQL.
- PROHIBIDO inglés (name, email, password son excepciones legacy de auth).
- PROHIBIDO camelCase en capa de datos (createdBy, advisorName, etc).
- OBLIGATORIO español y snake_case siguiendo la base: nombre, tesorera_id, ciclo_numero.
- Antes de crear un DTO, verificar las columnas reales con information_schema.
- Cualquier desalineación DTO-base debe corregirse en el DTO, no en la base.

### DTO
CreateSolicitudDto tiene 91 campos:
- 4 requeridos: integrante_id, persona_id, expediente_id, grupo_id
- 87 opcionales (de las 7 tablas hijas)
Sin firma de índice [key: string].
ValidationPipe global con whitelist: true y forbidNonWhitelisted: true.

### CAMPOS QUE NUNCA VIENEN DEL FRONTEND
numero_credito y credito_id SOLO los escribe el backend en el desembolso real.
NUNCA llegan del frontend.

### CICLOS
Un ciclo nace ÚNICAMENTE al desembolso real.
NO se crean ciclos hasta que hay un crédito activo.

### HISTÓRICO DE CRECIMIENTO DE LÍNEA
Se reconstruye por persona_id + numero_credito.
Constraint UNIQUE en creditos_historico (persona_id, numero_credito).

### POLÍTICA DE BORRADO
solicitudes tiene 5 FK con ON DELETE RESTRICT.
En CRELEALTAD NO SE BORRA INFORMACIÓN.
Todos los registros son inmutables desde el punto de vista operativo.

### ESTADOS DE INTEGRANTES
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
- Paso 7: 4 documentos (doc_ine_ruta, doc_comprobante_ruta, doc_ine_beneficiario_ruta, doc_solicitud_firmada_ruta)

El backend rechaza con 400 y devuelve pasosIncompletos y camposFaltantes si falta algo.

---

## FORMATO DE TRABAJO

### REPORTES
Texto plano únicamente.
Máximo 20 líneas por sección.
Sin tablas ASCII ni cajas de caracteres.

### COMMITS
Hacer commit antes de cada tarea.
Commits atómicos con mensajes descriptivos.
Nunca juntar múltiples tareas en un solo commit.

### TESTS
Correr npm test antes de cerrar cualquier sesión.
Verificar que todos los tests pasan.
Agregar tests para cada nueva funcionalidad.

---

## ARQUITECTURA

### BACKEND
NestJS con TypeORM.
PostgreSQL como base de datos.
Todas las entidades con snake_case en BD.
ValidationPipe global activo.

### FRONTEND
React Native (apps/mobile).
Axios para requests HTTP.
Estado local con hooks.

### ESTRUCTURA DE DIRECTORIOS
apps/api - Backend NestJS
apps/mobile - Frontend React Native
database/ - Migraciones SQL
MIGRACION_COMPLETA/ - Scripts legacy de migración inicial

---

## CONTACTO Y CONTEXTO

Usuario: ricardoelizondo8078@gmail.com
Proyecto: Sistema de créditos grupales CRELEALTAD
Stack: NestJS + PostgreSQL + React Native
