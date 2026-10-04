# 09 State Machine - Máquinas de Estado Oficiales

Versión: 1.4.0
Estado: Vigente y auditada
Fecha de auditoría: 2026-10-04

## Alcance

- Esta guia define estados funcionales oficiales, no defaults tecnicos de implementacion.
- Los estados técnicos del esquema no reemplazan esta semántica funcional.
- La cobertura en código y PostgreSQL es parcial y no debe interpretarse como contrato oficial completo.

## Grupo

Estados: Prospecto, En integracion, Elegible, Activo, En renovacion, Cerrado.
Transiciones validas:
- Prospecto -> En integracion
- En integracion -> Elegible
- Elegible -> Activo
- Activo -> En renovacion
- En renovacion -> Activo
- Activo -> Cerrado

## Expediente

Estados: En documentacion, Con observaciones, Listo para verificar, En verificacion, Verificado, En analisis, Autorizado, Esperando 80%, Listo para desembolso, Desembolsado, Cancelado, Rechazado.
Transiciones clave:
- En documentacion -> Listo para verificar
- En documentacion -> Con observaciones
- Con observaciones -> En documentacion
- Listo para verificar -> En verificacion
- En verificacion -> Verificado | Con observaciones | Rechazado
- Verificado -> En analisis
- En analisis -> Autorizado | Rechazado
- Autorizado -> Esperando 80% | Listo para desembolso
- Esperando 80% -> Listo para desembolso
- Listo para desembolso -> Desembolsado

## Solicitante

Estados: Pendiente, Completa, Retirada, Rechazada.
Transiciones:
- Pendiente -> Completa
- Completa -> Pendiente (si aparece observacion o vencimiento)
- Pendiente -> Retirada
- Completa -> Retirada (confirmación de no participación antes del handoff)
- Retirada -> Pendiente | Completa (reintegro formal con recálculo)
- Pendiente -> Rechazada
- Completa -> Rechazada (dictamen posterior)

## Solicitud

Estados: No iniciada, En captura, Capturada, Observada, Corregida, Cancelada.

## Documento

Estados: Pendiente, Capturado, Observado, Aceptado, Reemplazado, Vencido.
Transiciones:
- Pendiente -> Capturado
- Capturado -> Observado | Aceptado
- Observado -> Reemplazado | Capturado
- Aceptado -> Vencido

## Verificacion

Estados: Cola de revision, En revision, Aprobado, Observado, Rechazado.

## Desembolso

Estados: Pendiente, Programado, Ejecutado, Cancelado, Reversado.

## Cobranza

Estados: Vigente, Seguimiento, Riesgo, Mora, Regularizado, Liquidado.

## Renovacion

Estados: No elegible, En preparacion, Esperando umbral, Elegible, En ejecucion, Concluida.

## Reglas de consistencia transversal

1. No existe expediente Desembolsado sin desembolso Ejecutado.
2. No existe solicitante Completa sin solicitud digital capturada.
3. No existe solicitante Completa con documento obligatorio Pendiente, Observado o Vencido.
4. No existe renovacion Elegible sin cumplir umbral configurado.
5. No existe expediente Listo para verificar con pendientes obligatorios criticos ni sin una tesorera participante seleccionada.
6. Sustituir a la tesorera durante Desembolso no retrocede el expediente a Verificacion: el evento se audita y la persona definitiva se registra en el ciclo desembolsado.

## Cobertura verificada en implementacion actual

- API: `send-to-verification` materializa el handoff parcial; retiro, reintegro y selección de tesorera están controlados mientras el expediente permanece en documentación. El resto de la máquina continúa parcial.
- Mobile: el flujo documental navega estados operativos, pero no modela el catalogo completo de transiciones.
- SQL: `integrantes.estado` y `grupos.estado` ya usan tipos controlados. La migración 036 agrega `CHECK` para los catálogos cerrados de rol (`ACTIVO`, `INACTIVO`), usuario (`ACTIVO`, `INACTIVO`, `SUSPENDIDO`, `BLOQUEADO`), persona (`ACTIVA`, `INACTIVA`, `BLOQUEADA`, `DEPURADA_LOGICA`), producto (`ACTIVO`, `INACTIVO`, `SUSPENDIDO`), crédito (`BORRADOR`, `PREPARADO_DESEMBOLSO`, `DESEMBOLSADO`, `VIGENTE`, `VENCIDO`, `LIQUIDADO`, `REESTRUCTURADO`, `CANCELADO`), ciclo (`PLANEADO`, `ACTIVO`, `EN_CIERRE`, `CERRADO`) y pago (`PENDIENTE`, `APLICADO`, `PARCIAL`, `VENCIDO`, `REVERSADO`).
- SQL: los defaults nuevos de crédito y pago son `BORRADOR` y `PENDIENTE`. El estado final continúa derivándose mediante reglas y eventos; el `CHECK` sólo impide vocabulario inválido.

## Contradicciones documentadas sin cambio de regla

- Los servicios actuales usan estados y validaciones parciales de prototipo.
- La correspondencia de estados de grupo y expediente con el contrato funcional aún presenta valores legacy; por eso la migración 036 no amplía ni reemplaza sus catálogos.
- Los estados de mora, reestructura/convenio y las validaciones `SI/NO` de solicitud permanecen sin una restricción nueva hasta cerrar su contrato exacto.

## Referencias cruzadas

- project/05_BUSINESS_RULES.md
- project/07_OPERATION_FLOW.md
- project/08_ENTITY_CATALOG.md
- project/12_SECURITY_MODEL.md
