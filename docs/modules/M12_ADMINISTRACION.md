# M12 Administración — Especificación y matriz de acceso propuesta

Versión: 1.0.0
Estado: Aprobado por Dirección mediante DEC-175; implementación técnica pendiente
Fecha de diseño: 2026-10-04

## 1. Identidad

- Nombre oficial: Administración.
- Código: M12.
- Estado funcional: matriz aprobada; no aplicada todavía al runtime.
- Responsable operativo propuesto: Dirección para la política y Gerencia para las solicitudes dentro de su alcance.
- Responsable técnico propuesto: Administración del sistema para ejecutar cambios previamente autorizados.
- Roles usuarios: `ADMINISTRADOR`, `GERENTE` y `COORDINADOR` con capacidades distintas; los demás roles sólo conservan autoservicio de su propia sesión fuera de M12.

Esta especificación quedó aprobada mediante DEC-175. La aprobación no cambia por sí sola permisos,
datos, esquema, rutas ni navegación; su implementación conserva el plan controlado de la sección 20.

## 2. Objetivo y resultado observable

- Problema que resuelve: sustituir permisos amplios, combinaciones ambiguas y ajustes manuales por un gobierno de acceso mínimo, trazable y escalable.
- Resultado esperado: cada capacidad queda definida por módulo, acción, alcance y rol; toda modificación sensible requiere solicitud, autorización independiente, ejecución auditada y vigencia conocida.
- Indicadores de éxito:
  - cero rutas funcionales sin permiso declarado;
  - cero comodines `*` en la matriz productiva;
  - cero ampliaciones individuales sin aprobación y vencimiento;
  - cien por ciento de cambios de usuario, rol, alcance o permiso con actor, motivo, antes, después y resultado;
  - revisión trimestral de cuentas activas, excepciones y permisos efectivos.

## 3. Alcance

### Incluye

- Matriz inicial de los doce módulos institucionales y ocho roles vigentes.
- Acciones administrativas de usuarios, roles, alcances, PIN y excepciones.
- Alcance de datos `PROPIO`, `SUCURSAL`, `ZONA` o `GLOBAL` separado del rol.
- Segregación entre solicitar, aprobar y ejecutar cambios sensibles.
- Reglas de auditoría, concurrencia, vigencia y reversión.
- Ruta de transición desde el contrato técnico actual.

### No incluye

- Aplicar permisos en PostgreSQL, API o mobile antes de la aprobación funcional.
- Crear pantallas o endpoints administrativos.
- Definir reglas operativas de módulos M04–M11 que aún no tienen especificación aprobada.
- Convertir el rol técnico `ASESOR_PRUEBA_SIN_VERIFICACION` en rol institucional.
- Dar acceso productivo por la excepción temporal DEC-023.
- Crear, borrar o reasignar usuarios reales.

## 4. Base verificada al 2026-10-04

### 4.1 PostgreSQL

La consulta de sólo lectura a `crelealtad` confirmó:

| Rol | Estado | Cuentas | Activas | Excepciones individuales |
|---|---|---:|---:|---:|
| `ADMINISTRADOR` | ACTIVO | 1 | 1 | 0 |
| `ASESOR` | ACTIVO | 54 | 54 | 1 |
| `COBRADOR` | ACTIVO | 0 | 0 | 0 |
| `COORDINADOR` | ACTIVO | 0 | 0 | 0 |
| `DESEMBOLSADOR` | ACTIVO | 0 | 0 | 0 |
| `GERENTE` | ACTIVO | 0 | 0 | 0 |
| `RECOLECTOR` | ACTIVO | 0 | 0 | 0 |
| `VERIFICADOR` | ACTIVO | 0 | 0 | 0 |
| `ASESOR_PRUEBA_SIN_VERIFICACION` | INACTIVO | 0 | 0 | 0 |

Los conteos son agregados y no consultan ni documentan nombres de personas.

### 4.2 Contrato ejecutable actual

`roles.permisos` y `usuarios.permisos_personalizados` guardan dos listas independientes:

