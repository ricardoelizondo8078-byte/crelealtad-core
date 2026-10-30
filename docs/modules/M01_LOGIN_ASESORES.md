# M01 — Login de asesores por abreviatura

## 1. Identidad

- Nombre oficial: Login de asesores por abreviatura y PIN individual.
- Codigo: M01-AUTH-ASESORES.
- Estado: parcial funcional; login, sesión, cambio obligatorio de PIN y acceso universal local de desarrollo implementados; recuperación administrativa pendiente.
- Responsable operativo: Direccion CRELEALTAD.
- Roles usuarios: ASESOR.

## 2. Objetivo y resultado observable

- Problema: las pruebas multiusuario requieren continuidad de acceso sin guardar una credencial universal en el código ni debilitar producción.
- Resultado: cada asesor inicia sesion con su abreviatura y PIN individual; en desarrollo puede usarse además un PIN universal configurado únicamente en el entorno local protegido.
- Exito: 49 asesores activos pueden autenticarse; correo deja de ser requisito para ellos; un usuario inactivo no puede entrar.

## 3. Alcance

### Incluye

- Columna unica de abreviatura en `usuarios`.
- PIN almacenado exclusivamente como hash bcrypt en `password_hash`.
- Marca `requiere_cambio_pin` para las credenciales temporales.
- Alta de 49 usuarios y 49 empleados con rol `ASESOR`, sucursal `MATRIZ`, zona nula y estado `ACTIVO`.
- Actualizacion de DTO, servicio JWT y pantalla mobile.
- Cambio obligatorio del PIN temporal antes de operar cualquier módulo.
- Confirmación del PIN actual, nuevo PIN y repetición del nuevo PIN.
- Bloqueo de API y navegación mientras `requiere_cambio_pin = true`, salvo perfil y cambio de PIN.
- PIN universal opcional para sesiones locales de desarrollo mediante `DEV_UNIVERSAL_PIN`; no cambia hashes ni marcas de la cuenta.

### No incluye

- Asignacion de zonas.
- Recuperacion de PIN.
- Cambio voluntario posterior desde Administración.
- Inactivacion automatica por grupos activos.
- Implementación del contrato por pares y alcances aprobado en DEC-175 para roles y módulos futuros.
- Persistencia de comisiones.

## 4. Flujo operativo

1. El asesor captura su abreviatura.
2. Captura su PIN numerico de cuatro digitos.
3. La API busca la abreviatura sin distinguir mayusculas/minusculas.
4. La API compara primero el PIN con `password_hash` mediante bcrypt. Sólo con `NODE_ENV=development` y una variable `DEV_UNIVERSAL_PIN` válida acepta también el acceso universal temporal.
5. La API entrega JWT con identidad, rol, sucursal y permisos efectivos.
   Cuando el usuario tiene `permisos_personalizados`, éstos sustituyen al conjunto del rol sin cambiar el nombre ni el alcance operativo del rol.
6. El cliente conserva la marca de cambio de PIN pendiente. Una sesión creada con el PIN universal de desarrollo omite temporalmente ese bloqueo sin modificar la marca persistida.
7. Cuando la marca está activa, mobile muestra el cambio obligatorio antes del menú: solicita PIN actual, nuevo PIN y confirmación.
8. La API valida el PIN actual, exige que el nuevo coincida con su confirmación y sea distinto, almacena sólo el nuevo hash bcrypt y desactiva la marca dentro de una transacción auditada.
9. Sólo después de la confirmación del servidor, mobile actualiza la sesión y muestra el menú principal T8 con únicamente los módulos ejecutables habilitados por los permisos efectivos.
10. Durante el diseño, las compilaciones de desarrollo muestran además tarjetas deshabilitadas con la leyenda `Próximamente`; no otorgan permisos ni ejecutan navegación y no se incluyen en compilaciones de producción.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validacion | Historial |
|---|---|---:|---|---:|
| `usuarios.abreviatura` | Tabla de asesores | Si para asesores | Unica sin distinguir mayusculas | Si |
| `usuarios.password_hash` | PIN individual | Si | bcrypt; nunca texto plano | Si |
| `usuarios.requiere_cambio_pin` | Carga inicial | Si | `true` mientras use PIN temporal | Si |
| `DEV_UNIVERSAL_PIN` | Entorno local protegido | No | Exactamente cuatro dígitos; sólo `development` | No se persiste |
| `usuarios.rol_id` | Rol `ASESOR` | Si | FK activa | Si |
| `usuarios.permisos_personalizados` | Excepción autorizada | No | JSONB con arreglos `modulos` y `acciones` | Sí, mediante `audit_log` |
| `usuarios.sucursal_id` | `MATRIZ` | Si | FK activa | Si |
| `empleados.zona_id` | Futuro | No | FK cuando se asigne | Si |

