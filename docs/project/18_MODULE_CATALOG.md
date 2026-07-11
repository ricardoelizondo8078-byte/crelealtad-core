# 18 Module Catalog - Catalogo de Modulos

Version: 1.1.0
Estado: Vigente y auditado
Fecha de auditoria: 2026-07-10

## Criterio de catalogacion

- Este catalogo resume objetivo, superficie verificada y brechas documentales de cada modulo.
- No se verificaron archivos markdown dedicados dentro de docs/modules para los modulos listados.
- Cuando no existe API o pantalla verificada, se documenta como pendiente y no se infiere funcionalidad.

## M01 Login

Objetivo: autenticacion inicial y control de acceso.
Dependencias: usuarios, roles, seguridad.
Pantallas verificadas: no verificadas en mobile actual.
APIs verificadas: no verificadas.
Estado: 0%.
Riesgo principal: API actual sin autenticacion productiva.

## M02 Documentacion

Objetivo: crear y completar expedientes.
Dependencias: grupos, expedientes, solicitantes, solicitudes, documentos.
Pantallas verificadas: home, crear grupo, mis expedientes, detalle expediente, formularios parciales de solicitante y solicitud, captura documental parcial.
APIs verificadas: POST /grupos, GET /expedientes/group/:groupId, GET /expedientes/:id, PATCH /expedientes/:id/send-to-verification, GET y POST de solicitantes, GET y POST de solicitudes, GET y PATCH de documentos.
Estados asociados: expediente, solicitante, solicitud, documento.
Reglas clave: RN-003, RN-004, RN-013, RN-027, RN-028, RN-030, RN-040.
Estado: 45%.
Pendientes: persistencia completa, validaciones de maquina de estados, seguridad y trazabilidad.

## M03 Verificacion

Objetivo: validar expediente y emitir dictamen.
Dependencias: expedientes, documentos, solicitantes.
Pantallas verificadas: no verificadas.
APIs verificadas: parcial, solo transicion send-to-verification observada.
Estado: 10%.
Pendientes: cola de revision, observaciones, aprobar, rechazar, trazabilidad de dictamen.

## M04 Analisis

Objetivo: evaluar elegibilidad final.
Dependencias: expediente verificado, reglas, producto, parametros.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## M05 Desembolsos

Objetivo: registrar entrega de credito.
Dependencias: autorizacion, grupo, credito, renovacion, validacion de umbral cuando aplique.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 5%.
Dependencia critica: validacion de refinanciamiento y evento de desembolso auditable.

## M06 Cobranza

Objetivo: seguimiento de pagos y cumplimiento.
Dependencias: creditos, pagos, ciclos.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## M07 Recoleccion

Objetivo: registro operativo de recaudacion.
Dependencias: cobranza, pagos, usuarios.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## M08 Mora

Objetivo: gestion de cartera vencida.
Dependencias: cobranza, convenios, pagos, reportes.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## M09 Convenios

Objetivo: acuerdos de regularizacion.
Dependencias: mora, cobranza, credito.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## M10 Reportes

Objetivo: analitica operativa y ejecutiva.
Dependencias: datos auditables de todos los modulos.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## M11 Parametros

Objetivo: configuracion de politicas.
Dependencias: productos, reglas, seguridad.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.
Observacion: es modulo critico para cumplir el principio de configuracion sobre hardcode.

## M12 Administracion

Objetivo: gobierno de usuarios, roles y catalogos.
Dependencias: login, seguridad, personas, usuarios, roles.
Pantallas verificadas: no verificadas.
APIs verificadas: no verificadas.
Estado: 0%.

## Referencias cruzadas

- project/02_BUSINESS_RULES.md
- project/06_STATE_MACHINE.md
- project/12_PROJECT_STATUS.md
- project/PROJECT_AUDIT_REPORT.md