```json
{
  "modulos": ["documentacion", "verificacion"],
  "acciones": ["crear", "leer", "actualizar", "registrar"]
}
```

La API interpreta ambas listas como producto cartesiano. Por ejemplo, agregar un módulo a una cuenta que ya tiene `crear` autoriza técnicamente `crear` dentro de ese módulo si en el futuro aparece un endpoint con ese par, aunque la intención hubiera sido conceder sólo lectura. Hoy no existe ese endpoint en Verificación, pero el contrato no es suficientemente seguro para crecer.

El código activo declara diez pares reales en 53 handlers protegidos:

| Módulo técnico | Acciones usadas |
|---|---|
| `documentacion` | `crear`, `leer` |
| `expedientes` | `crear`, `leer`, `actualizar` |
| `solicitudes` | `crear`, `leer`, `actualizar` |
| `verificacion` | `leer`, `registrar` |

Los demás identificadores del catálogo técnico todavía no tienen handlers ejecutables.

### 4.3 Brechas que la implementación deberá cerrar

1. Los comodines de `ADMINISTRADOR` y `GERENTE` conceden acceso total y contradicen el objetivo de mínimo privilegio productivo.
2. La excepción DEC-023 permite a `ASESOR` entrar temporalmente a Verificación; el contexto actual de Verificación es institucional y no aplica todavía sucursal o zona.
3. Las excepciones individuales sustituyen el conjunto efectivo, pero técnicamente también pueden ampliarlo; la política objetivo debe restringirlas por defecto.
4. No existe alcance territorial general ni una asignación aprobada para todos los roles.
5. No hay API o UI de M12, flujo de doble control ni auditoría administrativa completa.
6. Faltan roles funcionales aprobados para Análisis/Autorización y Control interno/Auditoría; no deben esconderse bajo `GERENTE` o `ADMINISTRADOR` sin decisión.

## 5. Modelo de autorización propuesto

Una capacidad efectiva debe ser la intersección de cuatro dimensiones:

```text
rol aprobado + par módulo–acción + alcance de datos + condición operativa
```

El contrato objetivo recomendado es por capacidades explícitas, no por listas independientes:

```json
{
  "version": 2,
  "capacidades": [
    {
      "modulo": "documentacion",
      "acciones": ["crear", "leer", "actualizar"],
      "alcance": "PROPIO"
    }
  ]
}
```

Reglas del contrato:

- lo no declarado se deniega;
- no se permiten comodines en producción;
- el alcance se valida en la API y nunca sólo en mobile;
- una acción aprobada para un módulo no se hereda a otro;
- las dependencias técnicas no crean una tarjeta adicional en el menú;
- una excepción individual restringe por defecto; cualquier ampliación requiere el mismo doble control que un cambio de rol, fecha de expiración y justificación;
- cambiar permisos no cambia el rol operativo, conforme a DEC-025;
- mobile recibe capacidades efectivas, pero la API conserva la autoridad.

## 6. Alcances de datos propuestos

| Alcance | Definición | Regla de fallo seguro |
|---|---|---|
| `PROPIO` | Recursos asignados directamente al usuario autenticado | Sin asignación, no hay acceso |
| `SUCURSAL` | Recursos pertenecientes a la misma sucursal vigente del usuario | Sucursal nula o distinta deniega |
| `ZONA` | Recursos de las sucursales incluidas en la zona vigente del usuario | Zona nula, inactiva o sin relación deniega; nunca se convierte en global |
| `GLOBAL` | Todos los recursos autorizados de la institución | Sólo para capacidades explícitas de gobierno, nunca por herencia |

`INSTITUCIONAL`, usado hoy como modo técnico de Verificación, no forma parte del contrato productivo objetivo porque equivale a acceso sin filtro territorial.

## 7. Matriz inicial módulo–acción–rol propuesta

Leyenda: `C` crear, `L` leer, `A` actualizar, `R` registrar, `P` aprobar, `X` rechazar y `E` exportar. El alcance aparece después de `·`. `BLOQUEADO` significa denegación explícita hasta que exista especificación y decisión aprobadas.