## 6. Estados y transiciones

| Estado | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| ACTIVO | Sistema | Carga inicial | INACTIVO/SUSPENDIDO | Ninguno inicial |
| INACTIVO | Sistema | Sin grupos activos tras conciliacion futura | ACTIVO por regla aprobada futura | Login bloqueado |
| SUSPENDIDO | Administracion | Evento de seguridad | ACTIVO por proceso autorizado | Login bloqueado |

## 7. Pantallas

| Pantalla | Plantilla | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Login | T3 | Capturar abreviatura y PIN | Entrar | `TextInput`, tokens existentes, teclado PIN existente |
| Cambio obligatorio de PIN | T7 | Sustituir la credencial temporal antes de operar | Confirmar PIN actual, capturar y repetir nuevo PIN, cerrar sesión | Teclado PIN compartido, `PrimaryButton`, `SecondaryButton`, tokens vigentes |
| Menú principal | T8 | Elegir el módulo de trabajo autorizado | Entrar a módulo, cerrar sesión | `ScreenContainer`, `AppHeader`, `ScreenTitleBar`, `ModuleCard` |

## 8. API y persistencia

- Endpoint: `POST /auth/login` con `{ abreviatura, pin }`.
- Endpoint autenticado: `POST /auth/cambiar-pin` con `{ pin_actual, nuevo_pin, confirmacion_pin }`.
- No existe endpoint público para enumerar usuarios o abreviaturas.
- Tabla principal: `usuarios`; relacion operativa: `empleados`.
- Idempotencia: la carga completa se ejecuta en una transaccion y rechaza abreviaturas existentes.
- Auditoria: cada acceso exitoso actualiza `usuarios.ultimo_login` y registra `LOGIN` con resultado, contexto no sensible y método `PIN_INDIVIDUAL` o `PIN_UNIVERSAL_DESARROLLO` en la misma transaccion; nunca registra PIN ni hash. El cambio registra `CAMBIO_PIN` con las marcas anterior/posterior.

## 9. Reglas de negocio

- DEC-016 a DEC-019 de `docs/project/23_DECISION_LOG.md`.
- El PIN universal de desarrollo vive únicamente en `DEV_UNIVERSAL_PIN`, dentro del `.env` local protegido e ignorado por Git; no se incorpora al código ni a los logs.
- La API ignora el PIN universal cuando `NODE_ENV` no es exactamente `development`, cuando la variable falta o cuando no contiene cuatro dígitos.
- En una sesión universal, `requiere_cambio_pin` permanece intacto en PostgreSQL y sólo se omite para esa sesión de desarrollo.
- El cambio conserva el contrato vigente de cuatro dígitos; no establece una política definitiva adicional.
- El nuevo PIN debe diferir del vigente para que la marca obligatoria pueda desactivarse.
- La comision no forma parte de la credencial ni de los permisos.

## 10. Permisos y seguridad

