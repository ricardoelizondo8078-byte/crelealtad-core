# 04 Operation Flow - Flujo Operativo Completo

Version: 1.0.0
Estado: Vigente

## Flujo macro del credito grupal

1. Entrada a Documentacion.
2. Alta de grupo o inicio de renovacion.
3. Apertura de expediente.
4. Integracion de solicitantes.
5. Captura de solicitud individual.
6. Captura y validacion documental.
7. Calculo automatico de completitud.
8. Envio a verificacion.
9. Dictamen.
10. Analisis y autorizacion.
11. Validacion de refinanciamiento cuando aplique.
12. Desembolso.
13. Conservacion historica para seguimiento.

## Flujo de decision de completitud de solicitante

Entradas:
- Solicitud digital.
- Documentos obligatorios.
- Excepciones autorizadas.

Reglas:
- Si falta solicitud digital obligatoria: Pendiente.
- Si falta documento obligatorio: Pendiente.
- Si cumple requisitos: Completa.
- Si se retira por evento autorizado: Retirada.
- Si dictamen negativo: Rechazada.

## Flujo de expediente a verificacion

Precondiciones:
- Minimo de completas alcanzado.
- Sin bloqueantes obligatorios.

Resultado:
- Estado cambia a En verificacion.
- Se registra handoff y trazabilidad.

## Flujo de verificacion

Salidas:
- Verificado.
- Con observaciones.
- Rechazado.

## Flujo de autorizacion y desembolso

- Expediente verificado pasa a analisis.
- Si autorizado y cumple condiciones, pasa a listo para desembolso.
- Se registra desembolso.
- Expediente conserva historial.

## Puntos de control

- Control de identidad.
- Control documental.
- Control de estado.
- Control de refinanciamiento.
- Control de auditoria.

## Referencias cruzadas

- project/06_OPERATION_MANUAL.md
- project/08_ENTITY_CATALOG.md
- project/09_STATE_MACHINE.md