| Módulo | ASESOR | VERIFICADOR | COORDINADOR | DESEMBOLSADOR | RECOLECTOR | COBRADOR | GERENTE | ADMINISTRADOR |
|---|---|---|---|---|---|---|---|---|
| M01 Login | Sesión propia | Sesión propia | Sesión propia | Sesión propia | Sesión propia | Sesión propia | Sesión propia | Sesión propia |
| M02 Documentación | `C,L,A · PROPIO` | — | `L · SUCURSAL` | — | — | — | `L · ZONA` | — |
| M03 Verificación | — | `L,R · SUCURSAL` | `L · SUCURSAL` | — | — | — | `L · ZONA` | — |
| M04 Análisis | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M05 Desembolsos | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M06 Cobranza | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M07 Recolección | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M08 Mora | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M09 Convenios | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M10 Reportes | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |
| M11 Parámetros | — | — | — | — | — | — | `L,P,X · GLOBAL` | `L,A,R · GLOBAL` |
| M12 Administración | — | — | `L · SUCURSAL` | — | — | — | `L,P,X,E · ZONA` | `C,L,A,R,E · GLOBAL` |

Interpretación obligatoria:

- La fila M01 describe autoservicio de autenticación y no concede acceso administrativo.
- `ASESOR` pierde en la matriz productiva el acceso a M03 otorgado sólo para desarrollo por DEC-023.
- M02 y M03 separan captura y verificación; un rol supervisor puede leer, pero no capturar ni dictaminar por herencia.
- M04–M10 permanecen denegados aunque existan tablas o tarjetas `Próximamente`. Cada módulo deberá sustituir `BLOQUEADO` por pares y alcances aprobados en su propia especificación.
- M11 propone doble control: `GERENTE` decide funcionalmente y `ADMINISTRADOR` publica técnicamente; ninguna persona puede aprobar y ejecutar el mismo cambio.
- M12 no da a `ADMINISTRADOR` permiso sobre módulos operativos o financieros. Su alcance global se limita al gobierno de acceso.
- `COORDINADOR` sólo consulta el directorio de su sucursal; las solicitudes de cambio se modelan de forma específica en la matriz detallada.
- Las lecturas supervisoras no incluyen automáticamente coordenadas precisas, documentos sensibles ni exportación de datos personales. Esas superficies requieren permiso y propósito específicos.

## 8. Propietarios propuestos para módulos bloqueados

Esta tabla orienta el siguiente diseño, pero no concede permisos:

| Módulo | Rol operativo candidato | Control separado requerido | Brecha antes de habilitar |
|---|---|---|---|
| M04 Análisis | Rol funcional de Análisis por definir | Autorización y Control interno | No existe rol institucional equivalente aprobado |
| M05 Desembolsos | `DESEMBOLSADOR` | Aprobación previa distinta y conciliación | Falta especificación, idempotencia y doble control |
| M06 Cobranza | `COBRADOR` | Conciliación y reversión separadas | Falta contrato de pagos y reversos |
| M07 Recolección | `RECOLECTOR` | Entrega/recepción y conciliación por actores distintos | Falta cola offline, recibos e idempotencia |
| M08 Mora | `COBRADOR` | Supervisión territorial | Falta regla de cálculo y asignación aprobadas |
| M09 Convenios | `COBRADOR` como proponente | `GERENTE` o autorizador como aprobador | Falta equivalencia convenio/reestructura y límites |
| M10 Reportes | `COORDINADOR` y `GERENTE` | Gobierno de KPI y minimización | Falta catálogo de reportes, fórmulas y campos exportables |

## 9. Matriz detallada de M12 propuesta

Las siguientes acciones son identificadores funcionales propuestos. Antes de programarlas deberán incorporarse al catálogo técnico por pares y contar con pruebas de denegación.

