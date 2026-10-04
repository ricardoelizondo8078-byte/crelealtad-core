# 12 Security Model - Modelo de Seguridad

Version: 1.11.0
Estado: Vigente
Fecha de actualizacion: 2026-10-04

## Objetivo

Proteger datos de solicitantes, expedientes y decisiones operativas sin frenar flujo de campo.

## Principios

1. Minimo privilegio.
2. Trazabilidad de cambios sensibles.
3. No exposicion de datos innecesarios.
4. Control de acceso por rol.
5. Integridad de historial.

## Capas de seguridad

- Aplicacion: validaciones y autorizacion.
- API: autenticacion de usuario y control de permisos.
- Datos: integridad referencial y auditoria.
- Operacion: segregacion de funciones por rol.

## Modelo de roles inicial

- Asesora.
- Verificacion.
- Analisis.
- Desembolsos.
- Cobranza.
- Administracion.
- Control interno.

## Identidad de acceso para asesores

Decisiones aprobadas el 2026-08-13:

1. La abreviatura operativa es el identificador de inicio de sesion de cada asesor; ejemplo: `ANA_VAZQUEZ`.
2. El correo electronico no es requisito de autenticacion para asesores.
3. Cada abreviatura debe ser unica y conservarse como identidad estable; los cambios requieren trazabilidad.
4. Todos los asesores de la carga inicial pertenecen a la sucursal `MATRIZ`.
5. La zona queda sin asignar en la carga inicial. El modelo debe admitir asignacion futura sin recrear al usuario.
6. Los asesores de la carga inicial se registran como `ACTIVO`.
7. Cuando se reconcilie la base historica de grupos, el estado operativo del asesor se determinara por existencia de grupos activos: sin grupos activos pasa a `INACTIVO`.
8. La fila administrativa `OFNA` de la tabla fuente no representa un asesor y no debe convertirse automaticamente en usuario con rol `ASESOR`.

Estado de implementacion:

- PostgreSQL, API, JWT y mobile ya identifican a los asesores por `usuarios.abreviatura`.
- Los 49 asesores fueron cargados con rol `ASESOR`, sucursal `MATRIZ`, zona nula y estado `ACTIVO`.
- Cada cuenta conserva un hash bcrypt individual; el valor temporal compartido `1234` fue autorizado únicamente para desarrollo y pruebas, con `requiere_cambio_pin = true`.
- No existe bypass universal y los valores sensibles se redactan de los logs.
- El flujo de cambio obligatorio y recuperación del PIN sigue pendiente; el valor temporal debe retirarse antes de producción.
- La regla futura basada en grupos debe ejecutarse mediante un servicio auditable y no mediante una eliminacion de usuarios.
- La API no expone una lista anonima de nombres o abreviaturas; el usuario escribe su identidad de acceso.
- Al reabrir mobile, el token guardado se valida con `/auth/me` antes de restaurar identidad, rol y permisos efectivos.
- Un login exitoso actualiza `ultimo_login` y escribe `LOGIN` con resultado, rol, sucursal y marca de cambio pendiente dentro de la misma transacción; no registra PIN ni abreviatura capturada.

## Alcance de datos por identidad

La autorizacion se evalua en dos niveles independientes:

1. El guard global exige JWT y permiso de modulo/accion.
2. Para `ASESOR`, cada servicio valida la cadena `usuarios.id → empleados.usuario_id → expedientes.asesora_id` antes de leer o modificar expedientes, integrantes, solicitudes o documentos.

Los módulos y acciones aceptados por el código se declaran en un catálogo técnico único. Los permisos
JSONB se normalizan con denegación por defecto y la migración 035 impide arreglos con elementos no
textuales tanto en roles como en excepciones individuales. Esto valida el contrato técnico, pero no
aprueba ni sustituye la matriz funcional definitiva.

Conocer un UUID no concede acceso. La navegacion filtrada ayuda a la usuaria, pero nunca sustituye estas comprobaciones de servidor. El alcance por sucursal/zona y el contrato exacto para otros roles permanecen pendientes de aprobacion funcional.

Los DTO de solicitud tambien aplican minimo privilegio sobre datos: relaciones internas, ciclo, monto autorizado y rutas/fechas documentales son exclusivos del servidor. Campos desconocidos se rechazan y una evidencia sólo existe cuando el almacenamiento confirma manifiesto y archivo.