| Accion | Rol | Condicion | Auditoria |
|---|---|---|---|
| Iniciar sesion | ASESOR | Usuario activo y PIN valido | `ultimo_login` + `audit_log.LOGIN` transaccionales |
| Cambiar PIN obligatorio | Usuario autenticado | PIN actual válido, nuevo PIN confirmado y distinto | `audit_log.CAMBIO_PIN` transaccional, sin credenciales |
| Operar modulos | ASESOR | JWT válido y permiso de módulo/acción | Guard global aplicado; auditoría transversal pendiente |

## 11. Estados tecnicos de UI

- Carga: boton bloqueado con indicador.
- Vacio: abreviatura y PIN requeridos.
- Error: mensaje generico de credenciales invalidas.
- Sin conexion: mensaje accionable para revisar conexion.
- Sin permiso: login bloqueado por estado no activo.
- Cambio pendiente: API bloquea módulos y mobile muestra exclusivamente el flujo obligatorio o cerrar sesión.
- Autoguardado: no aplica.

## 12. Casos especiales

- Duplicados: restriccion unica case-insensitive.
- Datos incompletos: la carga se cancela completa.
- Reintentos: la carga no sobrescribe cuentas existentes.
- Navegación interrumpida: `/auth/me` conserva la marca y reabre el cambio obligatorio al restaurar sesión.
- Error de red: el cliente no desactiva la marca ni comunica éxito sin confirmación del servidor.
- Concurrencia: indice unico protege abreviatura.

## 13. Criterios de aceptacion

- [x] No existe PIN en texto plano en PostgreSQL, logs o scripts de carga.
- [x] Los 49 asesores tienen usuario y empleado asociados.
- [x] Todos pertenecen a `MATRIZ`, rol `ASESOR`, zona nula y estado `ACTIVO`.
- [x] `ANA_VAZQUEZ` puede iniciar sesion con el PIN temporal aprobado.
- [x] PIN incorrecto, abreviatura inexistente y usuario inactivo son rechazados.
- [x] El PIN universal configurado permite acceso sólo en desarrollo, no modifica la cuenta y deja auditado el método sin copiar la credencial.
- [x] Producción y pruebas automatizadas sin configuración explícita rechazan el acceso universal.
- [x] API compila y pruebas de autenticacion pasan.
- [x] Los handlers actuales declaran permiso o acceso público/autenticado explícito.
- [x] La API bloquea por defecto rutas protegidas sin permiso y el inicio filtra accesos.
- [x] Cada login comienza en el menú principal y no presenta accesos a módulos sin permiso efectivo.
- [x] Una restricción individual no cambia `rol_nombre`; el encabezado sigue mostrando el rol operativo.
- [x] Los módulos futuros se pueden revisar visualmente en desarrollo como tarjetas deshabilitadas, sin convertirlos en accesos funcionales.
- [x] Un login exitoso deja marca temporal y auditoría en una sola transacción sin copiar la credencial.
- [x] Una cuenta con cambio pendiente no puede operar endpoints funcionales ni abrir el menú.
- [x] El cambio exige PIN actual, confirmación coincidente y un valor nuevo distinto.
- [x] El hash y la marca se actualizan en una transacción con auditoría no sensible.
- [x] La sesión restaurada vuelve al flujo obligatorio hasta que el servidor confirme el cambio.

## 14. Pruebas

- Unitarias: validacion DTO, servicio de login/cambio, acceso universal acotado al entorno de desarrollo, transaccion de auditoria, bloqueo por cambio pendiente y contrato cerrado de permisos.
- Integracion: constraints, conteos y bcrypt sobre una muestra.
- UI/manuales: abreviatura, teclado PIN, carga y error.
- Regresion: JWT y `/auth/me`.

## 15. Decisiones abiertas

- Política adicional del PIN definitivo más allá del contrato vigente de cuatro dígitos.
- Recuperación de PIN y cambio voluntario posterior desde Administración.
- Momento de activar la regla de inactividad basada en grupos.