| Acción M12 | COORDINADOR | GERENTE | ADMINISTRADOR | Condición obligatoria |
|---|---|---|---|---|
| `leer` usuarios y acceso efectivo | `SUCURSAL` | `ZONA` | `GLOBAL` | Minimizar datos; nunca exponer hash, PIN o token |
| `solicitar_cambio` | `SUCURSAL` | `ZONA` | `GLOBAL` | Motivo, objetivo, vigencia y ticket inmutable |
| `crear_usuario` | — | — | `GLOBAL` | Solicitud aprobada; abreviatura única; PIN temporal nunca visible después de emisión |
| `actualizar_usuario` | — | — | `GLOBAL` | Sólo datos administrativos autorizados; antes/después auditado |
| `cambiar_estado_usuario` | — | `P/X · ZONA` | `R · GLOBAL` | Aprobador y ejecutor distintos; no borrar usuario |
| `restablecer_pin` | `Solicitar` | `P/X · ZONA` | `R · GLOBAL` | Marca cambio obligatorio; nunca registrar PIN ni hash |
| `asignar_rol_alcance` | `Solicitar` | `P/X · ZONA` | `R · GLOBAL` | Sólo dentro de matriz aprobada; sin autoasignación |
| `proponer_permisos` | — | `ZONA` | `GLOBAL` | Justificación, impacto, vigencia y diff legible |
| `aprobar_permisos` / `rechazar_permisos` | — | `ZONA` | — | No aprobar propuesta propia ni ampliar fuera de la matriz |
| `publicar_permisos` | — | — | `GLOBAL` | Requiere aprobación vigente de otra persona |
| `exportar` reporte de accesos | — | `ZONA` | `GLOBAL` | Sin secretos; descarga auditada y con retención definida |

En la tabla, `P/X` representa aprobar/rechazar y `R` registrar o ejecutar el evento confirmado. Los textos `Solicitar` se implementarán con la acción específica `solicitar_cambio`, no con permisos de actualización directa.

## 10. Flujo operativo de M12

1. Coordinación, Gerencia o Administración crea una solicitud con persona objetivo, cambio, motivo, alcance y vigencia.
2. La API valida que el cambio esté contenido en la matriz aprobada y que el actor tenga alcance sobre la cuenta objetivo.
3. Gerencia aprueba o rechaza; no puede decidir su propia solicitud ni una modificación de su propia cuenta.
4. Administración ejecuta únicamente una solicitud aprobada y no vencida.
5. La transacción actualiza el dato y escribe auditoría con solicitud, actor solicitante, aprobador, ejecutor, antes, después, resultado y fecha.
6. Las sesiones afectadas se invalidan cuando cambia rol, alcance, estado o permisos.
7. Una revisión posterior puede revertir mediante una nueva solicitud; nunca se borra la evidencia anterior.

## 11. Entidades y datos objetivo

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| `roles` | PostgreSQL | Sí | Ocho roles institucionales; rol técnico no elegible | Sí |
| `usuarios` | PostgreSQL | Sí | Estado, rol y sucursal válidos | Sí |
| `empleados.zona_id` | PostgreSQL | Según alcance | Zona activa y compatible con sucursal | Sí |
| Capacidad por par | Matriz versionada | Sí | Módulo, acción y alcance conocidos | Sí |
| Solicitud de acceso | M12 | Sí | Objetivo, motivo, solicitante, vigencia | Sí, inmutable |
| Decisión de acceso | M12 | Sí para cambios sensibles | Aprobador distinto; resultado y motivo | Sí, inmutable |
| Ejecución | M12 | Sí | Solicitud aprobada y no vencida | Sí, inmutable |
| Excepción individual | M12 | Opcional | Restrictiva por defecto; expiración obligatoria | Sí |

No se autoriza crear tablas hasta aprobar esta especificación y revisar el esquema real inmediatamente antes de la migración.

## 12. Estados y transiciones objetivo

### Solicitud administrativa

```text
BORRADOR → PENDIENTE_APROBACION → APROBADA → EJECUTADA
                              ↘ RECHAZADA
                              ↘ VENCIDA
APROBADA → CANCELADA antes de ejecutar
```