## Reglas minimas

- Ninguna accion critica sin usuario identificado.
- Ningun cambio de estado sin actor y fecha.
- Ninguna excepcion sin justificacion.
- Ningun borrado fisico de evidencia critica.
- Ninguna abreviatura duplicada o reasignada sin proceso auditado.
- Ningun asesor inactivo puede iniciar sesion ni operar modulos protegidos.
- La comision del asesor es un dato laboral con vigencia; no forma parte del rol ni de la credencial.

## Excepcion temporal de acceso durante desarrollo

DEC-023, aprobada por Direccion el 2026-08-29, permite que todos los usuarios activos
accedan a los modulos ejecutables mientras se completa su desarrollo. En el corte actual,
la cuenta administradora ya tiene comodines globales y el rol `ASESOR` recibe
`verificacion:leer` mediante la migracion 010.

Esta excepcion:

- No habilita usuarios inactivos ni rutas anonimas.
- No retira JWT, el guard global ni la clasificacion modulo-accion de cada endpoint.
- No habilita modulos `Proximamente`, dictamenes o transiciones aun no implementadas.
- Debe sustituirse por la matriz restrictiva definitiva y el alcance territorial antes de produccion.
- Conserva auditoria antes/despues y rollback condicionado para no pisar cambios posteriores.

Una restricción individual autorizada no cambia el rol operativo ni su alcance de datos.
`usuarios.permisos_personalizados` sustituye opcionalmente el conjunto efectivo evaluado por
login, `/auth/me` y el guard; el encabezado continúa mostrando `roles.nombre`.

DEC-033 incorpora la acción mínima `verificacion:registrar` a `ASESOR` y `VERIFICADOR`
para crear intentos de llamada. La lectura de contadores conserva `verificacion:leer`, la
API toma el actor exclusivamente del JWT y la escritura exige que el expediente continúe
`EN_VERIFICACION` y la integrante esté lista. La migración 015 audita el cambio de permisos.

DEC-037 reutiliza esa acción para la encuesta y su evidencia. La API sólo acepta un intento
`CONTESTADA` de la misma integrante, valida los bytes JPEG/PNG y el máximo de 10 MB, guarda el
archivo fuera de PostgreSQL bajo identificadores UUID y expone su lectura únicamente mediante
una ruta autenticada con `verificacion:leer`, `Cache-Control: private, no-store`. PostgreSQL
conserva ruta, tamaño, MIME, SHA-256, actor y fecha, y `audit_log` registra la conclusión o el
pendiente sin incluir la imagen ni datos personales de la integrante.

DEC-039 incorpora ubicación precisa del dispositivo al confirmar `Sí contestó / No contestó`.
La app informa el uso antes de la selección, solicita únicamente permiso en primer plano y
transmite la lectura por la API autenticada. PostgreSQL conserva coordenadas, precisión
horizontal disponible, fecha/hora y fuente general `DISPOSITIVO`; los logs no deben incluir
esos valores. Si no hay permiso, servicios activos o lectura válida, no se crea el intento.
El acceso futuro a reportes de ubicación deberá contar con permiso específico y alcance
territorial aprobados; esa superficie aún no existe.

DEC-047 aplica el mismo principio de minimización al confirmar la respuesta del vecino. Mobile
solicita sólo ubicación en primer plano y la API exige `verificacion:registrar`, JWT, alcance a la
integrante, expediente `EN_VERIFICACION`, coordenadas válidas, fecha de lectura e idempotencia.
La fila histórica conserva el punto preciso, pero el resumen normal sólo devuelve la respuesta
y su fecha. `audit_log` registra actor, integrante, respuesta y fuente sin copiar latitud,
longitud ni precisión. Sin lectura válida o confirmación del servidor, la UI conserva el estado
anterior y no comunica éxito.

DEC-048 exige una fachada antes de continuar. Mobile abre exclusivamente la cámara y solicita
ubicación en primer plano inmediatamente después de la toma; no presenta acceso al carrete. La
API valida bytes JPEG/PNG, tamaño máximo de 10 MB, alcance, estado e idempotencia; conserva el
archivo fuera de PostgreSQL bajo UUID y lo entrega sólo con JWT, `verificacion:leer` y
`Cache-Control: private, no-store`. La tabla guarda hash, actor y punto preciso, mientras el
resumen y `audit_log` omiten coordenadas. El valor `CAMARA` documenta el flujo oficial y no debe
interpretarse como certificación criptográfica del origen físico del archivo.

