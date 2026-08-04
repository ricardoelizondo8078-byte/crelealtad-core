# 05 Entity Catalog - Catalogo Integral de Entidades

Version: 1.1.0
Estado: Vigente y auditado
Fecha de auditoria: 2026-07-10
Fuente: database/schema/init.sql + database/migrations/001_initial_schema.sql + apps/api/src + apps/mobile/src + docs/architecture/DOMAIN_MODEL.md

## Criterio de lectura

- Este catalogo separa entidad oficial de negocio, presencia en schema y cobertura observada en codigo.
- No toda entidad oficial tiene persistencia completa en el repositorio actual.
- No todo status tecnico del schema equivale a un estado funcional de negocio.

## 1. Persona

Objetivo: identidad maestra.
Presencia verificada: schema SQL.
Campos base: id, status, created_at, updated_at, deleted_at, created_by, updated_by.
Llaves: PK id.
Relaciones: 1:N usuarios, 1:N solicitantes, 1:N documentos.

## 2. Usuario

Objetivo: cuenta operativa.
Presencia verificada: schema SQL.
Campos base: id, persona_id, status, auditoria.
Llaves: PK id, FK persona_id.
Relaciones: N:M roles.

## 3. Rol

Objetivo: perfil de acceso.
Presencia verificada: schema SQL.
Campos base: id, name, status.
Llaves: PK id.
Relaciones: N:M usuarios.

## 4. Parametro

Objetivo: configuracion operativa.
Presencia verificada: schema SQL.
Campos base: id, key_name, value_text, status.
Llaves: PK id.
Relaciones: 1:N reglas.

## 5. Regla

Objetivo: politica evaluable.
Presencia verificada: schema SQL.
Campos base: id, parametro_id, name, status.
Llaves: PK id, FK parametro_id.

## 6. Producto

Objetivo: oferta financiera.
Presencia verificada: schema SQL.
Campos base: id, name, status.
Relaciones: 1:N creditos.

## 7. Expediente

Objetivo: contenedor operativo pre y post desembolso.
Presencia verificada: schema SQL, API y mobile.
Campos schema: id, status, auditoria.
Campos codigo observados: groupId, title, status, createdAt, updatedAt.
Llaves: PK id.
Relaciones: 1:N solicitantes, 1:N documentos, 0:1 grupo.
Estados oficiales: En documentacion, Con observaciones, Listo para verificar, En verificacion, Verificado, En analisis, Autorizado, Esperando 80%, Listo para desembolso, Desembolsado, Cancelado, Rechazado.
Observacion: la persistencia oficial aun no esta materializada en servicios.

## 8. Solicitante

Objetivo: participante del expediente.
Presencia verificada: schema SQL, API y mobile.
Campos schema: id, persona_id, expediente_id, status, auditoria.
Campos codigo observados: nombre, telefono, montoSolicitado.
Estados oficiales: Pendiente, Completa, Retirada, Rechazada.
Relaciones: N:1 expediente, 1:N documentos, 1:N solicitudes.

## 9. Solicitud

Objetivo: captura estructurada individual.
Presencia verificada: API y mobile.
Persistencia SQL: no verificada en schema actual.
Campos codigo observados: id, solicitanteId, nombreCompleto, fechaNacimiento, curp, domicilio, beneficiarioNombre, beneficiarioTelefono, referencia1Nombre, referencia1Telefono, referencia2Nombre, referencia2Telefono, createdAt, updatedAt.
Observacion: entidad oficial vigente con brecha de persistencia abierta.

## 10. Documento

Objetivo: evidencia asociada.
Presencia verificada: schema SQL, API y mobile.
Campos schema: id, solicitante_id, persona_id, expediente_id, grupo_id, credito_id, status, auditoria.
Campos codigo observados: clave, nombre, requerido, estado, updatedAt.
Estados oficiales: Pendiente, Capturado, Observado, Aceptado, Reemplazado, Vencido.
Observacion: el schema define relacion multipolivalente; la UI actual materializa un subconjunto funcional.

## 11. Grupo

Objetivo: estructura solidaria.
Presencia verificada: schema SQL, API y mobile.
Campos schema: id, expediente_id, status, auditoria.
Campos codigo observados: name, advisorName, createdBy.
Relaciones: 1:N ciclos, 1:N creditos, 0:N documentos.

## 12. Ciclo

Objetivo: ciclo comercial del grupo.
Presencia verificada: schema SQL.
Campos base: id, grupo_id, status, auditoria.
Relaciones: N:1 grupo.
Observacion: no se verificaron servicios ni pantallas dedicadas en el estado actual del repo.

## 13. Credito

Objetivo: obligacion financiera.
Presencia verificada: schema SQL.
Campos base: id, grupo_id, producto_id, status, auditoria.
Relaciones: 1:N pagos, 1:N desembolsos, 1:N documentos.

## 14. Desembolso

Objetivo: evento de entrega del credito.
Presencia verificada: schema SQL.
Campos base: id, credito_id, status, auditoria.
Estados oficiales documentados: Pendiente, Programado, Ejecutado, Cancelado, Reversado.

## 15. Pago

Objetivo: evento de cobranza.
Presencia verificada: schema SQL.
Campos base: id, credito_id, status, auditoria.
Estados oficiales documentados: Pendiente, Parcial, Aplicado, Vencido, Reversado.

## Entidades no verificadas como tabla dedicada

- Verificacion: existe como flujo y estado, no como tabla dedicada verificada en schema actual.
- Renovacion: existe como proceso de negocio y maquina de estados, no como tabla dedicada verificada en schema actual.
- Observacion de revision: no se verifico tabla dedicada en schema actual.

## Observaciones de consistencia

- Existe desalineacion temporal entre schema y servicios in-memory.
- El schema conserva auditoria completa que aun no existe en DTOs y entidades de prototipo.
- La autoridad de negocio permanece en este catalogo y en la maquina de estados, no en los defaults tecnicos de SQL.

## Referencias cruzadas

- project/05_BUSINESS_RULES.md
- project/09_STATE_MACHINE.md
- project/10_DATABASE_PRINCIPLES.md
- project/90_ARCHITECT_REVIEW.md
