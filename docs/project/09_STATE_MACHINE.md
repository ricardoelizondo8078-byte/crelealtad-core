# 06 State Machine - Maquinas de Estado Oficiales

Version: 1.1.0
Estado: Vigente y auditada
Fecha de auditoria: 2026-07-10

## Alcance

- Esta guia define estados funcionales oficiales, no defaults tecnicos de implementacion.
- El campo status actual del schema SQL usa valores tecnicos de arranque y no reemplaza esta semantica.
- La cobertura en codigo es parcial y no debe interpretarse como contrato oficial completo.

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
5. No existe expediente Listo para verificar con pendientes obligatorios criticos.

## Cobertura verificada en implementacion actual

- API: existe accion send-to-verification, pero no se verifico enforcement integral de toda la maquina de estados.
- Mobile: el flujo documental navega estados operativos, pero no modela el catalogo completo de transiciones.
- SQL: no existen constraints verificadas que materialicen esta semantica funcional.

## Contradicciones documentadas sin cambio de regla

- Los servicios actuales usan estados y validaciones parciales de prototipo.
- Los defaults SQL como draft, active y pending son tecnicos y no equivalen a los estados funcionales oficiales.

## Referencias cruzadas

- project/05_BUSINESS_RULES.md
- project/07_OPERATION_FLOW.md
- project/08_ENTITY_CATALOG.md
- project/12_SECURITY_MODEL.md