DEC-049 aplica el mismo control a la evidencia posterior a la pregunta. La API sólo permite
registrarla para la respuesta más reciente de la integrante, valida JPEG/PNG real y máximo de
10 MB y toma al actor exclusivamente del JWT. El archivo vive fuera de PostgreSQL bajo UUID y se
entrega con `verificacion:leer`, alcance a la integrante y `Cache-Control: private, no-store`.
PostgreSQL conserva el punto preciso, pero el resumen y `audit_log` no copian coordenadas. La app
oficial no ofrece carrete; `CAMARA` describe ese flujo y no una certificación forense del cliente.

DEC-056 aplica esos controles a cada imagen del domicilio. La API toma el verificador
exclusivamente del JWT, exige `verificacion:registrar`, alcance y expediente en verificación, y
valida JPEG/PNG real, máximo de 10 MB, tipo controlado, ubicación e idempotencia. PostgreSQL
conserva el punto preciso por toma y la referencia del actor; el archivo vive bajo UUID en
almacenamiento protegido y sólo se entrega con `verificacion:leer` y `private, no-store`. El
resumen operativo y `audit_log` no exponen coordenadas; la consulta geográfica detallada requerirá
un permiso específico y alcance territorial aprobados.

DEC-057 reduce la superficie de captura de M03 y DEC-062 agrega el medidor de luz: fachada y medidor
son obligatorios, mientras fachada con la integrante permanece opcional. El tipo
`NOMENCLATURAS_CALLES` y sus filas históricas no se eliminan: quedan reservados para el módulo que
se defina posteriormente. Las capturas visibles continúan bajo los mismos controles de JWT,
ubicación, almacenamiento protegido e idempotencia.

DEC-063 y DEC-170 protegen cada fotografía propia de Entrevista con JWT, alcance a la integrante,
permiso `verificacion:registrar`, validación de bytes JPEG/PNG, máximo de 10 MB por archivo e
idempotencia por actor. No existe límite de cantidad. El archivo vive bajo UUID fuera de PostgreSQL
y se entrega sólo con `verificacion:leer` y `Cache-Control: private, no-store`; la tabla conserva
hash, actor, fechas, origen `CAMARA`, coordenadas, precisión disponible y fuente `DISPOSITIVO`.
Mobile no ofrece acceso al carrete o galería. La API rechaza capturas nuevas sin ubicación y omite
las coordenadas exactas del evento de auditoría; el legado previo a 031 se conserva sin inventarlas.

## Errores y seguridad

- Mensajes externos no deben exponer detalles internos.
- Logs internos si deben registrar contexto tecnico completo.
- Produccion no inicia sin secreto JWT ni credenciales PostgreSQL explicitas o `DATABASE_URL`.
- TLS de PostgreSQL valida certificados por defecto; una excepcion requiere configuracion explicita.
- El JWT móvil se conserva en SecureStore y se retira del AsyncStorage legacy; un `401` autenticado invalida la sesión local.
- `npm run security:secrets` bloquea credenciales literales en código ejecutable sin imprimir sus valores.
- Scripts administrativos y de migración reciben credenciales y PIN iniciales por variables de entorno y no los registran en consola.
- El entorno local exige contraseña PostgreSQL mediante `scram-sha-256` incluso en loopback; la
  credencial anterior y las conexiones sin contraseña fueron rechazadas después de la rotación del
  2026-10-04.
- `.env` no se versiona y limita su ACL a Admin/SYSTEM. Las pruebas reciben configuración explícita
  y `.env.test.example` sólo contiene marcadores no secretos.
- `main` y `origin/main` conservan los mismos 51 commits saneados; la reescritura remota se ejecutó
  con `force-with-lease` y el repositorio local quedó sin objetos inalcanzables. Existe un bundle
  restaurable verificado. Clones, forks o respaldos previos deben sanearse de forma independiente.

## Seguridad para IA y agentes

- IA no inventa reglas ni altera politicas.
- IA no publica secretos.
- IA documenta decisiones y supuestos.

## Referencias cruzadas

- project/18_CODEX_WORKFLOW.md
- project/13_DEVELOPMENT_STANDARDS.md
- project/09_STATE_MACHINE.md
