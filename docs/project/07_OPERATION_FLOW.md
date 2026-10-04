# 04 Operation Flow - Flujo Operativo Completo

Version: 1.1.0
Estado: Vigente
Fecha de verificacion: 2026-09-21

## Flujo macro del credito grupal

1. Entrada a Documentacion.
2. Alta de grupo con expediente atomico, o inicio de renovacion idempotente.
3. Apertura del expediente mas reciente asignado al usuario.
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
- Archivos confirmados por el almacenamiento del servidor.

Reglas:
- Si falta solicitud digital obligatoria: Pendiente.
- Si falta documento obligatorio, manifiesto o archivo confirmado: Pendiente.
- Si cumple requisitos: Completa.
- Si se retira por evento autorizado: Retirada.
- Si dictamen negativo: Rechazada.

## Flujo de expediente a verificacion

Precondiciones:
- Al menos una participante completa mientras el minimo parametrizado siga pendiente de M11.
- Sin integrantes activas con captura obligatoria pendiente; las retiradas formales no bloquean.
- Tesorera seleccionada entre participantes completas.

Resultado:
- Estado cambia a En verificacion.
- Se registra handoff, conteos, tesorera, actor y trazabilidad en la misma transaccion.

## Flujo de autorizacion de acceso

1. JWT identifica usuario y rol.
2. El guard valida modulo y accion.
3. Para `ASESOR`, el servicio valida que el expediente pertenezca al empleado vinculado al usuario.
4. Solo despues se permite leer o modificar grupo, expediente, integrante, solicitud o documento.

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
