# 09 State Machine — Máquinas de Estado Oficiales

Versión: 2.0.0
Estado: Vigente y auditada
Fecha de auditoría: 2026-10-04

## Alcance y autoridad

- Los nombres funcionales de este documento reproducen el contrato de
  `01_PROJECT_CONSTITUTION.md`; no son etiquetas propuestas por el código.
- PostgreSQL define el vocabulario técnico actualmente admitido, no la semántica funcional futura.
- Una correspondencia funcional–técnica sólo es válida cuando está aprobada. Grupo y Expediente
  todavía no cuentan con una correspondencia completa y no deben recibir un `CHECK` inferido.
- Los estados finales se derivan mediante reglas y eventos; la usuaria no los elige arbitrariamente.

## Catálogos funcionales oficiales

| Entidad | Estados funcionales oficiales |
|---|---|
| Persona | Activa, Inactiva, Bloqueada, Depurada lógica |
| Usuario | Activo, Inactivo, Suspendido, Bloqueado |
| Rol | Activo, Inactivo |
| Producto | Activo, Inactivo, Suspendido |
| Grupo | Propuesto, En documentación, En evaluación, Activo, En renovación, Cerrado |
| Expediente | En documentación, Con observaciones, Listo para verificar, En verificación, Verificado, En análisis, Autorizado, Esperando 80 %, Listo para desembolso, Desembolsado, Cancelado, Rechazado |
| Solicitante | Pendiente, Completa, Retirada, Rechazada |
| Solicitud | No iniciada, En captura, Incompleta, Capturada, Observada, Reemplazada, Cerrada |
| Documento | Pendiente, Capturado, Observado, Aceptado, Reemplazado, Vencido |
| Crédito | Borrador, Preparado para desembolso, Desembolsado, Vigente, Vencido, Liquidado, Reestructurado, Cancelado |
| Ciclo | Planeado, Activo, En cierre, Cerrado |
| Desembolso | Pendiente, Programado, Ejecutado, Cancelado, Reversado |
| Pago | Pendiente, Aplicado, Parcial, Vencido, Reversado |

## Transiciones funcionales principales

### Grupo

- Propuesto → En documentación → En evaluación → Activo.
- Activo → En renovación → Activo.
- Activo → Cerrado.

La precisión de RN-007 continúa abierta: hoy existe una identidad operativa de grupo antes del
desembolso, mientras que crédito y ciclo financiero sólo nacen con el desembolso real.

### Expediente

- En documentación → Listo para verificar | Con observaciones | Cancelado.
- Con observaciones → En documentación | Cancelado.
- Listo para verificar → En verificación.
- En verificación → Verificado | Con observaciones | Rechazado.
- Verificado → En análisis.
- En análisis → Autorizado | Rechazado.
- Autorizado → Esperando 80 % | Listo para desembolso.
- Esperando 80 % → Listo para desembolso.
- Listo para desembolso → Desembolsado.

### Solicitante

- Pendiente → Completa | Retirada | Rechazada.
- Completa → Pendiente cuando aparece una observación o vencimiento.
- Completa → Retirada antes del handoff o → Rechazada por dictamen posterior.
- Retirada → Pendiente | Completa mediante reintegro formal y recálculo.

### Documento

- Pendiente → Capturado.
- Capturado → Observado | Aceptado.
- Observado → Capturado | Reemplazado.
- Aceptado → Vencido | Reemplazado.

Las transiciones detalladas de Solicitud, Crédito, Ciclo, Desembolso y Pago requieren el caso de uso
que materialice el evento y su auditoría; el catálogo no autoriza mutaciones directas.

## Correspondencia técnica verificada