- Ninguna transición se infiere desde la UI.
- `EJECUTADA` exige que la modificación y la auditoría se confirmen en la misma transacción.
- Un fallo conserva la solicitud aprobada y registra el intento fallido; no comunica éxito.
- Revertir crea una solicitud nueva ligada a la ejecución original.

## 13. Pantallas objetivo

| Pantalla | Plantilla | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Inicio Administración | T8 | Priorizar solicitudes y riesgos de acceso | Abrir usuarios, solicitudes y revisiones | `ModuleShell`, tarjetas y estados compartidos |
| Usuarios | T2 | Buscar y filtrar por estado, rol y territorio | Ver detalle, solicitar cambio | Lista, `StatusBadge`, búsqueda compartida |
| Detalle de usuario | T3 | Mostrar acceso efectivo y origen | Solicitar estado, PIN, rol o alcance | Secciones, badges, confirmación explícita |
| Solicitudes de acceso | T2 | Atender pendientes por alcance | Abrir, aprobar o rechazar | Lista priorizada y estado vacío/error |
| Comparación de cambio | T4 | Revisar antes/después y riesgo | Aprobar, rechazar, ejecutar | Resumen, motivo obligatorio, acción crítica |
| Reporte de acceso | T2 | Revisar rol, capacidades, alcance y excepciones | Filtrar y exportar | Tabla/lista adaptable y descarga auditada |

## 14. API y persistencia objetivo

- Endpoints: se definirán después de aprobar la matriz; deberán separar lectura, solicitud, decisión y ejecución.
- Servicios: `AccessPolicyService`, `AccessRequestService`, `UserAdministrationService` y `SessionRevocationService`, con responsabilidades separadas.
- Persistencia: tablas aditivas para versiones de política, solicitudes, decisiones y ejecuciones; `audit_log` conserva el evento general.
- Idempotencia: clave obligatoria en ejecución y restablecimiento; repetir una confirmación devuelve el resultado previo sin duplicar cambios.
- Concurrencia: bloqueo transaccional sobre solicitud y usuario objetivo; una versión obsoleta se rechaza.
- Auditoría: nunca guardar PIN, hash, token ni datos personales ajenos al cambio.

## 15. Reglas de negocio y seguridad

1. Denegación por defecto.
2. Sin borrado físico de usuarios, roles, solicitudes o auditoría.
3. Ninguna persona aprueba o ejecuta su propia elevación.
4. Un cambio de rol, alcance, estado o permiso invalida sesiones vigentes.
5. La última cuenta administrativa activa no puede desactivarse sin un reemplazo activo verificado.
6. Los roles técnicos de prueba no aparecen como opción asignable.
7. `ADMINISTRADOR` gobierna acceso; no recibe por herencia decisiones operativas, financieras o de riesgo.
8. `GERENTE` no obtiene comodín; sólo decide dentro de la zona y matriz aprobadas.
9. Coordenadas, documentos y datos personales requieren propósito y permiso específico; `leer` un módulo no autoriza exportarlos.
10. Los cambios críticos de M11 y M12 requieren actores distintos para decisión y publicación.
11. Las excepciones caducan automáticamente y vuelven a la política del rol sin borrar historia.
12. La revisión de permisos se ejecuta al menos cada tres meses y al cambiar puesto, sucursal, zona o estado laboral.

## 16. Estados técnicos de UI

- Carga: esqueleto y controles sensibles deshabilitados.
- Vacío: distinguir sin usuarios, sin resultados y sin solicitudes pendientes.
- Error: conservar filtros y la solicitud no enviada; no simular cambio.
- Sin conexión: M12 es sólo lectura de caché; ninguna decisión o ejecución se confirma offline.
- Sin permiso: pantalla bloqueada sin filtrar existencia de usuarios fuera del alcance.
- Concurrencia: mostrar que el registro cambió y exigir recarga; no sobrescribir.
- Éxito: sólo después de confirmación transaccional del servidor.

## 17. Pruebas requeridas para la implementación

