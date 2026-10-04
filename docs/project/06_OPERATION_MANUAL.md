# 06 Operation Manual — Manual Operativo

Versión: 1.2.0
Estado: Vigente
Fecha de verificación: 2026-10-04

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
8. Si cumple las validaciones técnicas vigentes, el expediente se envía a Verificación en una
   transacción auditable. Hasta que M11 parametrice el producto, el servidor exige al menos una
   participante completa, ninguna participante pendiente y una tesorera participante completa.

## Procedimiento estándar — Renovación

Cobertura implementada:

1. La asesora abre Renovación y consulta grupos vigentes o pasados de su alcance.
2. El sistema conserva visible el ciclo histórico que origina la renovación.
3. Una selección elegible crea de forma transaccional e idempotente el expediente siguiente y
   precarga integrantes y montos disponibles.
4. La asesora confirma participantes, retiros/reintegros y tesorera antes del handoff.

Contrato objetivo pendiente:

1. Evaluar refinanciamiento contra el porcentaje pagado y las políticas vigentes del producto.
2. Usar el umbral inicial de 80 % sólo a través de parámetros versionados y aprobados.
3. Bloquear o continuar con causa, actor y resultado auditables.

La cobertura actual no declara implementada la validación financiera del refinanciamiento.

## Procedimiento actual — Verificación

1. El verificador revisa primero los documentos confirmados del expediente y de cada participante.
2. Después abre un concentrador con cuatro procesos independientes: Llamada, Visita al vecino,
   Imágenes del domicilio y Entrevista. No existe un orden obligatorio entre ellos.
3. Cada proceso guarda únicamente las respuestas y evidencias que su contrato actual soporta.
4. `Conclusiones` permanece visible y deshabilitado; el sistema aún no emite dictamen general,
   observación estructurada, aprobación ni rechazo del expediente.

## Politica de observaciones

- Toda observacion debe ser accionable.
- Debe indicar entidad afectada y causa.
- Debe permitir reingreso al flujo sin perdida de contexto.

## Politica de excepciones

- Excepciones documentales no eliminan obligacion; la reprograman bajo control.
- Excepciones de datos requieren motivo, actor, fecha y vigencia.
- Excepciones criticas deben escalarse.

## Checklist operativo por expediente

- Regla oficial: mínimo de solicitantes completas según parámetros.
- Cobertura temporal: al menos una participante completa mientras M11 siga pendiente.
- Sin documentos obligatorios pendientes.
- Solicitud digital capturada por solicitante aplicable.
- Solicitud fisica anexada cuando corresponda.
- Sin bloqueos de refinanciamiento cuando exista el motor parametrizado; todavía no está implementado.
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