| Concepto | Implementación vigente | Estado de correspondencia |
|---|---|---|
| Rol | `ACTIVO`, `INACTIVO` | Cerrada y protegida por `ck_roles_estado` |
| Usuario | `ACTIVO`, `INACTIVO`, `SUSPENDIDO`, `BLOQUEADO` | Cerrada y protegida por `ck_usuarios_estado` |
| Persona | `ACTIVA`, `INACTIVA`, `BLOQUEADA`, `DEPURADA_LOGICA` | Cerrada y protegida por `ck_personas_estado` |
| Producto | `ACTIVO`, `INACTIVO`, `SUSPENDIDO` | Cerrada y protegida por `ck_productos_credito_estado` |
| Crédito | `BORRADOR`, `PREPARADO_DESEMBOLSO`, `DESEMBOLSADO`, `VIGENTE`, `VENCIDO`, `LIQUIDADO`, `REESTRUCTURADO`, `CANCELADO` | Cerrada y protegida por `ck_creditos_estado` |
| Ciclo | `PLANEADO`, `ACTIVO`, `EN_CIERRE`, `CERRADO` | Cerrada y protegida por `ck_ciclos_estado` |
| Pago | `PENDIENTE`, `APLICADO`, `PARCIAL`, `VENCIDO`, `REVERSADO` | Cerrada y protegida por `ck_pagos_estado` |
| Grupo | Enum PostgreSQL: `FORMANDO`, `LISTO_PARA_REVISION`, `EN_REVISION`, `AUTORIZADO`; TypeORM además declara valores posteriores no presentes en el enum SQL | Abierta; no hay equivalencia uno a uno aprobada |
| Expediente | Código: `EN_DOCUMENTACION`, `EN_VERIFICACION`, `COMPLETO`, `EN_REVISION`, `AUTORIZADO`, `RECHAZADO`, `DESEMBOLSADO`; la base también conserva `En proceso` legacy | Abierta; sin restricción nueva |
| Solicitante / integrante | `DOCUMENTANDO`, `SUJETA_CREDITO`, `EN_VERIFICACION`, `AUTORIZADA`, `RECHAZADA`, `RETIRADA` | Parcial; `SUJETA_CREDITO` materializa hoy la completitud técnica, pero no renombra `Completa` |
| Solicitud | Sin columna de estado; completitud derivada de core, siete hijas y evidencias | Pendiente de materialización aprobada |
| Documento | Sin entidad única con el catálogo funcional completo; mobile usa estados de transporte y servidor confirma archivos/versiones | Parcial; transporte no equivale a estado documental oficial |

La auditoría de PostgreSQL del 2026-10-04 encontró 64 grupos `FORMANDO`, 493 `AUTORIZADO`; 568
expedientes `En proceso`, 19 `EN_DOCUMENTACION`, 2 `EN_VERIFICACION` y 276 `DESEMBOLSADO`. Estos
conteos son evidencia técnica agregada, no una homologación funcional ni una autorización para
reescribir historia.

## Procesos sin máquina final implementada

- Verificación tiene cuatro procesos persistentes parciales, pero carece de dictamen general. Las
  salidas objetivo son Verificado, Con observaciones y Rechazado.
- Renovación puede preparar el expediente siguiente, pero no tiene motor parametrizado que determine
  No elegible, Esperando umbral o Elegible.
- Cobranza, Mora y Convenios tienen tablas parciales, pero no una máquina operativa aprobada de
  extremo a extremo.

## Reglas de consistencia transversal

1. No existe expediente Desembolsado sin desembolso Ejecutado.
2. No existe solicitante Completa sin solicitud digital capturada.
3. No existe solicitante Completa con documento obligatorio Pendiente, Observado o Vencido.
4. No existe renovación elegible sin cumplir el umbral configurado.
5. No existe expediente Listo para verificar con pendientes obligatorios críticos ni sin una
   tesorera participante completa.
6. Sustituir a la tesorera durante Desembolso no retrocede el expediente a Verificación: el evento
   se audita y la persona definitiva se registra en el ciclo desembolsado.

## Referencias cruzadas

- `project/01_PROJECT_CONSTITUTION.md`
- `project/05_BUSINESS_RULES.md`
- `project/07_OPERATION_FLOW.md`
- `project/08_ENTITY_CATALOG.md`
- `project/10_DATABASE_PRINCIPLES.md`
- `project/12_SECURITY_MODEL.md`
