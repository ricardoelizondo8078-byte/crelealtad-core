# 07 Operation Flow — Flujo Operativo Completo

Versión: 1.3.0
Estado: Vigente
Fecha de verificación: 2026-10-04

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

Cobertura al corte:

- Pasos 1 a 7: parciales con persistencia real en M02.
- Paso 8: implementado como handoff técnico transaccional, con mínimo temporal no parametrizado.
- Paso 9: parcial; existen cuatro procesos y evidencias, pero no dictamen general.
- Pasos 10 a 12: contrato objetivo, sin módulos ejecutables verificados.
- Paso 13: parcial; existe historia transaccional e importada, pero la auditoría transversal y el
  historial individual legacy siguen incompletos.

## Flujo de decision de completitud de solicitante

Entradas:
- Solicitud digital.
- Documentos obligatorios.
- Excepciones autorizadas.
- Archivos confirmados por el almacenamiento del servidor.

Reglas:
- Si falta solicitud digital obligatoria: Pendiente.
- Si falta documento obligatorio, manifiesto o archivo confirmado: Pendiente.
- Si cumple requisitos: Completa. El estado técnico vigente de `integrantes` es
  `SUJETA_CREDITO`; no constituye el nombre funcional oficial.
- Si se retira por evento autorizado: Retirada.
- Si dictamen negativo: Rechazada.

## Flujo de expediente a verificacion

Precondiciones:
- Al menos una participante completa como condición técnica temporal mientras el mínimo oficial
  parametrizado siga pendiente de M11.
- Sin integrantes activas con captura obligatoria pendiente; las retiradas formales no bloquean.
- Tesorera seleccionada entre participantes completas.

Resultado:
- Estado cambia a En verificacion.
- Se registra handoff, conteos, tesorera, actor y trazabilidad en la misma transaccion.

## Flujo de captura con conectividad variable

1. Solicitud y Entrevista conservan primero un borrador local separado por usuario y entidad.
2. La cola intenta confirmar el cambio con la versión del servidor que originó el borrador.
3. Un fallo transitorio permanece pendiente y se reintenta con espera creciente; cerrar la app no
   elimina la operación ni los archivos copiados al directorio durable.
4. Una respuesta confirmada actualiza la versión base y encadena cualquier cambio posterior del
   mismo registro.
5. Un conflicto de versión queda bloqueado para revisión humana; no se resuelve por última escritura.
6. `SUJETA_CREDITO` permanece bloqueado mientras exista trabajo local sin confirmar.

Esta primera vertical cubre Solicitud, documentos de M02 y la captura general de Entrevista. Llamada,
Visita al vecino e Imágenes del domicilio aún no tienen cadenas offline completas.

## Flujo de autorizacion de acceso

1. JWT identifica usuario y rol.
2. El guard valida modulo y accion.
3. Para `ASESOR`, el servicio valida que el expediente pertenezca al empleado vinculado al usuario.
4. Solo despues se permite leer o modificar grupo, expediente, integrante, solicitud o documento.

## Flujo de verificacion

Cobertura actual:

1. Revisión documental previa.
2. Concentrador sin orden obligatorio: Llamada, Visita al vecino, Imágenes del domicilio y
   Entrevista.
3. Persistencia independiente de respuestas, evidencias, actor, fecha e idempotencia cuando aplica.
4. `Conclusiones` deshabilitado; no existe salida general ni transición posterior autorizada.

Salidas funcionales objetivo, aún no implementadas:

- Verificado.
- Con observaciones.
- Rechazado.

## Flujo de autorizacion y desembolso

Este bloque describe el contrato objetivo; M04 y M05 no tienen API o pantalla ejecutable verificada.

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

## Matriz de trazabilidad del flujo

| Tramo | Entidad principal | Estado de implementación |
|---|---|---|
| Documentación | Grupo, expediente, integrante, solicitud y documentos | Parcial funcional |
| Handoff | Expediente, participantes y tesorera | Implementado con mínimo temporal |
| Verificación | Cuatro procesos y sus evidencias | Parcial, sin dictamen general |
| Análisis | Expediente verificado | No implementado |
| Desembolso | Crédito, ciclo y evento de desembolso | Sólo base de datos parcial |
| Cobranza y posteriores | Calendario, pago, mora y reestructura | Sólo base de datos parcial |

## Referencias cruzadas

- project/06_OPERATION_MANUAL.md
- project/08_ENTITY_CATALOG.md
- project/09_STATE_MACHINE.md
