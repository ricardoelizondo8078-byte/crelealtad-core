# 03 Operation Manual - Manual Operativo

Version: 1.1.0
Estado: Vigente
Fecha de verificacion: 2026-09-21

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
2. Registra grupo; el servidor crea el grupo y su expediente en una sola transaccion.
3. La asesora trabaja sobre el expediente asignado a su usuario; no puede abrir uno ajeno por URL o identificador.
4. Integra solicitantes.
5. Captura solicitud individual por solicitante; edad, relaciones internas, ciclo y monto autorizado los determina el servidor.
6. Carga documentos por solicitante. Una ruta escrita o local no cuenta como evidencia: el servidor debe confirmar el archivo.
7. Sistema calcula completitud con todos los campos obligatorios y tres evidencias confirmadas: INE de la integrante, comprobante de domicilio y solicitud firmada. La INE del beneficiario y el comprobante de línea de crédito son opcionales.
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
- Tesorera seleccionada entre participantes completas antes del envio.
- Ninguna integrante pendiente, salvo las retiradas formalmente con motivo y auditoria.

## Sesion y seguridad operativa

- Al reabrir la app, la sesion guardada se valida con el servidor antes de habilitar modulos.
- La app no muestra listas publicas de usuarios; el acceso usa abreviatura y PIN.
- Los permisos visuales no sustituyen la validacion de la API.

## Regla de continuidad

Si la captura se interrumpe, el sistema debe conservar progreso y no perder informacion.

## Referencias cruzadas

- project/07_OPERATION_FLOW.md
- project/09_STATE_MACHINE.md
- project/15_UI_UX_STANDARDS.md
