# 03 Operation Manual - Manual Operativo

Version: 1.0.0
Estado: Vigente

## Roles operativos

- Asesora de credito.
- Verificacion.
- Analisis.
- Desembolsos.
- Cobranza.
- Coordinacion operativa.
- Administracion de parametros.
- Control interno.

## Procedimiento estandar - Grupo nuevo

1. Asesora ingresa a Documentacion.
2. Registra grupo.
3. Se abre expediente.
4. Integra solicitantes.
5. Captura solicitud individual por solicitante.
6. Captura documentos por solicitante.
7. Sistema calcula completitud.
8. Si cumple reglas, expediente se envia a verificacion.

## Procedimiento estandar - Renovacion

1. Asesora inicia flujo de renovacion.
2. Sistema mantiene visibilidad del ciclo vigente.
3. Se captura nuevo expediente.
4. Se validan reglas de refinanciamiento.
5. Si aplica umbral minimo pagado, expediente puede continuar.

## Politica de observaciones

- Toda observacion debe ser accionable.
- Debe indicar entidad afectada y causa.
- Debe permitir reingreso al flujo sin perdida de contexto.

## Politica de excepciones

- Excepciones documentales no eliminan obligacion; la reprograman bajo control.
- Excepciones de datos requieren motivo, actor, fecha y vigencia.
- Excepciones criticas deben escalarse.

## Checklist operativo por expediente

- Minimo de solicitantes completas segun parametros.
- Sin documentos obligatorios pendientes.
- Solicitud digital capturada por solicitante aplicable.
- Solicitud fisica anexada cuando corresponda.
- Sin bloqueos de refinanciamiento.

## Regla de continuidad

Si la captura se interrumpe, el sistema debe conservar progreso y no perder informacion.

## Referencias cruzadas

- project/07_OPERATION_FLOW.md
- project/09_STATE_MACHINE.md
- project/15_UI_UX_STANDARDS.md