- Unitarias: normalización v2, par exacto, alcance, expiración, doble control y no autoaprobación.
- Integración: denegación por defecto, territorio, cambio de rol/estado, revocación de sesión, idempotencia y auditoría.
- Seguridad: intento de combinación cartesiana, rol técnico, escalamiento individual, acceso por UUID conocido y exportación fuera de alcance.
- Migración: conversión explícita sin comodines, conteos, rollback, respaldo y ensayo en `crelealtad_test`.
- Mobile: menú filtrado, estados carga/vacío/error/sin permiso y bloqueo de acciones críticas sin confirmación.
- Regresión: M01, M02 y M03 conservan sus flujos y la excepción DEC-023 sólo hasta el corte aprobado.

## 18. Criterios de aceptación de diseño

- [x] Código activo, decoradores, guard, mobile y PostgreSQL fueron inventariados.
- [x] Se distinguió el estado actual de la política objetivo.
- [x] Los doce módulos y ocho roles institucionales están considerados.
- [x] Los módulos sin contrato quedan denegados, no inferidos.
- [x] M12 separa solicitar, aprobar y ejecutar.
- [x] El alcance territorial falla cerrado.
- [x] No se modificaron permisos ni datos al diseñar.
- [x] Dirección aprueba expresamente la matriz y las decisiones abiertas.
- [x] La aprobación se registra en `docs/DECISIONES.md` y `docs/project/23_DECISION_LOG.md`.
- [ ] La implementación se divide en migración de contrato, backend, mobile y pruebas.

## 19. Decisiones aprobadas mediante DEC-175

Dirección aprobó en conjunto estas reglas el 2026-10-04:

1. Adoptar capacidades por par módulo–acción y retirar el producto cartesiano y los comodines en producción.
2. Adoptar `PROPIO`, `SUCURSAL`, `ZONA` y `GLOBAL`, con fallo cerrado cuando falte asignación.
3. Retirar el acceso productivo de `ASESOR` a M03 cuando termine DEC-023; M03 queda para `VERIFICADOR`, con lectura supervisora de Coordinación y Gerencia.
4. Mantener M04–M10 bloqueados hasta aprobar la especificación de cada módulo.
5. Aplicar doble control en M11 y M12: Gerencia decide y Administración publica; nadie decide su propio cambio.
6. Hacer restrictivas por defecto las excepciones individuales; cualquier ampliación será temporal, justificada y aprobada.
7. No otorgar a `ADMINISTRADOR` acceso operativo o financiero por herencia.
8. Abrir una decisión separada sobre los roles faltantes de Análisis/Autorización y Control interno/Auditoría antes de M04.

## 20. Plan de implementación posterior a la aprobación

1. Registrar la decisión funcional y congelar esta versión como matriz base.
2. Diseñar migración aditiva del contrato v2 y conversión explícita de permisos actuales.
3. Implementar evaluador por par y alcance, manteniendo compatibilidad temporal controlada.
4. Añadir pruebas de permiso, territorio y escalamiento antes de cambiar datos.
5. Ensayar en `crelealtad_test`, respaldar y validar rollback.
6. Aplicar la matriz restrictiva en un corte programado e invalidar sesiones.
7. Construir API y UI de M12 sobre solicitud, aprobación y ejecución auditadas.
8. Retirar DEC-023 únicamente cuando M02/M03 y sus usuarios objetivo estén verificados.

## Referencias

- `docs/project/01_PROJECT_CONSTITUTION.md`
- `docs/project/05_BUSINESS_RULES.md`
- `docs/project/07_OPERATION_FLOW.md`
- `docs/project/08_ENTITY_CATALOG.md`
- `docs/project/10_DATABASE_PRINCIPLES.md`
- `docs/project/12_SECURITY_MODEL.md`
- `docs/project/20_MODULE_CATALOG.md`
- `docs/project/22_CHANGE_CHECKLIST.md`
- `docs/DECISIONES.md`
- `apps/api/src/auth/permission.contract.ts`
- `apps/api/src/auth/permissions.guard.ts`
- `apps/api/src/common/access-scope.ts`
